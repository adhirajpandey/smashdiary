DROP INDEX "players_name_key_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "players_name_lower_idx" ON "players" USING btree (lower("name"));--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "name_key";