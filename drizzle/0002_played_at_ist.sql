ALTER TABLE "games" ALTER COLUMN "played_at" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "games"
ALTER COLUMN "played_at" TYPE timestamp
USING "played_at" AT TIME ZONE 'UTC';
--> statement-breakpoint
ALTER TABLE "games"
ALTER COLUMN "played_at" SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');
