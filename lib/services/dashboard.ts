import { asc, eq } from "drizzle-orm";
import { images, profiles, projects } from "../db/schema";
import type { ServiceContext } from "./context";
import { IMAGE_LIMITS } from "./images";
import { listActiveCourses, type PublicImage } from "./profiles";

export interface DashboardProject {
  id: string;
  title: string;
  description: string;
  demoUrl: string | null;
  sourceUrl: string | null;
  sortOrder: number;
  images: PublicImage[];
}

export interface Dashboard {
  /** Null until the student creates a profile. Show the create form then. */
  profile: {
    handle: string;
    displayName: string;
    tagline: string;
    courseId: number;
    messengerUrl: string | null;
    coverImageId: string | null;
    /** When true, show the owner a notice. Visitors cannot see the page. */
    isHidden: boolean;
    hiddenReason: string | null;
  } | null;
  projects: DashboardProject[];
  imageCount: number;
  imageLimit: number;
  courses: { id: number; name: string }[];
}

/** Everything the signed-in student's dashboard shows, including hidden state the public never sees. */
export async function getOwnDashboard(ctx: ServiceContext, userId: string): Promise<Dashboard> {
  const courses = await listActiveCourses(ctx.db);
  const [profile] = await ctx.db.select().from(profiles).where(eq(profiles.userId, userId));
  if (!profile) {
    return { profile: null, projects: [], imageCount: 0, imageLimit: IMAGE_LIMITS.maxImagesPerProfile, courses };
  }

  const [projectRows, imageRows] = await Promise.all([
    ctx.db
      .select()
      .from(projects)
      .where(eq(projects.profileId, profile.id))
      .orderBy(asc(projects.sortOrder), asc(projects.createdAt)),
    ctx.db
      .select()
      .from(images)
      .where(eq(images.profileId, profile.id))
      .orderBy(asc(images.sortOrder), asc(images.createdAt)),
  ]);

  return {
    profile: {
      handle: profile.handle,
      displayName: profile.displayName,
      tagline: profile.tagline,
      courseId: profile.courseId,
      messengerUrl: profile.messengerUrl,
      coverImageId: profile.coverImageId,
      isHidden: profile.isHidden,
      hiddenReason: profile.hiddenReason,
    },
    projects: projectRows.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      demoUrl: p.demoUrl,
      sourceUrl: p.sourceUrl,
      sortOrder: p.sortOrder,
      images: imageRows
        .filter((i) => i.projectId === p.id)
        .map((i) => ({ id: i.id, url: ctx.storage.publicUrl(i.r2Key), width: i.width, height: i.height })),
    })),
    imageCount: imageRows.length,
    imageLimit: IMAGE_LIMITS.maxImagesPerProfile,
    courses,
  };
}
