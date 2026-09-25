"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

import { useToast } from "@/app/_components/toast-provider";
import { ApiClientError, useDeleteMatchMutation } from "@/lib/api/client";
import { getCloneMatchRoute, getEditMatchRoute } from "@/lib/config/routes";
import { cn } from "@/lib/utils";

type MatchActionsMenuProps = {
  matchId: number;
  className?: string;
  align?: "start" | "end";
  deleteRedirectHref?: string;
};

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export function MatchActionsMenu({
  matchId,
  className,
  align = "end",
  deleteRedirectHref,
}: Readonly<MatchActionsMenuProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const menuId = useId();
  const confirmTitleId = useId();
  const confirmDescriptionId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const deletePendingRef = useRef(false);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const { pushToast } = useToast();
  const deleteMatchMutation = useDeleteMatchMutation(matchId);

  useEffect(() => {
    deletePendingRef.current = deleteMatchMutation.isPending;
  }, [deleteMatchMutation.isPending]);

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

  useEffect(() => {
    if (!isDeleteConfirmOpen) {
      return;
    }

    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyTouchAction = document.body.style.touchAction;

    if (!restoreFocusRef.current) {
      restoreFocusRef.current =
        activeElement && activeElement !== document.body ? activeElement : triggerRef.current;
    }

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();

        if (!deletePendingRef.current) {
          setDeleteError(null);
          setIsDeleteConfirmOpen(false);
        }

        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = getFocusableElements(dialogRef.current);

      if (!focusableElements.length) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.touchAction = previousBodyTouchAction;
      restoreFocusRef.current?.focus();
      restoreFocusRef.current = null;
    };
  }, [isDeleteConfirmOpen]);

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setDeleteError(null);
      setIsDeleteConfirmOpen(false);
      setIsOpen(true);
    }
  }

  function closeMenu() {
    if (deleteMatchMutation.isPending) {
      return;
    }

    setIsOpen(false);
  }

  function closeDeleteModal() {
    if (deleteMatchMutation.isPending) {
      return;
    }

    setDeleteError(null);
    setIsDeleteConfirmOpen(false);
  }

  function openDeleteConfirm() {
    setDeleteError(null);
    restoreFocusRef.current = triggerRef.current;
    setIsOpen(false);
    setIsDeleteConfirmOpen(true);
  }

  async function handleDelete() {
    setDeleteError(null);

    try {
      const outcome = await deleteMatchMutation.mutateAsync();
      setIsDeleteConfirmOpen(false);

      switch (outcome) {
        case "deleted":
          pushToast({
            variant: "success",
            title: "Match deleted",
            description: "The saved scoreline has been cleared from your diary.",
          });
          break;
        case "already_deleted":
          pushToast({
            variant: "info",
            title: "Match already deleted",
            description: "It was removed from another tab or device.",
          });
          break;
      }

      if (deleteRedirectHref) {
        router.push(deleteRedirectHref);
      }
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : "Could not delete match. Please try again.";

      setDeleteError(message);
      pushToast({
        variant: "error",
        title: "Delete failed",
        description: message,
        durationMs: null,
      });
    }
  }

  return (
    <div className={cn("match-actions", (isOpen || isDeleteConfirmOpen) && "match-actions--open", className)} ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Open match actions"
        className="match-actions__trigger"
        onClick={() => {
          setDeleteError(null);
          setIsDeleteConfirmOpen(false);
          setIsOpen((current) => !current);
        }}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span aria-hidden="true" className="match-actions__trigger-dots">
          <span className="match-actions__trigger-dot" />
          <span className="match-actions__trigger-dot" />
          <span className="match-actions__trigger-dot" />
        </span>
      </button>

      {isOpen ? (
        <div
          className={cn("match-actions__menu", align === "start" && "match-actions__menu--start")}
          id={menuId}
          role="menu"
        >
          <Link className="match-actions__item" href={getCloneMatchRoute(matchId)} onClick={closeMenu} role="menuitem">
            CLONE
          </Link>
          <Link className="match-actions__item" href={getEditMatchRoute(matchId)} onClick={closeMenu} role="menuitem">
            EDIT
          </Link>
          <button
            className="match-actions__item match-actions__item--danger"
            onClick={openDeleteConfirm}
            role="menuitem"
            type="button"
          >
            DELETE
          </button>
        </div>
      ) : null}

      {isDeleteConfirmOpen ? (
        <div className="match-delete-modal">
          <button
            aria-label="Close delete confirmation"
            className="match-delete-modal__backdrop"
            onClick={closeDeleteModal}
            type="button"
          />
          <div
            aria-describedby={confirmDescriptionId}
            aria-labelledby={confirmTitleId}
            aria-modal="true"
            className="glass match-delete-modal__panel"
            ref={dialogRef}
            role="alertdialog"
            tabIndex={-1}
          >
            <div className="match-delete-modal__copy">
              <p className="match-delete-modal__eyebrow">Destructive action</p>
              <p className="match-delete-modal__title" id={confirmTitleId}>
                Remove this saved match?
              </p>
              <p className="match-delete-modal__description" id={confirmDescriptionId}>
                This deletes the saved scoreline and roster mapping. Player records stay intact.
              </p>
            </div>

            <div className="match-delete-modal__actions">
              <button
                className="secondary-button match-delete-modal__button"
                disabled={deleteMatchMutation.isPending}
                onClick={closeDeleteModal}
                ref={cancelButtonRef}
                type="button"
              >
                Cancel
              </button>
              <button
                className="danger-button match-delete-modal__button"
                disabled={deleteMatchMutation.isPending}
                onClick={() => {
                  void handleDelete();
                }}
                type="button"
              >
                {deleteMatchMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>

            {deleteError ? <p className="match-delete-modal__error">{deleteError}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
