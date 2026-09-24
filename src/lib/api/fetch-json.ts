import type { GameFormFieldErrors } from "@/lib/action-errors";
import type { ApiErrorCode, ApiResponse } from "@/lib/api/contracts";

export class ApiClientError extends Error {
  code: ApiErrorCode;
  formError?: string;
  fieldErrors?: GameFormFieldErrors;

  constructor(message: string, code: ApiErrorCode, formError?: string, fieldErrors?: GameFormFieldErrors) {
    super(message);
    this.code = code;
    this.formError = formError;
    this.fieldErrors = fieldErrors;
  }
}

function parseApiResponse<T>(text: string): ApiResponse<T> | null {
  try {
    const body: unknown = JSON.parse(text);

    if (body && typeof body === "object" && ("data" in body || "error" in body)) {
      return body as ApiResponse<T>;
    }

    return null;
  } catch {
    return null;
  }
}

export async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  // Proxies and platform errors can return HTML or an empty body instead of the API envelope.
  const body = parseApiResponse<T>(await response.text());

  if (!body) {
    throw new ApiClientError(`Unexpected response from the server (${response.status}).`, "INTERNAL_ERROR");
  }

  if ("error" in body) {
    throw new ApiClientError(
      body.error.message ?? body.error.formError ?? "Request failed.",
      body.error.code,
      body.error.formError,
      body.error.fieldErrors,
    );
  }

  return body.data;
}
