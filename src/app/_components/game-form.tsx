"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";

import type { GameFormFieldErrors } from "@/lib/action-errors";
import { ApiClientError, useCreateMatchMutation, useUpdateMatchMutation } from "@/lib/api/client";
import { SectionHeading } from "@/app/_components/section-heading";
import { useSelectedPlayer } from "@/app/_components/selected-player-provider";
import type { GameFormat, Player, ResolvedGame } from "@/lib/types";
import { getCurrentInputDateTimeValue, toInputDateTimeValue } from "@/lib/utils";

type GameFormProps = {
  game?: ResolvedGame;
  players: Player[];
};

type GameFormState = {
  formError: string | null;
  fieldErrors: GameFormFieldErrors;
};

function buildInitialValues(values: string[]) {
  return Array.from({ length: 2 }, (_, index) => values[index] ?? "");
}

function filterSuggestions(options: string[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return options;
  }

  return options
    .filter((option) => option.toLowerCase().includes(normalized))
    .sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(normalized);
      const bStarts = b.toLowerCase().startsWith(normalized);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    });
}

function PlayerField({
  error,
  icon,
  label,
  onChange,
  placeholder,
  suggestions,
  value,
}: Readonly<{
  error?: string;
  icon: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  suggestions: string[];
  value: string;
}>) {
  const [isOpen, setIsOpen] = useState(false);
  const inputId = useId();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const internalPointerRef = useRef(false);
  const clearInternalPointerTimeoutRef = useRef<number | null>(null);
  const filteredSuggestions = useMemo(() => filterSuggestions(suggestions, value), [suggestions, value]);
  const normalizedValue = value.trim().toLowerCase();

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

  function selectOption(option: string) {
    if (clearInternalPointerTimeoutRef.current !== null) {
      window.clearTimeout(clearInternalPointerTimeoutRef.current);
      clearInternalPointerTimeoutRef.current = null;
    }
    onChange(option);
    internalPointerRef.current = false;
    setIsOpen(false);
  }

  function markInternalPointerInteraction(event: ReactPointerEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element)) {
      return;
    }

    if (!event.target.closest("[data-autocomplete-option]")) {
      return;
    }

    if (clearInternalPointerTimeoutRef.current !== null) {
      window.clearTimeout(clearInternalPointerTimeoutRef.current);
      clearInternalPointerTimeoutRef.current = null;
    }
    internalPointerRef.current = true;
  }

  function clearInternalPointerInteraction() {
    if (!internalPointerRef.current) {
      return;
    }

    if (clearInternalPointerTimeoutRef.current !== null) {
      window.clearTimeout(clearInternalPointerTimeoutRef.current);
    }

    clearInternalPointerTimeoutRef.current = window.setTimeout(() => {
      internalPointerRef.current = false;
      clearInternalPointerTimeoutRef.current = null;
    }, 250);
  }

  return (
    <div className="match-input-group">
      <label className="match-input-group__label" htmlFor={inputId}>
        {label}
      </label>
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
        <div className="match-input-shell">
          <span className="match-input-shell__icon" aria-hidden="true">
            {icon}
          </span>
          <input
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            autoComplete="off"
            className="match-input-shell__input"
            id={inputId}
            onChange={(event) => {
              onChange(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            required
            role="combobox"
            value={value}
          />
        </div>

        {isOpen && filteredSuggestions.length ? (
          <div
            className="autocomplete__dropdown"
            id={listboxId}
            onPointerCancel={clearInternalPointerInteraction}
            onPointerDownCapture={markInternalPointerInteraction}
            onPointerUp={clearInternalPointerInteraction}
            role="listbox"
          >
            {filteredSuggestions.map((option) => (
              <button
                aria-selected={option.toLowerCase() === normalizedValue}
                className="autocomplete__option"
                data-autocomplete-option="true"
                key={option}
                onClick={() => {
                  selectOption(option);
                }}
                role="option"
                type="button"
              >
                <span>{option}</span>
                {option.toLowerCase() === normalizedValue ? (
                  <span className="autocomplete__hint">Selected</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {error ? <p className="match-form__field-error">{error}</p> : null}
    </div>
  );
}

function FormatCard({
  description,
  icon,
  isActive,
  label,
  onClick,
}: Readonly<{
  description: string;
  icon: string;
  isActive: boolean;
  label: string;
  onClick: () => void;
}>) {
  return (
    <button className={`format-card ${isActive ? "is-active" : ""}`} onClick={onClick} type="button">
      <span className="format-card__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="format-card__title">{label}</span>
      <span className="format-card__ghost">{description}</span>
    </button>
  );
}

function SaveButton({ pending }: Readonly<{ pending: boolean }>) {
  return (
    <button className="match-save-button" disabled={pending} type="submit">
      {pending ? "Saving..." : "Save Match"}
    </button>
  );
}

const initialFormState: GameFormState = {
  formError: null,
  fieldErrors: {},
};

export function GameForm({ game, players }: Readonly<GameFormProps>) {
  const router = useRouter();
  const { selectedPlayerId } = useSelectedPlayer();
  const createMatchMutation = useCreateMatchMutation();
  const updateMatchMutation = useUpdateMatchMutation(game?.id ?? 0);
  const [format, setFormat] = useState<GameFormat>(game?.format ?? "singles");
  const [playedAt, setPlayedAt] = useState(game ? toInputDateTimeValue(game.playedAt) : getCurrentInputDateTimeValue());
  const [sideAScore, setSideAScore] = useState<number>(game?.sideAScore ?? 20);
  const [sideBScore, setSideBScore] = useState<number>(game?.sideBScore ?? 20);
  const [formState, setFormState] = useState(initialFormState);
  const playerSuggestions = useMemo(
    () => Array.from(new Set(players.map((player) => player.name))).sort((a, b) => a.localeCompare(b)),
    [players],
  );
  const initialSideAValues = game?.sideAPlayers.map((player) => player.name) ?? [];
  const initialSideBValues = game?.sideBPlayers.map((player) => player.name) ?? [];
  const [sideAPlayers, setSideAPlayers] = useState<string[]>(() => buildInitialValues(initialSideAValues));
  const [sideBPlayers, setSideBPlayers] = useState<string[]>(() => buildInitialValues(initialSideBValues));
  const lastScoreTapRef = useRef(0);

  const selectedPlayer = players.find((player) => player.id === selectedPlayerId) ?? null;
  const primaryPlayerName = game ? sideAPlayers[0] ?? "" : selectedPlayer?.name ?? sideAPlayers[0] ?? "";
  const partnerName = sideAPlayers[1] ?? "";
  const opponentName = sideBPlayers[0] ?? "";
  const opponentPartnerName = sideBPlayers[1] ?? "";
  const isPending = createMatchMutation.isPending || updateMatchMutation.isPending;

  function setPartnerName(value: string) {
    setSideAPlayers([primaryPlayerName, value]);
  }

  function setOpponentName(value: string) {
    setSideBPlayers((current) => [value, current[1] ?? ""]);
  }

  function setOpponentPartnerName(value: string) {
    setSideBPlayers((current) => [current[0] ?? "", value]);
  }

  function clampScore(value: number) {
    return Math.max(0, Math.min(30, value));
  }

  function canAdjustScore() {
    const now = Date.now();
    if (now - lastScoreTapRef.current < 120) {
      return false;
    }
    lastScoreTapRef.current = now;
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormState(initialFormState);

    const payload = {
      playedAt,
      format,
      sideAScore,
      sideBScore,
      sideAPlayers: (format === "doubles" ? [primaryPlayerName, partnerName] : [primaryPlayerName]).filter(Boolean),
      sideBPlayers: (format === "doubles" ? [opponentName, opponentPartnerName] : [opponentName]).filter(Boolean),
    };

    try {
      const result = game
        ? await updateMatchMutation.mutateAsync(payload)
        : await createMatchMutation.mutateAsync(payload);

      router.push(game ? `/matches/${result.id}` : "/");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setFormState({
          formError: error.formError ?? error.message,
          fieldErrors: error.fieldErrors ?? {},
        });
        return;
      }

      setFormState({
        formError: "Could not save game. Please try again.",
        fieldErrors: {},
      });
    }
  }

  return (
    <form className="match-form" onSubmit={(event) => void handleSubmit(event)}>
      {formState.formError ? <p className="match-form__banner">{formState.formError}</p> : null}

      <section className="match-form__section">
        <SectionHeading align="compact" eyebrow="Select format" />

        <div className="format-grid">
          <FormatCard
            description="YOU"
            icon="1P"
            isActive={format === "singles"}
            label="Singles"
            onClick={() => setFormat("singles")}
          />
          <FormatCard
            description="YOU + 1"
            icon="2P"
            isActive={format === "doubles"}
            label="Doubles"
            onClick={() => setFormat("doubles")}
          />
        </div>
      </section>

      <section className="match-form__section">
        <label className="match-input-group">
          <span className="match-input-group__label">You</span>
          <div className="match-input-shell is-readonly">
            <span className="match-input-shell__icon" aria-hidden="true">
              ME
            </span>
            <span className="match-input-shell__value">{primaryPlayerName || "Select your identity first"}</span>
          </div>
        </label>
        {formState.fieldErrors.sideAPlayers ? (
          <p className="match-form__field-error">{formState.fieldErrors.sideAPlayers}</p>
        ) : null}

        {format === "doubles" ? (
          <PlayerField
            icon="+"
            label="Your Partner"
            onChange={setPartnerName}
            placeholder="Add a teammate..."
            suggestions={playerSuggestions.filter((option) => option !== primaryPlayerName && option !== opponentName)}
            value={partnerName}
          />
        ) : null}

        <PlayerField
          error={formState.fieldErrors.sideBPlayers}
          icon="OP"
          label="Opponent"
          onChange={setOpponentName}
          placeholder="Search by name or handle..."
          suggestions={playerSuggestions.filter((option) => option !== primaryPlayerName && option !== partnerName)}
          value={opponentName}
        />

        {format === "doubles" ? (
          <PlayerField
            error={formState.fieldErrors.sideBPlayers}
            icon="OP"
            label="Opponent's Partner"
            onChange={setOpponentPartnerName}
            placeholder="Add second opponent..."
            suggestions={playerSuggestions.filter(
              (option) => option !== primaryPlayerName && option !== partnerName && option !== opponentName,
            )}
            value={opponentPartnerName}
          />
        ) : null}

        <label className="match-input-group">
          <span className="match-input-group__label">Played at</span>
          <div className="match-input-shell">
            <span className="match-input-shell__icon" aria-hidden="true">
              TM
            </span>
            <input
              className="match-input-shell__input"
              onChange={(event) => setPlayedAt(event.target.value)}
              required
              type="datetime-local"
              value={playedAt}
            />
          </div>
        </label>
        {formState.fieldErrors.playedAt ? (
          <p className="match-form__field-error">{formState.fieldErrors.playedAt}</p>
        ) : null}
      </section>

      <section className="score-panel">
        <p className="score-panel__label">Final Match Score</p>
        <div className="score-panel__grid">
          <label className="score-panel__side">
            <span className="score-panel__side-label">You</span>
            <div className="score-stepper">
              <button
                aria-label="Decrease your score"
                className="score-stepper__button"
                onClick={() => {
                  if (!canAdjustScore()) {
                    return;
                  }
                  setSideAScore((current) => clampScore(current - 1));
                }}
                type="button"
              >
                -
              </button>
              <input
                className="display score-panel__input"
                max={30}
                min={0}
                onChange={(event) => setSideAScore(clampScore(Number(event.target.value) || 0))}
                required
                type="number"
                value={sideAScore}
              />
              <button
                aria-label="Increase your score"
                className="score-stepper__button"
                onClick={() => {
                  if (!canAdjustScore()) {
                    return;
                  }
                  setSideAScore((current) => clampScore(current + 1));
                }}
                type="button"
              >
                +
              </button>
            </div>
          </label>

          <div className="score-panel__divider" aria-hidden="true">
            /
          </div>

          <label className="score-panel__side">
            <span className="score-panel__side-label">Opp</span>
            <div className="score-stepper">
              <button
                aria-label="Decrease opponent score"
                className="score-stepper__button"
                onClick={() => {
                  if (!canAdjustScore()) {
                    return;
                  }
                  setSideBScore((current) => clampScore(current - 1));
                }}
                type="button"
              >
                -
              </button>
              <input
                className="display score-panel__input score-panel__input--alt"
                max={30}
                min={0}
                onChange={(event) => setSideBScore(clampScore(Number(event.target.value) || 0))}
                required
                type="number"
                value={sideBScore}
              />
              <button
                aria-label="Increase opponent score"
                className="score-stepper__button"
                onClick={() => {
                  if (!canAdjustScore()) {
                    return;
                  }
                  setSideBScore((current) => clampScore(current + 1));
                }}
                type="button"
              >
                +
              </button>
            </div>
          </label>
        </div>
        {formState.fieldErrors.sideAScore ? (
          <p className="match-form__field-error">{formState.fieldErrors.sideAScore}</p>
        ) : null}
      </section>

      <SaveButton pending={isPending} />
    </form>
  );
}
