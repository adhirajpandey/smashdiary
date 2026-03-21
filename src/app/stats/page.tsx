import { AppShell } from "@/app/_components/app-shell";
import { StatsPanel } from "@/app/_components/stats-panel";
import { listGames, listPlayers } from "@/lib/store";

export default async function StatsPage() {
  const [games, players] = await Promise.all([listGames(), listPlayers()]);

  return (
    <AppShell activePath="/stats">
      <StatsPanel games={games} players={players} />
    </AppShell>
  );
}
