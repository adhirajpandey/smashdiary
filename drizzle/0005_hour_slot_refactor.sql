ALTER TABLE "games" RENAME COLUMN "played_at" TO "played_on";--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "played_on" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "played_on" TYPE date USING "played_on"::date;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "slot" text;--> statement-breakpoint
UPDATE "games" SET "slot" = '8 PM' WHERE "slot" IS NULL;--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "slot" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_slot_check" CHECK ("slot" in ('12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM'));
