"use client";

import { useMemo, useState } from "react";

import { upsertGameAction } from "@/app/actions";
import { useSelectedPlayer } from "@/app/_components/selected-player-provider";
import type { GameFormat, ResolvedGame } from "@/lib/types";
import { toInputDateTimeValue } from "@/lib/utils";

type GameFormProps = {
  game?: ResolvedGame;
  playerSuggestions: string[];
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
  icon,
  label,
  name,
  onChange,
  placeholder,
  suggestions,
  value,
}: Readonly<{
  icon: string;
  label: string;
  name: string;
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
            name={name}
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

export function GameForm({ game, playerSuggestions }: Readonly<GameFormProps>) {
  const { players, selectedPlayerId } = useSelectedPlayer();
  const [format, setFormat] = useState<GameFormat>(game?.format ?? "singles");
  const [sideAScore, setSideAScore] = useState<number>(game?.sideAScore ?? 20);
  const [sideBScore, setSideBScore] = useState<number>(game?.sideBScore ?? 20);
  const allSuggestions = useMemo(
    () => Array.from(new Set(playerSuggestions)).sort((a, b) => a.localeCompare(b)),
    [playerSuggestions],
  );
  const initialSideAValues = game?.sideAPlayers.map((player) => player.name) ?? [];
  const initialSideBValues = game?.sideBPlayers.map((player) => player.name) ?? [];
  const [sideAPlayers, setSideAPlayers] = useState<string[]>(() => buildInitialValues(initialSideAValues));
  const [sideBPlayers, setSideBPlayers] = useState<string[]>(() => buildInitialValues(initialSideBValues));

  const selectedPlayer = players.find((player) => player.id === selectedPlayerId) ?? null;
  const primaryPlayerName = game ? sideAPlayers[0] ?? "" : selectedPlayer?.name ?? sideAPlayers[0] ?? "";
  const partnerName = sideAPlayers[1] ?? "";
  const opponentName = sideBPlayers[0] ?? "";
  const opponentPartnerName = sideBPlayers[1] ?? "";

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

  return (
    <form action={upsertGameAction} className="match-form">
      <input name="id" type="hidden" defaultValue={game?.id ?? ""} />
      <input name="format" type="hidden" value={format} />
      <input name="sideAPlayers" type="hidden" value={primaryPlayerName} />

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
            name="sideAPlayers"
            onChange={setPartnerName}
            placeholder="Add a teammate..."
            suggestions={allSuggestions.filter((option) => option !== primaryPlayerName && option !== opponentName)}
            value={partnerName}
          />
        ) : null}

        <PlayerField
          icon="OP"
          label="Opponent"
          name="sideBPlayers"
          onChange={setOpponentName}
          placeholder="Search by name or handle..."
          suggestions={allSuggestions.filter((option) => option !== primaryPlayerName && option !== partnerName)}
          value={opponentName}
        />

        {format === "doubles" ? (
          <PlayerField
            icon="OP"
            label="Opponent Partner"
            name="sideBPlayers"
            onChange={setOpponentPartnerName}
            placeholder="Add second opponent..."
            suggestions={allSuggestions.filter(
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
              defaultValue={toInputDateTimeValue(game?.playedAt ?? new Date().toISOString())}
              name="playedAt"
              required
              type="datetime-local"
            />
          </div>
        </label>
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
                onClick={() => setSideAScore((current) => clampScore(current - 1))}
                type="button"
              >
                -
              </button>
              <input
                className="display score-panel__input"
                min={0}
                max={30}
                name="sideAScore"
                onChange={(event) => setSideAScore(clampScore(Number(event.target.value) || 0))}
                required
                type="number"
                value={sideAScore}
              />
              <button
                aria-label="Increase your score"
                className="score-stepper__button"
                onClick={() => setSideAScore((current) => clampScore(current + 1))}
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
                onClick={() => setSideBScore((current) => clampScore(current - 1))}
                type="button"
              >
                -
              </button>
              <input
                className="display score-panel__input score-panel__input--alt"
                min={0}
                max={30}
                name="sideBScore"
                onChange={(event) => setSideBScore(clampScore(Number(event.target.value) || 0))}
                required
                type="number"
                value={sideBScore}
              />
              <button
                aria-label="Increase opponent score"
                className="score-stepper__button"
                onClick={() => setSideBScore((current) => clampScore(current + 1))}
                type="button"
              >
                +
              </button>
            </div>
          </label>
        </div>
      </section>

      <button className="match-save-button" type="submit">
        Save Match
      </button>
    </form>
  );
}
