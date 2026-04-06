"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { storageKeys } from "@/lib/config/storage";
import type { StatsFormat } from "@/lib/types";
import { isStatsFormat } from "@/lib/utils";

type StatsFormatContextValue = {
  selectedStatsFormat: StatsFormat;
  isHydrated: boolean;
  setSelectedStatsFormat: (value: StatsFormat) => void;
};

const StatsFormatContext = createContext<StatsFormatContextValue | null>(null);

export function StatsFormatProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [selectedStatsFormat, setSelectedStatsFormatState] = useState<StatsFormat>("singles");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(storageKeys.selectedStatsFormat);
    const nextFormat = isStatsFormat(storedValue ?? "") ? storedValue : "singles";
    const timeoutId = window.setTimeout(() => {
      setSelectedStatsFormatState(nextFormat as StatsFormat);
      setIsHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  function setSelectedStatsFormat(value: StatsFormat) {
    setSelectedStatsFormatState(value);
    window.localStorage.setItem(storageKeys.selectedStatsFormat, value);
  }

  const contextValue = useMemo(
    () => ({
      selectedStatsFormat,
      isHydrated,
      setSelectedStatsFormat,
    }),
    [isHydrated, selectedStatsFormat],
  );

  return <StatsFormatContext.Provider value={contextValue}>{children}</StatsFormatContext.Provider>;
}

export function useStatsFormat() {
  const context = useContext(StatsFormatContext);
  if (!context) {
    throw new Error("useStatsFormat must be used inside StatsFormatProvider.");
  }

  return context;
}
