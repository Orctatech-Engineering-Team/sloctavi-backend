ALTER TABLE "professional_services" ALTER COLUMN "professional_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "professional_services" ALTER COLUMN "service_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "service_tags" ALTER COLUMN "service_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "service_tags" ALTER COLUMN "tag_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "email_type" UNIQUE("email","type");