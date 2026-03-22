import { AppShell } from "@/app/_components/app-shell";
import { MatchesView } from "@/app/_components/matches-view";
import { getMatchesPageData } from "@/lib/queries/page-data";

export default async function MatchesPage() {
  const { matches, players } = await getMatchesPageData();

  return (
    <AppShell activePath="/matches">
      <MatchesView games={matches} players={players} />
    </AppShell>
  );
}
