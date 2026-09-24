import { ApiClientError, fetchJson } from "@/lib/api/fetch-json";

function mockFetchResponse(body: string, status: number) {
  global.fetch = jest.fn().mockResolvedValue(new Response(body, { status }));
}

async function captureError(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error;
  }

  throw new Error("Expected the request to fail.");
}

describe("fetchJson", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns data from a success envelope", async () => {
    mockFetchResponse(JSON.stringify({ data: { id: 7 } }), 201);

    await expect(fetchJson("/api/matches", { method: "POST", body: "{}" })).resolves.toEqual({ id: 7 });
    expect(global.fetch).toHaveBeenCalledWith("/api/matches", {
      cache: "no-store",
      method: "POST",
      body: "{}",
      headers: { "Content-Type": "application/json" },
    });
  });

  it("throws validation errors with field errors", async () => {
    mockFetchResponse(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          formError: "Please fix the highlighted input and try again.",
          fieldErrors: { playedOn: "Enter a valid date." },
        },
      }),
      400,
    );

    const error = await captureError(fetchJson("/api/matches"));

    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Please fix the highlighted input and try again.",
      formError: "Please fix the highlighted input and try again.",
      fieldErrors: { playedOn: "Enter a valid date." },
    });
  });

  it("throws not-found errors with the server message", async () => {
    mockFetchResponse(JSON.stringify({ error: { code: "NOT_FOUND", message: "Match not found." } }), 404);

    await expect(fetchJson("/api/matches/9")).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Match not found.",
    });
  });

  it.each([
    ["an HTML error page", "<html><body>Bad Gateway</body></html>", 502],
    ["an empty body", "", 504],
    ["invalid JSON", "{", 500],
    ["JSON without the API envelope", JSON.stringify({ ok: true }), 200],
  ])("throws an internal error for %s", async (_, body, status) => {
    mockFetchResponse(body, status);

    const error = await captureError(fetchJson("/api/players"));

    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({
      code: "INTERNAL_ERROR",
      message: `Unexpected response from the server (${status}).`,
    });
  });
});
