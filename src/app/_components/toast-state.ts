import { toastConfig } from "@/lib/config/ui";

export type ToastVariant = "success" | "error" | "info";

export type Toast = {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  durationMs: number | null;
};

export type ToastInput = {
  variant: ToastVariant;
  title: string;
  description?: string;
  durationMs?: number | null;
};

export const MAX_TOASTS = toastConfig.maxVisible;
export const SUCCESS_TOAST_DURATION_MS = toastConfig.durationsMs.success;
export const INFO_TOAST_DURATION_MS = toastConfig.durationsMs.info;
export const ERROR_TOAST_DURATION_MS = toastConfig.durationsMs.error;

export function getToastDuration(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return SUCCESS_TOAST_DURATION_MS;
    case "info":
      return INFO_TOAST_DURATION_MS;
    case "error":
      return ERROR_TOAST_DURATION_MS;
    default:
      return INFO_TOAST_DURATION_MS;
  }
}

export function appendToast(toasts: Toast[], toast: Toast) {
  if (toasts.length < MAX_TOASTS) {
    return [...toasts, toast];
  }

  const replaceIndex = toasts.findIndex((entry) => entry.variant !== "error");

  if (replaceIndex >= 0) {
    return [...toasts.slice(0, replaceIndex), ...toasts.slice(replaceIndex + 1), toast];
  }

  return [...toasts.slice(1), toast];
}

export function removeToast(toasts: Toast[], id: string) {
  return toasts.filter((toast) => toast.id !== id);
}
