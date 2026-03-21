import { AppShell } from "@/app/_components/app-shell";
import { DashboardView } from "@/app/_components/dashboard-view";
import { listGames, listPlayers } from "@/lib/store";

export default async function HomePage() {
  const [games, players] = await Promise.all([listGames(), listPlayers()]);

  return (
    <AppShell activePath="/">
      <DashboardView games={games} players={players} />
    </AppShell>
  );
}
