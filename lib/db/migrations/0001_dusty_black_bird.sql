ALTER TABLE "courses" ADD COLUMN "time_spent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "activity_map" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "total_time_spent" integer DEFAULT 0 NOT NULL;