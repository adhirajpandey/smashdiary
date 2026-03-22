"use client";

import { useId, useMemo, useState } from "react";

import { SectionHeading } from "@/app/_components/section-heading";
import { useSelectedPlayer } from "@/app/_components/selected-player-provider";

export function IdentityPicker() {
  const { players, selectedPlayerId, setSelectedPlayerId, isPickerOpen, closePicker } = useSelectedPlayer();
  const [draftPlayerId, setDraftPlayerId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const fieldLabelId = useId();
  const listboxId = useId();
  const selectedValueId = useId();
  const resolvedDraftPlayerId = draftPlayerId ?? selectedPlayerId ?? players[0]?.id ?? null;
  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === resolvedDraftPlayerId) ?? null,
    [players, resolvedDraftPlayerId],
  );

  function selectPlayer(playerId: number) {
    setDraftPlayerId(playerId);
    setIsOpen(false);
  }

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

        <div className="picker-field">
          <span className="section-title" id={fieldLabelId}>
            Select player
          </span>
          <div
            className="autocomplete"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsOpen(false);
              }
            }}
          >
            <button
              aria-controls={listboxId}
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              aria-labelledby={`${fieldLabelId} ${selectedValueId}`}
              className="identity-select"
              onClick={() => setIsOpen((current) => !current)}
              type="button"
            >
              <span className="identity-select__value" id={selectedValueId}>
                {selectedPlayer?.name ?? "Choose a player"}
              </span>
              <span className={`identity-select__chevron ${isOpen ? "is-open" : ""}`} aria-hidden="true">
                ^
              </span>
            </button>

            {isOpen ? (
              <div
                aria-labelledby={fieldLabelId}
                className="autocomplete__dropdown"
                id={listboxId}
                role="listbox"
              >
                {players.map((player) => (
                  <button
                    aria-selected={player.id === resolvedDraftPlayerId}
                    className="autocomplete__option"
                    key={player.id}
                    onClick={() => {
                      selectPlayer(player.id);
                    }}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      selectPlayer(player.id);
                    }}
                    role="option"
                    type="button"
                  >
                    <span>{player.name}</span>
                    {player.id === resolvedDraftPlayerId ? <span className="autocomplete__hint">Selected</span> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

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
