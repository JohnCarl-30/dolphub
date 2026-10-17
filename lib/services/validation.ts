import { z } from "zod";
import { ServiceError } from "./errors";

/** Turns a Zod failure into a ServiceError naming the first bad field. */
export function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  const field = issue?.path.join(".") || undefined;
  throw new ServiceError("VALIDATION", issue?.message ?? "Invalid input", field);
}

const trimmed = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters`);

/** An https link, with no credentials embedded in it. */
export const httpsUrl = z
  .string()
  .trim()
  .max(500, "Link must be at most 500 characters")
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  }, "Link must be a full https:// address");

const MESSENGER_HOSTS = new Set(["m.me", "messenger.com", "www.messenger.com"]);

/** Only real Messenger links, so a profile cannot point visitors at a phishing page. */
export const messengerUrl = httpsUrl.refine(
  (value) => MESSENGER_HOSTS.has(new URL(value).hostname.toLowerCase()),
  "Messenger link must start with https://m.me/ or https://www.messenger.com/",
);

/** Empty strings from forms become null. */
export const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" ? null : v), schema.nullable().optional());

export const displayName = trimmed(60, "Name").min(1, "Name is required");
export const tagline = trimmed(100, "Tagline");
export const projectTitle = trimmed(80, "Title").min(1, "Title is required");
export const projectDescription = trimmed(1000, "Description");
