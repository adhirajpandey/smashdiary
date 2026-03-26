import { AppShell } from "@/app/_components/app-shell";
import { MatchesView } from "@/app/_components/matches-view";

export default function MatchesPage() {
  return (
    <AppShell activePath="/matches">
      <MatchesView />
    </AppShell>
  );
}
