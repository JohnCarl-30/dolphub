CREATE TABLE "analytics_dedupe" (
	"visitor_key" text NOT NULL,
	"profile_id" uuid NOT NULL,
	"day" date NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "analytics_dedupe_visitor_key_profile_id_day_pk" PRIMARY KEY("visitor_key","profile_id","day")
);
--> statement-breakpoint
CREATE TABLE "profile_link_clicks_daily" (
	"profile_id" uuid NOT NULL,
	"day" date NOT NULL,
	"kind" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "profile_link_clicks_daily_profile_id_day_kind_pk" PRIMARY KEY("profile_id","day","kind"),
	CONSTRAINT "profile_link_clicks_kind" CHECK ("profile_link_clicks_daily"."kind" in ('github','messenger','email'))
);
--> statement-breakpoint
CREATE TABLE "profile_views_daily" (
	"profile_id" uuid NOT NULL,
	"day" date NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"unique_visitors" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "profile_views_daily_profile_id_day_pk" PRIMARY KEY("profile_id","day")
);
--> statement-breakpoint
CREATE TABLE "project_clicks_daily" (
	"project_id" uuid NOT NULL,
	"day" date NOT NULL,
	"kind" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "project_clicks_daily_project_id_day_kind_pk" PRIMARY KEY("project_id","day","kind"),
	CONSTRAINT "project_clicks_kind" CHECK ("project_clicks_daily"."kind" in ('demo','source'))
);
--> statement-breakpoint
CREATE TABLE "view_sources_daily" (
	"profile_id" uuid NOT NULL,
	"day" date NOT NULL,
	"source" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "view_sources_daily_profile_id_day_source_pk" PRIMARY KEY("profile_id","day","source"),
	CONSTRAINT "view_sources_source" CHECK ("view_sources_daily"."source" in ('showcase','search','share','external','direct'))
);
--> statement-breakpoint
ALTER TABLE "analytics_dedupe" ADD CONSTRAINT "analytics_dedupe_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_link_clicks_daily" ADD CONSTRAINT "profile_link_clicks_daily_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_views_daily" ADD CONSTRAINT "profile_views_daily_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_clicks_daily" ADD CONSTRAINT "project_clicks_daily_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_sources_daily" ADD CONSTRAINT "view_sources_daily_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_dedupe_expiry_idx" ON "analytics_dedupe" USING btree ("expires_at");