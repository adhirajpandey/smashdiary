import { AppShell } from "@/app/_components/app-shell";
import { MatchesPageClient } from "@/app/_components/matches-page-client";

export default function MatchesPage() {
  return (
    <AppShell activePath="/matches">
      <MatchesPageClient />
    </AppShell>
  );
}
