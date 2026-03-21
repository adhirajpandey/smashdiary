"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useSelectedPlayer } from "@/app/_components/selected-player-provider";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function MobileHeader() {
  const { players, selectedPlayerId, openPicker } = useSelectedPlayer();
  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId],
  );

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
