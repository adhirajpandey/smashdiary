import { AppShell } from "@/app/_components/app-shell";
import { GameForm } from "@/app/_components/game-form";
import { listPlayers } from "@/lib/store";

export default async function NewMatchPage() {
  const players = await listPlayers();

  return (
    <AppShell activePath="">
      <GameForm playerSuggestions={players.map((player) => player.name)} />
    </AppShell>
  );
}
