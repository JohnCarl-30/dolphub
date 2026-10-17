CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"organization" text NOT NULL,
	"summary" text NOT NULL,
	"url" text NOT NULL,
	"location_type" text DEFAULT 'onsite' NOT NULL,
	"location" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"deadline" timestamp with time zone,
	"closes_at" timestamp with time zone NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"hidden_reason" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "opportunities_slug_unique" UNIQUE("slug"),
	CONSTRAINT "opportunities_kind" CHECK ("opportunities"."kind" in ('internship', 'event', 'competition', 'program')),
	CONSTRAINT "opportunities_location_type" CHECK ("opportunities"."location_type" in ('onsite', 'online', 'hybrid'))
);
--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "opportunities_open_idx" ON "opportunities" USING btree ("is_hidden","closes_at");