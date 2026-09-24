import type { GameFormFieldErrors } from "@/lib/action-errors";
import type { ApiErrorCode, ApiResponse } from "@/lib/api/contracts";
import { logger } from "@/lib/logger";

export function jsonSuccess<T>(data: T, status = 200) {
  return Response.json({ data } satisfies ApiResponse<T>, { status });
}

export function jsonError(code: ApiErrorCode, status: number, message?: string) {
  const body = {
    error: {
      code,
      ...(message ? { message } : {}),
    },
  } satisfies ApiResponse<never>;

  return Response.json(body, { status });
}

export function jsonValidationError(formError: string, fieldErrors: GameFormFieldErrors = {}) {
  const body = {
    error: {
      code: "VALIDATION_ERROR",
      formError,
      fieldErrors,
    },
  } satisfies ApiResponse<never>;

  return Response.json(body, { status: 400 });
}

export function jsonNotFound(message = "Record not found.") {
  return jsonError("NOT_FOUND", 404, message);
}

export function jsonServerError(message = "Something went wrong.") {
  return jsonError("INTERNAL_ERROR", 500, message);
}

export function logRouteError(route: string, error: unknown) {
  logger.error("api", "route_error", { route, error });
}

export function logRouteWarning(route: string, error: unknown) {
  logger.warn("api", "route_warning", { route, error });
}
