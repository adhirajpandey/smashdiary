DROP TABLE IF EXISTS "game_participants";
--> statement-breakpoint
DROP TABLE IF EXISTS "games";
--> statement-breakpoint
CREATE TABLE "games" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"played_at" timestamp DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata') NOT NULL,
	"format" text NOT NULL,
	"side_a_player_1_id" bigint NOT NULL REFERENCES "players"("id") ON DELETE restrict,
	"side_a_player_2_id" bigint REFERENCES "players"("id") ON DELETE restrict,
	"side_b_player_1_id" bigint NOT NULL REFERENCES "players"("id") ON DELETE restrict,
	"side_b_player_2_id" bigint REFERENCES "players"("id") ON DELETE restrict,
	"side_a_score" integer NOT NULL,
	"side_b_score" integer NOT NULL,
	"winner_side" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "games_format_check" CHECK ("games"."format" in ('singles', 'doubles')),
	CONSTRAINT "games_winner_side_check" CHECK ("games"."winner_side" in ('A', 'B')),
	CONSTRAINT "games_roster_shape_check" CHECK (
		("games"."format" = 'singles' and "games"."side_a_player_2_id" is null and "games"."side_b_player_2_id" is null)
		or
		("games"."format" = 'doubles' and "games"."side_a_player_2_id" is not null and "games"."side_b_player_2_id" is not null)
	),
	CONSTRAINT "games_unique_players_check" CHECK (
		("games"."side_a_player_2_id" is null or "games"."side_a_player_1_id" <> "games"."side_a_player_2_id")
		and "games"."side_a_player_1_id" <> "games"."side_b_player_1_id"
		and ("games"."side_b_player_2_id" is null or "games"."side_a_player_1_id" <> "games"."side_b_player_2_id")
		and ("games"."side_a_player_2_id" is null or "games"."side_a_player_2_id" <> "games"."side_b_player_1_id")
		and ("games"."side_a_player_2_id" is null or "games"."side_b_player_2_id" is null or "games"."side_a_player_2_id" <> "games"."side_b_player_2_id")
		and ("games"."side_b_player_2_id" is null or "games"."side_b_player_1_id" <> "games"."side_b_player_2_id")
	),
	CONSTRAINT "games_score_bounds_check" CHECK ("games"."side_a_score" between 0 and 30 and "games"."side_b_score" between 0 and 30),
	CONSTRAINT "games_no_tie_check" CHECK ("games"."side_a_score" <> "games"."side_b_score"),
	CONSTRAINT "games_winner_consistency_check" CHECK (
		("games"."winner_side" = 'A' and "games"."side_a_score" > "games"."side_b_score")
		or
		("games"."winner_side" = 'B' and "games"."side_b_score" > "games"."side_a_score")
	),
	CONSTRAINT "games_finish_rule_check" CHECK (
		greatest("games"."side_a_score", "games"."side_b_score") >= 21
		and (
			(greatest("games"."side_a_score", "games"."side_b_score") = 21 and least("games"."side_a_score", "games"."side_b_score") <= 19)
			or (
				greatest("games"."side_a_score", "games"."side_b_score") between 22 and 29
				and greatest("games"."side_a_score", "games"."side_b_score") - least("games"."side_a_score", "games"."side_b_score") = 2
			)
			or (
				greatest("games"."side_a_score", "games"."side_b_score") = 30
				and least("games"."side_a_score", "games"."side_b_score") = 29
			)
		)
	)
);
