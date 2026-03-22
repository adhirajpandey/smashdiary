import type { PlayerStanding } from "@/lib/types";

export function LeaderboardPanel({
  players,
  title = "Leaderboard",
}: Readonly<{
  players: PlayerStanding[];
  title?: string;
}>) {
  return (
    <section className="leaderboard">
      <h2 className="dashboard-section__title leaderboard__title">{title}</h2>
      <div className="leaderboard__list">
        {players.map((player, index) => (
          <div className="leaderboard__row" key={player.playerId}>
            <div className="leaderboard__left">
              <span className="display leaderboard__rank">{index + 1}</span>
              <div>
                <p className="leaderboard__name">{player.playerName}</p>
                <p className="leaderboard__wins">{player.wins} wins</p>
              </div>
            </div>
            <strong className="leaderboard__rating">{player.rating.toFixed(1)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
