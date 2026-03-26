"use client";

import { useMemo, useState } from "react";

import { useSelectedPlayer } from "@/app/_components/selected-player-provider";

export function IdentityPicker() {
  const {
    players,
    selectedPlayerId,
    setSelectedPlayerId,
    isPickerOpen,
    closePicker,
    playersError,
    retryPlayers,
  } = useSelectedPlayer();
  const [draftPlayerId, setDraftPlayerId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const resolvedDraftPlayerId = draftPlayerId || selectedPlayerId || players[0]?.id || "";
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
        {playersError ? (
          <>
            <p className="eyebrow" style={{ margin: 0 }}>
              Player identity
            </p>
            <h2 className="display" style={{ margin: "0.35rem 0 0", fontSize: "2rem" }}>
              Could not load players
            </h2>
            <p style={{ margin: "0.5rem 0 0", color: "var(--text-secondary)" }}>{playersError}</p>

            <button
              className="primary-button"
              style={{ marginTop: "1.25rem", width: "100%" }}
              type="button"
              onClick={() => {
                void retryPlayers();
              }}
            >
              Retry
            </button>
          </>
        ) : (
          <>
            <p className="eyebrow" style={{ margin: 0 }}>
              Player identity
            </p>
            <h2 className="display" style={{ margin: "0.35rem 0 0", fontSize: "2rem" }}>
              Who are you?
            </h2>
            <p style={{ margin: "0.5rem 0 0", color: "var(--text-secondary)" }}>
              Pick your name to personalize dashboard activity and recent matches.
            </p>

            <label style={{ display: "grid", gap: "0.45rem", marginTop: "1.25rem" }}>
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
              className="primary-button"
              style={{ marginTop: "1.25rem", width: "100%" }}
              type="button"
              onClick={() => {
                if (!resolvedDraftPlayerId) {
                  return;
                }
                setSelectedPlayerId(resolvedDraftPlayerId);
                setDraftPlayerId("");
                setIsOpen(false);
                closePicker();
              }}
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
