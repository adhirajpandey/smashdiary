"use client";

import { useEffect, useId, useRef, useState } from "react";

import { SectionHeading } from "@/app/_components/section-heading";
import { useSelectedPlayer } from "@/app/_components/selected-player-provider";
import { usePlayersQuery } from "@/lib/api/client";

export function IdentityPicker() {
  const {
    selectedPlayerId,
    isHydrated,
    setSelectedPlayerId,
    clearSelectedPlayerId,
    isPickerOpen,
    openPicker,
    closePicker,
  } = useSelectedPlayer();
  const { data, error, isPending, refetch } = usePlayersQuery();
  const [draftPlayerId, setDraftPlayerId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const fieldLabelId = useId();
  const listboxId = useId();
  const selectedValueId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const internalPointerRef = useRef(false);
  const clearInternalPointerTimeoutRef = useRef<number | null>(null);
  const players = data?.players ?? [];
  const resolvedDraftPlayerId = draftPlayerId ?? selectedPlayerId ?? players[0]?.id ?? null;
  const selectedPlayer = players.find((player) => player.id === resolvedDraftPlayerId) ?? null;
  const filteredPlayers = players.filter((player) => player.name.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (!isHydrated || isPending) {
      return;
    }

    const hasValidSelection =
      selectedPlayerId !== null && Boolean(data?.players.some((player) => player.id === selectedPlayerId));

    if (selectedPlayerId !== null && !hasValidSelection) {
      clearSelectedPlayerId();
    }

    if (!hasValidSelection && data?.players.length) {
      openPicker();
    }
  }, [clearSelectedPlayerId, data?.players, isHydrated, isPending, openPicker, selectedPlayerId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleDocumentPointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleDocumentPointerDown);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (clearInternalPointerTimeoutRef.current !== null) {
        window.clearTimeout(clearInternalPointerTimeoutRef.current);
      }
    };
  }, []);

  function selectPlayer(playerId: number) {
    setDraftPlayerId(playerId);
    setQuery("");
    internalPointerRef.current = false;
    setIsOpen(false);
  }

  function markInternalPointerInteraction() {
    if (clearInternalPointerTimeoutRef.current !== null) {
      window.clearTimeout(clearInternalPointerTimeoutRef.current);
      clearInternalPointerTimeoutRef.current = null;
    }
    internalPointerRef.current = true;
  }

  function clearInternalPointerInteraction() {
    if (clearInternalPointerTimeoutRef.current !== null) {
      window.clearTimeout(clearInternalPointerTimeoutRef.current);
    }

    clearInternalPointerTimeoutRef.current = window.setTimeout(() => {
      internalPointerRef.current = false;
      clearInternalPointerTimeoutRef.current = null;
    }, 0);
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

        {isPending ? <p className="muted-copy">Loading players...</p> : null}
        {error ? (
          <div className="page-stack page-stack--compact">
            <p className="muted-copy">{error.message}</p>
            <button className="primary-button" onClick={() => void refetch()} type="button">
              Retry
            </button>
          </div>
        ) : null}

        {!isPending && !error ? (
          <>
            <div className="picker-field">
              <span className="section-title" id={fieldLabelId}>
                Select player
              </span>
              <div
                className="autocomplete"
                ref={rootRef}
                onBlur={(event) => {
                  if (internalPointerRef.current) {
                    return;
                  }
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setIsOpen(false);
                  }
                }}
              >
                {isOpen ? (
                  <div className="identity-select">
                    <input
                      aria-autocomplete="list"
                      aria-controls={listboxId}
                      aria-expanded={isOpen}
                      aria-haspopup="listbox"
                      aria-labelledby={fieldLabelId}
                      autoComplete="off"
                      className="identity-select__input"
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Choose a player"
                      role="combobox"
                      value={query}
                    />
                    <span className={`identity-select__chevron ${isOpen ? "is-open" : ""}`} aria-hidden="true">
                      ^
                    </span>
                  </div>
                ) : (
                  <div
                    aria-controls={listboxId}
                    className="identity-select"
                  >
                    <input
                      aria-autocomplete="list"
                      aria-controls={listboxId}
                      aria-expanded={isOpen}
                      aria-haspopup="listbox"
                      aria-labelledby={fieldLabelId}
                      autoComplete="off"
                      className="identity-select__input"
                      id={selectedValueId}
                      onPointerDown={(event) => {
                        if (!isOpen) {
                          event.preventDefault();
                          setIsOpen(true);
                        }
                      }}
                      placeholder="Choose a player"
                      readOnly
                      role="combobox"
                      value={selectedPlayer?.name ?? ""}
                    />
                    <span className={`identity-select__chevron ${isOpen ? "is-open" : ""}`} aria-hidden="true">
                      ^
                    </span>
                  </div>
                )}

                {isOpen ? (
                  <div
                    className="autocomplete__dropdown"
                    onPointerCancel={clearInternalPointerInteraction}
                    onPointerDownCapture={markInternalPointerInteraction}
                    onPointerUp={clearInternalPointerInteraction}
                  >
                    <div aria-labelledby={fieldLabelId} className="autocomplete__options" id={listboxId} role="listbox">
                      {filteredPlayers.length ? (
                        filteredPlayers.map((player) => (
                          <button
                            aria-selected={player.id === resolvedDraftPlayerId}
                            className="autocomplete__option"
                            key={player.id}
                            onClick={() => {
                              selectPlayer(player.id);
                            }}
                            role="option"
                            type="button"
                          >
                            <span>{player.name}</span>
                            {player.id === resolvedDraftPlayerId ? (
                              <span className="autocomplete__hint">Selected</span>
                            ) : null}
                          </button>
                        ))
                      ) : (
                        <p className="autocomplete__empty">No players found.</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <button
              className="primary-button picker-submit"
              disabled={resolvedDraftPlayerId === null}
              type="button"
              onClick={() => {
                if (resolvedDraftPlayerId === null) {
                  return;
                }
                setSelectedPlayerId(resolvedDraftPlayerId);
                setDraftPlayerId(null);
                setQuery("");
                setIsOpen(false);
                closePicker();
              }}
            >
              Continue
            </button>
          </>
        ) : null}

      </div>
    </div>
  );
}
