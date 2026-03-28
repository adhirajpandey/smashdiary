import { getTestSqliteClient } from "@/lib/db/test-sqlite";
import { sqliteMatchRepository } from "@/lib/repositories/sqlite-match-repository";

function countPlayers() {
  const client = getTestSqliteClient();
  const row = client.prepare("SELECT COUNT(*) AS count FROM players").get() as { count: number };
  return row.count;
}

function deletePlayersByNames(names: string[]) {
  const client = getTestSqliteClient();
  const run = client.transaction(() => {
    for (const name of names) {
      const player = client.prepare("SELECT id FROM players WHERE lower(name) = lower(?) LIMIT 1").get(name) as { id: number } | undefined;
      if (!player) {
        continue;
      }

      client.prepare("DELETE FROM games WHERE side_a_player_1_id = ? OR side_a_player_2_id = ? OR side_b_player_1_id = ? OR side_b_player_2_id = ?")
        .run(player.id, player.id, player.id, player.id);
      client.prepare("DELETE FROM players WHERE id = ?").run(player.id);
    }
  });

  run();
}

describe("sqliteMatchRepository player deduplication", () => {
  const tempNames = ["Repo Temp Opponent"];

  beforeEach(() => {
    deletePlayersByNames(tempNames);
  });

  afterEach(() => {
    deletePlayersByNames(tempNames);
  });

  it("reuses an existing player for case and spacing variants", async () => {
    const beforeCount = countPlayers();

    const matchId = await sqliteMatchRepository.saveMatch({
      playedOn: "2026-03-29",
      slot: "9 AM",
      format: "singles",
      sideAScore: 21,
      sideBScore: 18,
      sideAPlayers: ["  abhilasha  "],
      sideBPlayers: ["Repo Temp Opponent"],
      winnerSide: "A",
    });

    const afterCount = countPlayers();

    expect(afterCount).toBe(beforeCount + 1);

    await sqliteMatchRepository.deleteMatch(matchId);
  });

  it("creates a new player row when the name is truly new", async () => {
    const beforeCount = countPlayers();

    const matchId = await sqliteMatchRepository.saveMatch({
      playedOn: "2026-03-29",
      slot: "10 AM",
      format: "singles",
      sideAScore: 21,
      sideBScore: 16,
      sideAPlayers: ["Abhilasha"],
      sideBPlayers: ["Repo Temp Opponent"],
      winnerSide: "A",
    });

    const afterCount = countPlayers();

    expect(afterCount).toBe(beforeCount + 1);

    await sqliteMatchRepository.deleteMatch(matchId);
  });
});
