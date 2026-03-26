"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { usePlayersQuery } from "@/lib/api/hooks";
import type { Player } from "@/lib/types";

type SelectedPlayerContextValue = {
  players: Player[];
  selectedPlayerId: string | null;
  setSelectedPlayerId: (value: string) => void;
  isPickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
  isPlayersLoading: boolean;
  playersError: string | null;
  retryPlayers: () => void;
};

const STORAGE_KEY = "smash-diary:selected-player:v1";

const SelectedPlayerContext = createContext<SelectedPlayerContextValue | null>(null);

function readStoredPlayerId() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredPlayerId(value: string | null) {
  try {
    if (!value) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Ignore storage failures in private browsing or locked-down clients.
  }
}

export function SelectedPlayerProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const {
    data: players = [],
    isLoading: isPlayersLoading,
    isError: isPlayersError,
    error,
    refetch,
  } = usePlayersQuery();
  const [selectedPlayerId, setSelectedPlayerIdState] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    if (isPlayersLoading) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (isPlayersError) {
        setSelectedPlayerIdState(null);
        setIsPickerOpen(true);
        setHasHydrated(true);
        return;
      }

      const stored = readStoredPlayerId();
      const isValid = stored && players.some((player) => player.id === stored);
      setSelectedPlayerIdState(isValid ? stored : null);
      if (!isValid) {
        writeStoredPlayerId(null);
      }
      setIsPickerOpen(Boolean(players.length) && !isValid);
      setHasHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isPlayersError, isPlayersLoading, players]);

  function setSelectedPlayerId(value: string) {
    setSelectedPlayerIdState(value);
    writeStoredPlayerId(value);
  }

  const contextValue = useMemo(
    () => ({
      players,
      selectedPlayerId,
      setSelectedPlayerId,
      isPickerOpen: hasHydrated && isPickerOpen,
      openPicker: () => setIsPickerOpen(true),
      closePicker: () => setIsPickerOpen(false),
      isPlayersLoading,
      playersError: isPlayersError ? error.message : null,
      retryPlayers: () => {
        void refetch();
      },
    }),
    [error?.message, hasHydrated, isPickerOpen, isPlayersError, isPlayersLoading, players, refetch, selectedPlayerId],
  );

  return <SelectedPlayerContext.Provider value={contextValue}>{children}</SelectedPlayerContext.Provider>;
}

export function useSelectedPlayer() {
  const context = useContext(SelectedPlayerContext);
  if (!context) {
    throw new Error("useSelectedPlayer must be used inside SelectedPlayerProvider.");
  }

  return context;
}
