import { AppShell } from "@/app/_components/app-shell";
import { GameForm } from "@/app/_components/game-form";
import { getMatchFormPageData } from "@/lib/queries/page-data";

export default async function NewMatchPage() {
  const { playerSuggestions } = await getMatchFormPageData();

  return (
    <AppShell activePath="">
      <GameForm playerSuggestions={playerSuggestions} />
    </AppShell>
  );
}
