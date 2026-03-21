import { check, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const players = pgTable(
  "players",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
  },
  (table) => [uniqueIndex("players_name_lower_idx").on(sql`lower(${table.name})`)],
);

export const games = pgTable(
  "games",
  {
    id: text("id").primaryKey(),
    playedAt: timestamp("played_at", { withTimezone: true, mode: "string" }).notNull(),
    format: text("format").notNull(),
    sideAPlayerIds: text("side_a_player_ids").array().notNull(),
    sideBPlayerIds: text("side_b_player_ids").array().notNull(),
    sideAScore: integer("side_a_score").notNull(),
    sideBScore: integer("side_b_score").notNull(),
    winnerSide: text("winner_side").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
  },
  (table) => [
    check("games_format_check", sql`${table.format} in ('singles', 'doubles')`),
    check("games_winner_side_check", sql`${table.winnerSide} in ('A', 'B')`),
  ],
);
