"use client";

import { useMemo, useState } from "react";

import { SectionHeading } from "@/app/_components/section-heading";
import { useSelectedPlayer } from "@/app/_components/selected-player-provider";

export function IdentityPicker() {
  const { players, selectedPlayerId, setSelectedPlayerId, isPickerOpen, closePicker } = useSelectedPlayer();
  const [draftPlayerId, setDraftPlayerId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const resolvedDraftPlayerId = draftPlayerId ?? selectedPlayerId ?? players[0]?.id ?? null;
  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === resolvedDraftPlayerId) ?? null,
    [players, resolvedDraftPlayerId],
  );

  if (!isPickerOpen) {
    return null;
  }

  return (
    <div className="identity-modal">
      <div className="identity-modal__backdrop" />
      <div className="identity-modal__panel glass">
        <SectionHeading
          eyebrow="Player identity"
          title="Who are you?"
          description="Pick your name to personalize dashboard activity and recent matches."
          titleClassName="page-title"
        />

        <label className="picker-field">
          <span className="section-title">Select player</span>
          <div
            className="autocomplete"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsOpen(false);
              }
            }}
          >
            <button
              aria-expanded={isOpen}
              className="identity-select"
              onClick={() => setIsOpen((current) => !current)}
              type="button"
            >
              <span className="identity-select__value">{selectedPlayer?.name ?? "Choose a player"}</span>
              <span className={`identity-select__chevron ${isOpen ? "is-open" : ""}`} aria-hidden="true">
                ^
              </span>
            </button>

            {isOpen ? (
              <div className="autocomplete__dropdown">
                {players.map((player) => (
                  <button
                    className="autocomplete__option"
                    key={player.id}
                    onClick={() => {
                      setDraftPlayerId(player.id);
                      setIsOpen(false);
                    }}
                    type="button"
                  >
                    <span>{player.name}</span>
                    {player.id === resolvedDraftPlayerId ? <span className="autocomplete__hint">Selected</span> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </label>

        <button
          className="primary-button picker-submit"
          type="button"
          onClick={() => {
            if (resolvedDraftPlayerId === null) {
              return;
            }
            setSelectedPlayerId(resolvedDraftPlayerId);
            setDraftPlayerId(null);
            setIsOpen(false);
            closePicker();
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
