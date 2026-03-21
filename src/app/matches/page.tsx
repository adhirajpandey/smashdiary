import { AppShell } from "@/app/_components/app-shell";
import { MatchesView } from "@/app/_components/matches-view";
import { listGames, listPlayers } from "@/lib/store";

export default async function MatchesPage() {
  const [games, players] = await Promise.all([listGames(), listPlayers()]);

  return (
    <AppShell activePath="/matches">
      <MatchesView games={games} players={players} />
    </AppShell>
  );
}
