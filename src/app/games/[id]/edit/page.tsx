import { notFound } from "next/navigation";

import { AppShell } from "@/app/_components/app-shell";
import { GameForm } from "@/app/_components/game-form";
import { getGameById, listPlayers } from "@/lib/store";

export default async function EditGamePage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const [game, players] = await Promise.all([getGameById(id), listPlayers()]);

  if (!game) {
    notFound();
  }

  return (
    <AppShell activePath="">
      <GameForm game={game} playerSuggestions={players.map((player) => player.name)} />
    </AppShell>
  );
}
