import {
  bigint,
  bigserial,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const players = pgTable(
  "players",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    name: text("name").notNull(),
    nameKey: text("name_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("players_name_key_idx").on(table.nameKey)],
);

export const games = pgTable(
  "games",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    playedAt: timestamp("played_at", { mode: "string" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'`),
    format: text("format").notNull(),
    sideAScore: integer("side_a_score").notNull(),
    sideBScore: integer("side_b_score").notNull(),
    winnerSide: text("winner_side").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    check("games_format_check", sql`${table.format} in ('singles', 'doubles')`),
    check("games_winner_side_check", sql`${table.winnerSide} in ('A', 'B')`),
    check("games_score_bounds_check", sql`${table.sideAScore} between 0 and 30 and ${table.sideBScore} between 0 and 30`),
    check("games_no_tie_check", sql`${table.sideAScore} <> ${table.sideBScore}`),
    check(
      "games_winner_consistency_check",
      sql`(${table.winnerSide} = 'A' and ${table.sideAScore} > ${table.sideBScore}) or (${table.winnerSide} = 'B' and ${table.sideBScore} > ${table.sideAScore})`,
    ),
    check(
      "games_finish_rule_check",
      sql`
        greatest(${table.sideAScore}, ${table.sideBScore}) >= 21
        and (
          (greatest(${table.sideAScore}, ${table.sideBScore}) = 21 and least(${table.sideAScore}, ${table.sideBScore}) <= 19)
          or (
            greatest(${table.sideAScore}, ${table.sideBScore}) between 22 and 29
            and greatest(${table.sideAScore}, ${table.sideBScore}) - least(${table.sideAScore}, ${table.sideBScore}) = 2
          )
          or (
            greatest(${table.sideAScore}, ${table.sideBScore}) = 30
            and least(${table.sideAScore}, ${table.sideBScore}) = 29
          )
        )
      `,
    ),
  ],
);

export const gameParticipants = pgTable(
  "game_participants",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    gameId: bigint("game_id", { mode: "number" })
      .notNull()
      .references(() => games.id, { onDelete: "restrict" }),
    playerId: bigint("player_id", { mode: "number" })
      .notNull()
      .references(() => players.id, { onDelete: "restrict" }),
    side: text("side").notNull(),
    slot: integer("slot").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    check("game_participants_side_check", sql`${table.side} in ('A', 'B')`),
    check("game_participants_slot_check", sql`${table.slot} in (1, 2)`),
    uniqueIndex("game_participants_game_side_slot_idx").on(table.gameId, table.side, table.slot),
    uniqueIndex("game_participants_game_player_idx").on(table.gameId, table.playerId),
    index("game_participants_game_idx").on(table.gameId),
    index("game_participants_player_idx").on(table.playerId),
  ],
);
