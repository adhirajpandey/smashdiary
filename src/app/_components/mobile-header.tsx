"use client";

import Link from "next/link";

import { useSelectedPlayer } from "@/app/_components/selected-player-provider";
import { usePlayersQuery } from "@/lib/api/client";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function MobileHeader() {
  const { selectedPlayerId, openPicker } = useSelectedPlayer();
  const { data } = usePlayersQuery();
  const selectedPlayer = data?.players.find((player) => player.id === selectedPlayerId) ?? null;

  return (
    <header className="mobile-header">
      <div className="mobile-header__brand">
        <Link className="display mobile-header__brand-mark" href="/">
          SMASH DIARY
        </Link>
      </div>
      <button className="mobile-header__profile" onClick={openPicker} type="button">
        {selectedPlayer ? getInitials(selectedPlayer.name) : "?"}
      </button>
    </header>
  );
}
