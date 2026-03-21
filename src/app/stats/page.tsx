import { AppShell } from "@/app/_components/app-shell";
import { StatsPanel } from "@/app/_components/stats-panel";
import { getStats } from "@/lib/store";

export default async function StatsPage() {
  const stats = await getStats();

  return (
    <AppShell activePath="">
      <StatsPanel stats={stats} />
    </AppShell>
  );
}
