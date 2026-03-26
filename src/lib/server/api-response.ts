import type { ApiErrorResponse } from "@/lib/api/contracts";
import { ApiNotFoundError, ApiValidationError } from "@/lib/server/errors";

export function jsonResponse<T>(body: T, init?: ResponseInit) {
  return Response.json(body, init);
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiValidationError) {
    const response: ApiErrorResponse = {
      message: error.message,
      fieldErrors: error.fieldErrors,
      code: error.code,
    };
    return Response.json(response, { status: 400 });
  }

  if (error instanceof ApiNotFoundError) {
    const response: ApiErrorResponse = {
      message: error.message,
      code: error.code,
    };
    return Response.json(response, { status: 404 });
  }

  const response: ApiErrorResponse = {
    message: "Something went wrong while processing the request.",
    code: "INTERNAL_ERROR",
  };
  return Response.json(response, { status: 500 });
}
