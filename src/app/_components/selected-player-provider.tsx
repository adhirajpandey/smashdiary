"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { Player } from "@/lib/types";

type SelectedPlayerContextValue = {
  players: Player[];
  selectedPlayerId: string | null;
  setSelectedPlayerId: (value: string) => void;
  isPickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
};

const STORAGE_KEY = "smash-diary:selected-player";

const SelectedPlayerContext = createContext<SelectedPlayerContextValue | null>(null);

export function SelectedPlayerProvider({
  children,
  players,
}: Readonly<{
  children: React.ReactNode;
  players: Player[];
}>) {
  const [selectedPlayerId, setSelectedPlayerIdState] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const isValid = stored && players.some((player) => player.id === stored);
    const timeoutId = window.setTimeout(() => {
      setSelectedPlayerIdState(isValid ? stored : null);
      setIsPickerOpen(!isValid);
      setHasHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [players]);

  function setSelectedPlayerId(value: string) {
    setSelectedPlayerIdState(value);
    window.localStorage.setItem(STORAGE_KEY, value);
  }

  const contextValue = useMemo(
    () => ({
      players,
      selectedPlayerId,
      setSelectedPlayerId,
      isPickerOpen: hasHydrated && isPickerOpen,
      openPicker: () => setIsPickerOpen(true),
      closePicker: () => setIsPickerOpen(false),
    }),
    [hasHydrated, isPickerOpen, players, selectedPlayerId],
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
