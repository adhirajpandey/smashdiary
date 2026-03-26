"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useSelectedPlayer } from "@/app/_components/selected-player-provider";
import type { GameFormFieldErrors } from "@/lib/action-errors";
import { ApiClientError } from "@/lib/api/client";
import { useCreateGameMutation, useUpdateGameMutation } from "@/lib/api/hooks";
import type { GameFormat, ResolvedGame } from "@/lib/types";
import { toInputDateTimeValue } from "@/lib/utils";

type GameFormProps = {
  game?: ResolvedGame;
};

type FormState = {
  formError: string | null;
  fieldErrors: GameFormFieldErrors;
};

const initialFormState: FormState = {
  formError: null,
  fieldErrors: {},
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

function FieldError({ message }: Readonly<{ message?: string }>) {
  if (!message) {
    return null;
  }

  return <p className="match-form__field-error">{message}</p>;
}

function PlayerField({
  icon,
  label,
  onChange,
  placeholder,
  suggestions,
  value,
}: Readonly<{
  icon: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  suggestions: string[];
  value: string;
}>) {
  const [isOpen, setIsOpen] = useState(false);
  const filteredSuggestions = useMemo(() => filterSuggestions(suggestions, value), [suggestions, value]);

  return (
    <label className="match-input-group">
      <span className="match-input-group__label">{label}</span>
      <div
        className="autocomplete"
        onBlur={(event) => {
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
            autoComplete="off"
            className="match-input-shell__input"
            onChange={(event) => {
              onChange(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            required
            value={value}
          />
        </div>

        {isOpen && filteredSuggestions.length ? (
          <div className="autocomplete__dropdown">
            {filteredSuggestions.map((option) => (
              <button
                className="autocomplete__option"
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                type="button"
              >
                <span>{option}</span>
                {option.toLowerCase() === value.trim().toLowerCase() ? (
                  <span className="autocomplete__hint">Selected</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </label>
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

function SaveButton({ disabled, pending }: Readonly<{ disabled: boolean; pending: boolean }>) {
  return (
    <button className="match-save-button" disabled={disabled || pending} type="submit">
      {pending ? "Saving..." : "Save Match"}
    </button>
  );
}

export function GameForm({ game }: Readonly<GameFormProps>) {
  const router = useRouter();
  const { players, selectedPlayerId } = useSelectedPlayer();
  const [format, setFormat] = useState<GameFormat>(game?.format ?? "singles");
  const [playedAt, setPlayedAt] = useState(toInputDateTimeValue(game?.playedAt ?? new Date().toISOString()));
  const [sideAScore, setSideAScore] = useState<number>(game?.sideAScore ?? 20);
  const [sideBScore, setSideBScore] = useState<number>(game?.sideBScore ?? 20);
  const initialSideAValues = game?.sideAPlayers.map((player) => player.name) ?? [];
  const initialSideBValues = game?.sideBPlayers.map((player) => player.name) ?? [];
  const [sideAPlayers, setSideAPlayers] = useState<string[]>(() => buildInitialValues(initialSideAValues));
  const [sideBPlayers, setSideBPlayers] = useState<string[]>(() => buildInitialValues(initialSideBValues));
  const [state, setState] = useState<FormState>(initialFormState);
  const lastScoreTapRef = useRef(0);
  const createMutation = useCreateGameMutation(selectedPlayerId);
  const updateMutation = useUpdateGameMutation(game?.id ?? "", selectedPlayerId);
  const mutation = game ? updateMutation : createMutation;

  const selectedPlayer = players.find((player) => player.id === selectedPlayerId) ?? null;
  const primaryPlayerName = game ? sideAPlayers[0] ?? "" : selectedPlayer?.name ?? sideAPlayers[0] ?? "";
  const partnerName = sideAPlayers[1] ?? "";
  const opponentName = sideBPlayers[0] ?? "";
  const opponentPartnerName = sideBPlayers[1] ?? "";
  const allSuggestions = useMemo(
    () => Array.from(new Set(players.map((player) => player.name))).sort((a, b) => a.localeCompare(b)),
    [players],
  );

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState(initialFormState);

    if (!primaryPlayerName.trim()) {
      setState({
        formError: "Select your identity before saving a match.",
        fieldErrors: {},
      });
      return;
    }

    const payload = {
      playedAt,
      format,
      sideAScore,
      sideBScore,
      sideAPlayers: format === "doubles" ? [primaryPlayerName, partnerName] : [primaryPlayerName],
      sideBPlayers: format === "doubles" ? [opponentName, opponentPartnerName] : [opponentName],
    };

    try {
      const result = await mutation.mutateAsync(payload);
      router.push(game ? `/matches/${result.id}` : "/");
    } catch (error) {
      if (error instanceof ApiClientError && error.payload) {
        setState({
          formError: error.payload.message,
          fieldErrors: error.payload.fieldErrors ?? {},
        });
        return;
      }

      setState({
        formError: "Could not save game. Please try again.",
        fieldErrors: {},
      });
    }
  }

  return (
    <form className="match-form" onSubmit={handleSubmit}>
      {state.formError ? <p className="match-form__banner">{state.formError}</p> : null}

      <section className="match-form__section">
        <p className="eyebrow" style={{ margin: 0 }}>
          Select format
        </p>

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
        <FieldError message={state.fieldErrors.format} />
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

        {format === "doubles" ? (
          <PlayerField
            icon="+"
            label="Partner (for doubles)"
            onChange={setPartnerName}
            placeholder="Add a teammate..."
            suggestions={allSuggestions.filter((option) => option !== primaryPlayerName && option !== opponentName)}
            value={partnerName}
          />
        ) : null}
        <FieldError message={state.fieldErrors.sideAPlayers} />

        <PlayerField
          icon="OP"
          label="Opponent"
          onChange={setOpponentName}
          placeholder="Search by name or handle..."
          suggestions={allSuggestions.filter((option) => option !== primaryPlayerName && option !== partnerName)}
          value={opponentName}
        />

        {format === "doubles" ? (
          <PlayerField
            icon="OP"
            label="Opponent Partner"
            onChange={setOpponentPartnerName}
            placeholder="Add second opponent..."
            suggestions={allSuggestions.filter(
              (option) => option !== primaryPlayerName && option !== partnerName && option !== opponentName,
            )}
            value={opponentPartnerName}
          />
        ) : null}
        <FieldError message={state.fieldErrors.sideBPlayers} />

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
        <FieldError message={state.fieldErrors.playedAt} />
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
        <FieldError message={state.fieldErrors.sideAScore ?? state.fieldErrors.sideBScore} />
      </section>

      <SaveButton disabled={!primaryPlayerName} pending={mutation.isPending} />
    </form>
  );
}
