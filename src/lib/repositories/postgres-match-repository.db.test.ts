import { getSqlClient } from "@/lib/db";
import { MatchNotFoundError } from "@/lib/match-errors";
import { postgresMatchRepository } from "@/lib/repositories/postgres-match-repository";
import type { SaveMatchInput } from "@/lib/repositories/types";

const runId = Date.now().toString(36);

function uniqueName(prefix: string) {
  return `${prefix} ${runId}${Math.random().toString(36).slice(2, 6)}`;
}

function singlesMatch(sideAPlayer: string, sideBPlayer: string): SaveMatchInput {
  return {
    playedOn: "2026-03-29",
    slot: "9 AM",
    format: "singles",
    sideAScore: 21,
    sideBScore: 18,
    sideAPlayers: [sideAPlayer],
    sideBPlayers: [sideBPlayer],
    winnerSide: "A",
  };
}

async function countPlayers() {
  const [row] = await getSqlClient()<{ count: number }[]>`SELECT count(*)::int AS count FROM players`;
  return row.count;
}

async function waitForBlockedQuery() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const [row] = await getSqlClient()<{ count: number }[]>`
      SELECT count(*)::int AS count
      FROM pg_stat_activity
      WHERE datname = current_database() AND wait_event_type = 'Lock'
    `;

    if (row.count > 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  throw new Error("saveMatch never blocked on the uncommitted player insert.");
}

afterAll(async () => {
  await getSqlClient().end();
});

describe("postgresMatchRepository player deduplication", () => {
  it("reuses an existing player for case and spacing variants", async () => {
    const opponent = uniqueName("Dedup Opponent");
    const firstMatchId = await postgresMatchRepository.saveMatch(singlesMatch("Adhiraj", opponent));
    const beforeCount = await countPlayers();

    const secondMatchId = await postgresMatchRepository.saveMatch(
      singlesMatch("  adhiraj  ", `  ${opponent.toUpperCase().replace(" ", "   ")}  `),
    );

    expect(await countPlayers()).toBe(beforeCount);

    const saved = await postgresMatchRepository.getMatchById(secondMatchId);
    expect(saved?.sideAPlayers.map((player) => player.name)).toEqual(["Adhiraj"]);
    expect(saved?.sideBPlayers.map((player) => player.name)).toEqual([opponent]);

    await postgresMatchRepository.deleteMatch(firstMatchId);
    await postgresMatchRepository.deleteMatch(secondMatchId);
  });

  it("creates a new player row when the name is truly new", async () => {
    const beforeCount = await countPlayers();

    const matchId = await postgresMatchRepository.saveMatch(singlesMatch("Adhiraj", uniqueName("New Opponent")));

    expect(await countPlayers()).toBe(beforeCount + 1);

    await postgresMatchRepository.deleteMatch(matchId);
  });

  // Known bug: the duplicate insert fails inside the transaction, which aborts it, so the follow-up
  // select in upsertPlayers cannot run. When upsertPlayers is fixed, this save should succeed and
  // reuse the committed player; update the expectation then.
  it("known bug: fails when another transaction commits the same new player mid-save", async () => {
    const opponent = uniqueName("Race Opponent");
    let savePromise: Promise<number> | undefined;

    await getSqlClient().begin(async (tx) => {
      await tx.unsafe("INSERT INTO players (name) VALUES ($1)", [opponent]);
      savePromise = postgresMatchRepository.saveMatch(singlesMatch("Adhiraj", opponent));
      savePromise.catch(() => {});
      await waitForBlockedQuery();
    });

    // 25P02: in_failed_sql_transaction
    await expect(savePromise).rejects.toMatchObject({ cause: { code: "25P02" } });
  });
});

describe("postgresMatchRepository match lifecycle", () => {
  it("saves, reads, updates, and deletes a doubles match", async () => {
    const partner = uniqueName("Partner");
    const opponent = uniqueName("Opponent");
    const opponentPartner = uniqueName("Opponent Partner");

    const matchId = await postgresMatchRepository.saveMatch({
      playedOn: "2026-03-29",
      slot: "7 PM",
      format: "doubles",
      sideAScore: 30,
      sideBScore: 29,
      sideAPlayers: ["Adhiraj", partner],
      sideBPlayers: [opponent, opponentPartner],
      winnerSide: "A",
    });

    const created = await postgresMatchRepository.getMatchById(matchId);
    expect(created).toMatchObject({
      id: matchId,
      playedOn: "2026-03-29",
      slot: "7 PM",
      format: "doubles",
      sideAScore: 30,
      sideBScore: 29,
      winnerSide: "A",
    });
    expect(created?.sideAPlayers.map((player) => player.name)).toEqual(["Adhiraj", partner]);
    expect(created?.sideBPlayers.map((player) => player.name)).toEqual([opponent, opponentPartner]);

    await postgresMatchRepository.saveMatch({
      ...singlesMatch(opponent, "Adhiraj"),
      id: matchId,
      sideAScore: 19,
      sideBScore: 21,
      winnerSide: "B",
    });

    const updated = await postgresMatchRepository.getMatchById(matchId);
    expect(updated).toMatchObject({ format: "singles", sideAScore: 19, sideBScore: 21, winnerSide: "B" });
    expect(updated?.sideAPlayers.map((player) => player.name)).toEqual([opponent]);
    expect(updated?.sideBPlayers.map((player) => player.name)).toEqual(["Adhiraj"]);

    expect(await postgresMatchRepository.deleteMatch(matchId)).toBe(true);
    expect(await postgresMatchRepository.getMatchById(matchId)).toBeNull();
    expect(await postgresMatchRepository.deleteMatch(matchId)).toBe(false);
  });

  it("throws MatchNotFoundError when updating a missing match", async () => {
    await expect(
      postgresMatchRepository.saveMatch({ ...singlesMatch("Adhiraj", uniqueName("Ghost")), id: 999_999_999 }),
    ).rejects.toBeInstanceOf(MatchNotFoundError);
  });

  it("rejects a score the database constraints do not allow", async () => {
    const beforeCount = await countPlayers();

    // 23514: check_violation from games_finish_rule_check
    await expect(
      postgresMatchRepository.saveMatch({ ...singlesMatch("Adhiraj", uniqueName("Invalid")), sideAScore: 21, sideBScore: 20 }),
    ).rejects.toMatchObject({ cause: { code: "23514", constraint_name: "games_finish_rule_check" } });
    expect(await countPlayers()).toBe(beforeCount);
  });
});
