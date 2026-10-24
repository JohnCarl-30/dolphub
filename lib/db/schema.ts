import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

/** Anyone who has signed in with an allowed PCU email address. */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Always stored lowercase. */
  email: text("email").notNull().unique(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: createdAt(),
  /** Set as the first step of account deletion, so public pages vanish at once. */
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

/** Fixed list of tech programs, maintained by the admin. */
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  active: boolean("active").notNull().default(true),
});

/** One public portfolio per user, served at /u/<handle>. */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Lowercase and permanent once chosen. */
    handle: text("handle").notNull().unique(),
    displayName: text("display_name").notNull(),
    tagline: text("tagline").notNull().default(""),
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id),
    messengerUrl: text("messenger_url"),
    /** The username only. The link is always built as https://github.com/<username>. */
    githubUsername: text("github_username"),
    /** Shown publicly, so it is opt-in. Always lowercase, and separate from users.email. */
    contactEmail: text("contact_email"),
    /** Preview image override. Null means the first image of the first project. */
    coverImageId: uuid("cover_image_id").references((): AnyPgColumn => images.id, {
      onDelete: "set null",
    }),
    isHidden: boolean("is_hidden").notNull().default(false),
    /** The student's "show my page in search engines" setting. On by default. */
    searchVisible: boolean("search_visible").notNull().default(true),
    hiddenReason: text("hidden_reason"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("profiles_created_at_idx").on(t.createdAt)],
);

/** One optional public portrait for each student's profile. Image bytes live in R2. */
export const profilePictures = pgTable(
  "profile_pictures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .unique()
      .references(() => profiles.id, { onDelete: "cascade" }),
    r2Key: text("r2_key").notNull().unique(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    bytes: integer("bytes").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("profile_pictures_profile_id_idx").on(t.profileId)],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    demoUrl: text("demo_url"),
    sourceUrl: text("source_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("projects_profile_id_idx").on(t.profileId)],
);

/** Image bytes live in R2. Only the key and size are stored here. */
export const images = pgTable(
  "images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    /** Copied from the project so the per-student cap is one cheap count. */
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    r2Key: text("r2_key").notNull().unique(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    bytes: integer("bytes").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    index("images_profile_id_idx").on(t.profileId),
    index("images_project_id_idx").on(t.projectId),
  ],
);

/** Single-row table for site-wide switches. */
export const appSettings = pgTable(
  "app_settings",
  {
    id: integer("id").primaryKey().default(1),
    signupsFrozen: boolean("signups_frozen").notNull().default(false),
    updatedAt: updatedAt(),
  },
  (t) => [check("app_settings_single_row", sql`${t.id} = 1`)],
);

/** Every admin write is recorded here. Targets are ids, not names. */
export const adminAuditLog = pgTable("admin_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  target: text("target").notNull(),
  reason: text("reason"),
  createdAt: createdAt(),
});

/** One row per emailed sign-in link. Only a hash of the link's token is stored. */
export const loginTokens = pgTable(
  "login_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    /** Keyed hash of the requester's network, for the per-network limit. Never the raw IP. */
    requesterHash: text("requester_hash"),
    createdAt: createdAt(),
  },
  (t) => [
    index("login_tokens_email_created_idx").on(t.email, t.createdAt),
    index("login_tokens_created_idx").on(t.createdAt),
    index("login_tokens_requester_created_idx").on(t.requesterHash, t.createdAt),
  ],
);

/** Signed-in browser sessions. The cookie holds the token; only its hash is stored. */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

/** Internships, events, competitions and programs. Admins post them, and each links out. */
export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Stable public address, such as accenture-software-intern-k3f9. Never changes. */
    slug: text("slug").notNull().unique(),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    organization: text("organization").notNull(),
    summary: text("summary").notNull(),
    /** Where to apply or register. */
    url: text("url").notNull(),
    locationType: text("location_type").notNull().default("onsite"),
    location: text("location"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    deadline: timestamp("deadline", { withTimezone: true }),
    /** When it leaves the list. Worked out from the dates on every write. */
    closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
    isHidden: boolean("is_hidden").notNull().default(false),
    hiddenReason: text("hidden_reason"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("opportunities_kind", sql`${t.kind} in ('internship', 'event', 'competition', 'program')`),
    check("opportunities_location_type", sql`${t.locationType} in ('onsite', 'online', 'hybrid')`),
    index("opportunities_open_idx").on(t.isHidden, t.closesAt),
  ],
);
