"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { SectionHeading } from "@/app/_components/section-heading";
import { useSelectedPlayer } from "@/app/_components/selected-player-provider";

export function IdentityPicker() {
  const { players, selectedPlayerId, setSelectedPlayerId, isPickerOpen, closePicker } = useSelectedPlayer();
  const [draftPlayerId, setDraftPlayerId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const fieldLabelId = useId();
  const listboxId = useId();
  const selectedValueId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const internalPointerRef = useRef(false);
  const clearInternalPointerTimeoutRef = useRef<number | null>(null);
  const resolvedDraftPlayerId = draftPlayerId ?? selectedPlayerId ?? players[0]?.id ?? null;
  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === resolvedDraftPlayerId) ?? null,
    [players, resolvedDraftPlayerId],
  );

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
                onPointerCancel={clearInternalPointerInteraction}
                onPointerDownCapture={markInternalPointerInteraction}
                onPointerUp={clearInternalPointerInteraction}
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
