import type { GameFormFieldErrors } from "@/lib/action-errors";

export class ApiValidationError extends Error {
  readonly fieldErrors: GameFormFieldErrors;
  readonly code = "VALIDATION_ERROR";

  constructor(message: string, fieldErrors: GameFormFieldErrors = {}) {
    super(message);
    this.name = "ApiValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export class ApiNotFoundError extends Error {
  readonly code = "NOT_FOUND";

  constructor(message: string) {
    super(message);
    this.name = "ApiNotFoundError";
  }
}
