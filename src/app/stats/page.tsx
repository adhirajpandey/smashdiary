import { AppShell } from "@/app/_components/app-shell";
import { StatsPanel } from "@/app/_components/stats-panel";
import { getStatsPageData } from "@/lib/queries/page-data";

export default async function StatsPage() {
  const { matches, players } = await getStatsPageData();

  return (
    <AppShell activePath="/stats">
      <StatsPanel games={matches} players={players} />
    </AppShell>
  );
}
