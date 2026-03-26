DROP TABLE IF EXISTS "game_participants";
--> statement-breakpoint
DROP TABLE IF EXISTS "games";
--> statement-breakpoint
DROP TABLE IF EXISTS "players";
--> statement-breakpoint
DROP FUNCTION IF EXISTS validate_game_participant_counts();
--> statement-breakpoint
CREATE TABLE "players" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "players_name_key_idx" ON "players" USING btree ("name_key");
--> statement-breakpoint
CREATE TABLE "games" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"played_at" timestamp with time zone DEFAULT now() NOT NULL,
	"format" text NOT NULL,
	"side_a_score" integer NOT NULL,
	"side_b_score" integer NOT NULL,
	"winner_side" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "games_format_check" CHECK ("games"."format" in ('singles', 'doubles')),
	CONSTRAINT "games_winner_side_check" CHECK ("games"."winner_side" in ('A', 'B')),
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
--> statement-breakpoint
CREATE TABLE "game_participants" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"game_id" bigint NOT NULL REFERENCES "games"("id") ON DELETE restrict,
	"player_id" bigint NOT NULL REFERENCES "players"("id") ON DELETE restrict,
	"side" text NOT NULL,
	"slot" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_participants_side_check" CHECK ("game_participants"."side" in ('A', 'B')),
	CONSTRAINT "game_participants_slot_check" CHECK ("game_participants"."slot" in (1, 2))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "game_participants_game_side_slot_idx" ON "game_participants" USING btree ("game_id","side","slot");
--> statement-breakpoint
CREATE UNIQUE INDEX "game_participants_game_player_idx" ON "game_participants" USING btree ("game_id","player_id");
--> statement-breakpoint
CREATE INDEX "game_participants_game_idx" ON "game_participants" USING btree ("game_id");
--> statement-breakpoint
CREATE INDEX "game_participants_player_idx" ON "game_participants" USING btree ("player_id");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION validate_game_participant_counts()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
	target_game_id bigint;
	required_count integer;
	side_a_count integer;
	side_b_count integer;
BEGIN
	IF TG_TABLE_NAME = 'games' THEN
		target_game_id := COALESCE(NEW.id, OLD.id);
	ELSE
		target_game_id := COALESCE(NEW.game_id, OLD.game_id);
	END IF;

	SELECT CASE WHEN format = 'singles' THEN 1 ELSE 2 END
	INTO required_count
	FROM games
	WHERE id = target_game_id;

	IF required_count IS NULL THEN
		RETURN COALESCE(NEW, OLD);
	END IF;

	SELECT COUNT(*) INTO side_a_count
	FROM game_participants
	WHERE game_id = target_game_id AND side = 'A';

	SELECT COUNT(*) INTO side_b_count
	FROM game_participants
	WHERE game_id = target_game_id AND side = 'B';

	IF side_a_count <> required_count OR side_b_count <> required_count THEN
		RAISE EXCEPTION 'Game % requires % participants on each side.', target_game_id, required_count;
	END IF;

	RETURN COALESCE(NEW, OLD);
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER "game_participants_count_check_after_insert"
AFTER INSERT ON "game_participants"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION validate_game_participant_counts();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER "game_participants_count_check_after_update"
AFTER UPDATE ON "game_participants"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION validate_game_participant_counts();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER "game_participants_count_check_after_delete"
AFTER DELETE ON "game_participants"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION validate_game_participant_counts();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER "game_participants_count_check_after_game_update"
AFTER UPDATE OF "format" ON "games"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION validate_game_participant_counts();
