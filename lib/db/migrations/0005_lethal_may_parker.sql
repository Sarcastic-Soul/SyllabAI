CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"order_id" text NOT NULL,
	"payment_id" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	CONSTRAINT "payments_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pro_until" timestamp;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_user_idx" ON "payments" USING btree ("user_id");