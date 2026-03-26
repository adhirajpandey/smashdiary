import {
  appendToast,
  ERROR_TOAST_DURATION_MS,
  getToastDuration,
  INFO_TOAST_DURATION_MS,
  removeToast,
  SUCCESS_TOAST_DURATION_MS,
  type Toast,
} from "@/app/_components/toast-state";

function buildToast(id: string, variant: Toast["variant"]): Toast {
  return {
    id,
    variant,
    title: `${variant}-${id}`,
    durationMs: getToastDuration(variant),
  };
}

describe("toast state", () => {
  it("keeps up to three toasts and replaces the oldest non-error first", () => {
    const current = [buildToast("1", "error"), buildToast("2", "success"), buildToast("3", "info")];

    expect(appendToast(current, buildToast("4", "success")).map((toast) => toast.id)).toEqual(["1", "3", "4"]);
  });

  it("replaces the oldest toast when all visible toasts are errors", () => {
    const current = [buildToast("1", "error"), buildToast("2", "error"), buildToast("3", "error")];

    expect(appendToast(current, buildToast("4", "error")).map((toast) => toast.id)).toEqual(["2", "3", "4"]);
  });

  it("removes toasts by id", () => {
    const current = [buildToast("1", "success"), buildToast("2", "info")];

    expect(removeToast(current, "1").map((toast) => toast.id)).toEqual(["2"]);
  });

  it("uses different default durations by severity", () => {
    expect(getToastDuration("success")).toBe(SUCCESS_TOAST_DURATION_MS);
    expect(getToastDuration("info")).toBe(INFO_TOAST_DURATION_MS);
    expect(getToastDuration("error")).toBe(ERROR_TOAST_DURATION_MS);
  });
});
