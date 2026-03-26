"use client";

import { GameForm } from "@/app/_components/game-form";
import { StatusView } from "@/app/_components/status-view";
import { usePlayersQuery } from "@/lib/api/client";

export function NewMatchPageClient() {
  const { data, error, isPending } = usePlayersQuery();

  if (isPending) {
    return (
      <StatusView
        eyebrow="Loading"
        title="Loading match form"
        description="Pulling player suggestions for a new entry."
      />
    );
  }

  if (error) {
    return <StatusView eyebrow="System fault" title="Could not load match form" description={error.message} />;
  }

  return <GameForm players={data.players} />;
}
