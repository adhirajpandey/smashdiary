"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { appendToast, getToastDuration, removeToast, type Toast, type ToastInput } from "@/app/_components/toast-state";

type ToastContextValue = {
  toasts: Toast[];
  pushToast: (input: ToastInput) => string;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function createToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ToastProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutIdsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;

    return () => {
      timeoutIds.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      timeoutIds.clear();
    };
  }, []);

  function dismissToast(id: string) {
    const timeoutId = timeoutIdsRef.current.get(id);

    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutIdsRef.current.delete(id);
    }

    setToasts((current) => removeToast(current, id));
  }

  function pushToast(input: ToastInput) {
    const id = createToastId();
    const toast: Toast = {
      id,
      variant: input.variant,
      title: input.title,
      description: input.description,
      durationMs: input.durationMs === undefined ? getToastDuration(input.variant) : input.durationMs,
    };

    setToasts((current) => {
      const next = appendToast(current, toast);
      const nextIds = new Set(next.map((entry) => entry.id));

      current.forEach((entry) => {
        if (!nextIds.has(entry.id)) {
          const timeoutId = timeoutIdsRef.current.get(entry.id);
          if (timeoutId !== undefined) {
            window.clearTimeout(timeoutId);
            timeoutIdsRef.current.delete(entry.id);
          }
        }
      });

      return next;
    });

    if (toast.durationMs !== null) {
      const timeoutId = window.setTimeout(() => {
        dismissToast(id);
      }, toast.durationMs);

      timeoutIdsRef.current.set(id, timeoutId);
    }

    return id;
  }

  return (
    <ToastContext.Provider
      value={{
        toasts,
        pushToast,
        dismissToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

export function ToastViewport() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("ToastViewport must be used inside ToastProvider.");
  }

  if (!context.toasts.length) {
    return null;
  }

  return (
    <div className="toast-viewport" aria-atomic="false">
      {context.toasts.map((toast) => (
        <section
          aria-live={toast.variant === "error" ? "assertive" : "polite"}
          className={`toast toast--${toast.variant}`}
          key={toast.id}
          role={toast.variant === "error" ? "alert" : "status"}
        >
          <div className="toast__copy">
            <p className="toast__title">{toast.title}</p>
            {toast.description ? <p className="toast__description">{toast.description}</p> : null}
          </div>
          <button
            aria-label={`Dismiss ${toast.title}`}
            className="toast__dismiss"
            onClick={() => {
              context.dismissToast(toast.id);
            }}
            type="button"
          >
            Close
          </button>
        </section>
      ))}
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}
