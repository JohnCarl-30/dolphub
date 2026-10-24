import sharp from "sharp";
import { beforeEach, describe, expect, it } from "vitest";
import { getOwnDashboard } from "./services/dashboard";
import { IMAGE_LIMITS } from "./services/images";
import { createProfile } from "./services/profiles";
import { createProject } from "./services/projects";
import { createTestContext, type TestEnv } from "./test/helpers";
import { createProfilePictureRoute, createUploadRoute } from "./upload-route";

const APP = "https://dolphub.tech";

const png = () =>
  sharp({ create: { width: 64, height: 48, channels: 3, background: "#3366cc" } }).png().toBuffer();

function upload(form: FormData, headers: Record<string, string> = { origin: APP }) {
  return new Request(`${APP}/api/upload`, { method: "POST", body: form, headers });
}

function formWith(projectId: string, image: Blob | string) {
  const form = new FormData();
  form.set("projectId", projectId);
  form.set("image", image);
  return form;
}

describe("upload route", () => {
  let env: TestEnv;
  let user: { id: string } | null;
  let refreshed: string[];
  let POST: ReturnType<typeof createUploadRoute>;
  let projectId: string;

  beforeEach(async () => {
    env = await createTestContext();
    const u = await env.createUser();
    user = u;
    refreshed = [];
    POST = createUploadRoute({
      context: async () => env.ctx,
      currentUser: async () => user,
      appUrl: APP,
      refresh: (handle) => refreshed.push(handle),
    });
    await createProfile(env.db, u.id, { handle: "juan", displayName: "Juan Cruz", courseId: env.courseId });
    projectId = (await createProject(env.db, u.id, { title: "Seat finder" })).project.id;
  });

  it("stores the photo on the project and refreshes the public page", async () => {
    const response = await POST(upload(formWith(projectId, new Blob([await png()], { type: "image/png" }))));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, data: { image: { width: 64, height: 48 } } });
    expect(body.data.image.url).toMatch(/^https:\/\/images\.test\/profiles\/.+\.webp$/);
    expect(refreshed).toEqual(["juan"]);

    const dashboard = await getOwnDashboard(env.ctx, user!.id);
    expect(dashboard.projects[0]!.images.map((i) => i.id)).toEqual([body.data.image.id]);
    expect(env.storage.objects.size).toBe(1);
  });

  it("refuses other origins and signed-out visitors before reading the body", async () => {
    const form = formWith(projectId, new Blob([await png()], { type: "image/png" }));
    expect((await POST(upload(form, { origin: "https://evil.example" }))).status).toBe(403);
    expect((await POST(upload(form, {}))).status).toBe(403);

    user = null;
    const signedOut = await POST(upload(form));
    expect(signedOut.status).toBe(401);
    expect(await signedOut.json()).toEqual({ ok: false, error: "Your session ended. Sign in again to add photos." });
    expect(env.storage.objects.size).toBe(0);
  });

  it("turns service rules into messages with the right status", async () => {
    const notImage = await POST(upload(formWith(projectId, new Blob(["hello"], { type: "image/png" }))));
    expect(notImage.status).toBe(400);
    expect(await notImage.json()).toEqual({ ok: false, error: "That file is not an image we can read.", field: "image" });

    const stranger = await env.createUser();
    await createProfile(env.db, stranger.id, { handle: "ana", displayName: "Ana", courseId: env.courseId });
    user = stranger;
    const notTheirs = await POST(upload(formWith(projectId, new Blob([await png()], { type: "image/png" }))));
    expect(notTheirs.status).toBe(404);
    expect(refreshed).toEqual([]);
  });

  it("rejects a missing file and files over 4 MB", async () => {
    const missing = await POST(upload(formWith(projectId, "")));
    expect(missing.status).toBe(400);
    expect(await missing.json()).toMatchObject({ error: "Choose a photo to upload.", field: "image" });

    const huge = new Blob([new Uint8Array(IMAGE_LIMITS.maxUploadBytes + 1)], { type: "image/jpeg" });
    expect((await POST(upload(formWith(projectId, huge)))).status).toBe(413);

    const declared = new Request(`${APP}/api/upload`, {
      method: "POST",
      body: "x",
      headers: { origin: APP, "content-length": String(20 * 1024 * 1024) },
    });
    expect((await POST(declared)).status).toBe(413);
  });

  it("reports the 10-photo cap", async () => {
    const bytes = await png();
    for (let i = 0; i < IMAGE_LIMITS.maxImagesPerProfile; i++) {
      expect((await POST(upload(formWith(projectId, new Blob([bytes], { type: "image/png" }))))).status).toBe(201);
    }
    const over = await POST(upload(formWith(projectId, new Blob([bytes], { type: "image/png" }))));
    expect(over.status).toBe(409);
    expect((await over.json()).error).toMatch(/up to 10 images/);
  });
});

describe("profile-picture upload route", () => {
  let env: TestEnv;
  let user: { id: string } | null;
  let refreshed: string[];
  let POST: ReturnType<typeof createProfilePictureRoute>;

  beforeEach(async () => {
    env = await createTestContext();
    const u = await env.createUser();
    user = u;
    refreshed = [];
    POST = createProfilePictureRoute({
      context: async () => env.ctx,
      currentUser: async () => user,
      appUrl: APP,
      refresh: (handle) => refreshed.push(handle),
    });
    await createProfile(env.db, u.id, { handle: "portrait", displayName: "Portrait", courseId: env.courseId });
  });

  function portrait(image: Blob | string) {
    const form = new FormData();
    form.set("image", image);
    return form;
  }

  it("stores and replaces the student's public portrait", async () => {
    const first = await POST(upload(portrait(new Blob([await png()], { type: "image/png" }))));
    expect(first.status).toBe(201);
    const firstBody = await first.json();
    expect(firstBody.data.image.url).toMatch(/profile-picture-.+\.webp$/);

    const second = await POST(upload(portrait(new Blob([await png()], { type: "image/png" }))));
    expect(second.status).toBe(201);
    expect((await second.json()).data.image.id).toBe(firstBody.data.image.id);
    expect(refreshed).toEqual(["portrait", "portrait"]);
    expect(env.storage.objects.size).toBe(1);
  });

  it("refuses cross-origin, signed-out, malformed, and oversized portrait uploads", async () => {
    const photo = new Blob([await png()], { type: "image/png" });
    expect((await POST(upload(portrait(photo), { origin: "https://evil.example" }))).status).toBe(403);
    user = null;
    expect((await POST(upload(portrait(photo)))).status).toBe(401);

    user = await env.createUser();
    await createProfile(env.db, user.id, { handle: "second", displayName: "Second", courseId: env.courseId });
    expect((await POST(upload(portrait("")))).status).toBe(400);
    const huge = new Blob([new Uint8Array(IMAGE_LIMITS.maxUploadBytes + 1)], { type: "image/jpeg" });
    expect((await POST(upload(portrait(huge)))).status).toBe(413);
  });
});
