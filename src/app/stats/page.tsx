import { AppShell } from "@/app/_components/app-shell";
import { StatsPageClient } from "@/app/_components/stats-page-client";

export default function StatsPage() {
  return (
    <AppShell activePath="/stats">
      <StatsPageClient />
    </AppShell>
  );
}
