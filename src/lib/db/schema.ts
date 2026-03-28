import {
  bigint,
  bigserial,
  check,
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
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("players_name_lower_idx").on(sql`lower(${table.name})`)],
);

export const games = pgTable(
  "games",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    playedAt: timestamp("played_at", { mode: "string" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'`),
    format: text("format").notNull(),
    sideAPlayer1Id: bigint("side_a_player_1_id", { mode: "number" })
      .notNull()
      .references(() => players.id, { onDelete: "restrict" }),
    sideAPlayer2Id: bigint("side_a_player_2_id", { mode: "number" })
      .references(() => players.id, { onDelete: "restrict" }),
    sideBPlayer1Id: bigint("side_b_player_1_id", { mode: "number" })
      .notNull()
      .references(() => players.id, { onDelete: "restrict" }),
    sideBPlayer2Id: bigint("side_b_player_2_id", { mode: "number" })
      .references(() => players.id, { onDelete: "restrict" }),
    sideAScore: integer("side_a_score").notNull(),
    sideBScore: integer("side_b_score").notNull(),
    winnerSide: text("winner_side").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    check("games_format_check", sql`${table.format} in ('singles', 'doubles')`),
    check("games_winner_side_check", sql`${table.winnerSide} in ('A', 'B')`),
    check(
      "games_roster_shape_check",
      sql`
        (${table.format} = 'singles' and ${table.sideAPlayer2Id} is null and ${table.sideBPlayer2Id} is null)
        or
        (${table.format} = 'doubles' and ${table.sideAPlayer2Id} is not null and ${table.sideBPlayer2Id} is not null)
      `,
    ),
    check(
      "games_unique_players_check",
      sql`
        (${table.sideAPlayer2Id} is null or ${table.sideAPlayer1Id} <> ${table.sideAPlayer2Id})
        and ${table.sideAPlayer1Id} <> ${table.sideBPlayer1Id}
        and (${table.sideBPlayer2Id} is null or ${table.sideAPlayer1Id} <> ${table.sideBPlayer2Id})
        and (${table.sideAPlayer2Id} is null or ${table.sideAPlayer2Id} <> ${table.sideBPlayer1Id})
        and (${table.sideAPlayer2Id} is null or ${table.sideBPlayer2Id} is null or ${table.sideAPlayer2Id} <> ${table.sideBPlayer2Id})
        and (${table.sideBPlayer2Id} is null or ${table.sideBPlayer1Id} <> ${table.sideBPlayer2Id})
      `,
    ),
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
