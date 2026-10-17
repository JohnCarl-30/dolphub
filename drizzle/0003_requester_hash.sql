ALTER TABLE "login_tokens" ADD COLUMN "requester_hash" text;--> statement-breakpoint
CREATE INDEX "login_tokens_requester_created_idx" ON "login_tokens" USING btree ("requester_hash","created_at");