CREATE TABLE "games" (
	"id" text PRIMARY KEY NOT NULL,
	"played_at" timestamp with time zone NOT NULL,
	"format" text NOT NULL,
	"side_a_player_ids" text[] NOT NULL,
	"side_b_player_ids" text[] NOT NULL,
	"side_a_score" integer NOT NULL,
	"side_b_score" integer NOT NULL,
	"winner_side" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "games_format_check" CHECK ("games"."format" in ('singles', 'doubles')),
	CONSTRAINT "games_winner_side_check" CHECK ("games"."winner_side" in ('A', 'B'))
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "players_name_lower_idx" ON "players" USING btree (lower("name"));