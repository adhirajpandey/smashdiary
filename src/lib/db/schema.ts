import {
  bigint,
  bigserial,
  check,
  date,
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
    playedOn: date("played_on", { mode: "string" }).notNull(),
    slot: text("slot").notNull(),
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
    check(
      "games_slot_check",
      sql`${table.slot} in ('12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM')`,
    ),
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
