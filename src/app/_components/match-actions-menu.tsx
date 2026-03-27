"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

import { cn } from "@/lib/utils";

type MatchActionsMenuProps = {
  matchId: number;
  className?: string;
  align?: "start" | "end";
};

function getCloneHref(matchId: number) {
  return `/matches/new?cloneFrom=${matchId}`;
}

export function MatchActionsMenu({
  matchId,
  className,
  align = "end",
}: Readonly<MatchActionsMenuProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(true);
    }
  }

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <div className={cn("match-actions", className)} ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Open match actions"
        className="match-actions__trigger"
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
        type="button"
      >
        <span aria-hidden="true">⋯</span>
      </button>

      {isOpen ? (
        <div
          className={cn("match-actions__menu", align === "start" && "match-actions__menu--start")}
          id={menuId}
          role="menu"
        >
          <Link className="match-actions__item" href={getCloneHref(matchId)} onClick={closeMenu} role="menuitem">
            Clone
          </Link>
          <Link className="match-actions__item" href={`/matches/${matchId}/edit`} onClick={closeMenu} role="menuitem">
            Edit
          </Link>
        </div>
      ) : null}
    </div>
  );
}
