"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { storageKeys } from "@/lib/config/storage";

type SelectedPlayerContextValue = {
  selectedPlayerId: number | null;
  isHydrated: boolean;
  setSelectedPlayerId: (value: number) => void;
  clearSelectedPlayerId: () => void;
  isPickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
};

const SelectedPlayerContext = createContext<SelectedPlayerContextValue | null>(null);

export function SelectedPlayerProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [selectedPlayerId, setSelectedPlayerIdState] = useState<number | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(storageKeys.selectedPlayer);
    const stored = storedValue ? Number(storedValue) : null;
    const timeoutId = window.setTimeout(() => {
      setSelectedPlayerIdState(stored !== null && Number.isInteger(stored) ? stored : null);
      setIsPickerOpen(stored === null);
      setIsHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  function setSelectedPlayerId(value: number) {
    setSelectedPlayerIdState(value);
    window.localStorage.setItem(storageKeys.selectedPlayer, String(value));
  }

  function clearSelectedPlayerId() {
    setSelectedPlayerIdState(null);
    window.localStorage.removeItem(storageKeys.selectedPlayer);
  }

  const contextValue = useMemo(
    () => ({
      selectedPlayerId,
      isHydrated,
      setSelectedPlayerId,
      clearSelectedPlayerId,
      isPickerOpen: isHydrated && isPickerOpen,
      openPicker: () => setIsPickerOpen(true),
      closePicker: () => setIsPickerOpen(false),
    }),
    [isHydrated, isPickerOpen, selectedPlayerId],
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
