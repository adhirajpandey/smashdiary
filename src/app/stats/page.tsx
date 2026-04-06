import { AppShell } from "@/app/_components/app-shell";
import { StatsPageClient } from "@/app/_components/stats-page-client";
import { appRoutes } from "@/lib/config/routes";

export default function StatsPage() {
  return (
    <AppShell activePath={appRoutes.stats}>
      <StatsPageClient />
    </AppShell>
  );
}
