import { AppShell } from "@/app/_components/app-shell";
import { MatchesPageClient } from "@/app/_components/matches-page-client";
import { appRoutes } from "@/lib/config/routes";

export default function MatchesPage() {
  return (
    <AppShell activePath={appRoutes.matches}>
      <MatchesPageClient />
    </AppShell>
  );
}
