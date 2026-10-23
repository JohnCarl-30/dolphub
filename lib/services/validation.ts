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

/**
 * Adds https:// to a link typed without a scheme, such as "jeep.example.com"
 * or "m.me/juan". A link with any other scheme, including http://, is left
 * alone for httpsUrl to reject.
 */
export function withHttps(value: string): string {
  return value && !/^[a-z][a-z0-9+.-]*:/i.test(value) ? `https://${value}` : value;
}

/** An https link, with no credentials embedded in it. A link typed without https:// gets it added. */
export const httpsUrl = z
  .string()
  .trim()
  .transform(withHttps)
  .refine((value) => value.length <= 500, "Link must be at most 500 characters")
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

const GITHUB_PROFILE_PREFIX = /^(?:https:\/\/)?(?:www\.)?github\.com\//i;
/** 1 to 39 letters, digits or single hyphens, with no hyphen at either end. */
const GITHUB_USERNAME = /^(?!-)(?!.*--)[a-z0-9-]{1,39}(?<!-)$/i;

/** A GitHub username, typed bare or pasted as a profile link. Stored as the username only. */
export const githubUsername = z
  .string()
  .trim()
  .transform((value) => value.replace(GITHUB_PROFILE_PREFIX, "").replace(/\/$/, ""))
  .refine(
    (value) => GITHUB_USERNAME.test(value),
    "Enter your GitHub username, such as octocat, or your github.com profile link",
  );

/** A public contact address. Any domain, since students may prefer a personal one. */
export const contactEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email must be at most 254 characters")
  .pipe(z.email("Enter a valid email address"));

/** Empty strings from forms become null. */
export const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" ? null : v), schema.nullable().optional());

export const displayName = trimmed(60, "Name").min(1, "Name is required");
export const tagline = trimmed(100, "Tagline");
export const projectTitle = trimmed(80, "Title").min(1, "Title is required");
export const projectDescription = trimmed(1000, "Description");
