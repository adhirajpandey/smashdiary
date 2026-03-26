import { AppShell } from "@/app/_components/app-shell";
import { StatsPanel } from "@/app/_components/stats-panel";

export default function StatsPage() {
  return (
    <AppShell activePath="/stats">
      <StatsPanel />
    </AppShell>
  );
}
