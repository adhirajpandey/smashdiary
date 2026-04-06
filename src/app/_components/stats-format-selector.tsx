"use client";

import { useStatsFormat } from "@/app/_components/stats-format-provider";
import type { StatsFormat } from "@/lib/types";
import { cn, formatStatsFormatLabel } from "@/lib/utils";

const formats: StatsFormat[] = ["singles", "doubles"];

export function StatsFormatSelector() {
  const { selectedStatsFormat, setSelectedStatsFormat } = useStatsFormat();

  return (
    <div aria-label="Stats format" className="stats-format-selector" role="tablist">
      {formats.map((format) => {
        const isActive = selectedStatsFormat === format;

        return (
          <button
            aria-selected={isActive}
            className={cn("stats-format-selector__option", isActive && "is-active")}
            key={format}
            onClick={() => setSelectedStatsFormat(format)}
            role="tab"
            type="button"
          >
            {formatStatsFormatLabel(format)}
          </button>
        );
      })}
    </div>
  );
}
