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
    /** Preview image override. Null means the first image of the first project. */
    coverImageId: uuid("cover_image_id").references((): AnyPgColumn => images.id, {
      onDelete: "set null",
    }),
    isHidden: boolean("is_hidden").notNull().default(false),
    hiddenReason: text("hidden_reason"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("profiles_created_at_idx").on(t.createdAt)],
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
