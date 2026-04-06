import type { QueryClient } from "@tanstack/react-query";

import { invalidateDiaryQueriesInBackground, queryKeys } from "@/lib/api/client";

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function createQueryClientMock() {
  return {
    invalidateQueries: jest.fn().mockResolvedValue(undefined),
    removeQueries: jest.fn(),
  } as unknown as QueryClient;
}

describe("invalidateDiaryQueriesInBackground", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("starts create invalidation work without waiting for completion", async () => {
    const deferred = createDeferred<void>();
    const queryClient = {
      invalidateQueries: jest.fn().mockReturnValue(deferred.promise),
      removeQueries: jest.fn(),
    } as unknown as QueryClient;

    invalidateDiaryQueriesInBackground(queryClient);

    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(4);
    expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(1, { queryKey: queryKeys.players });
    expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(2, { queryKey: ["dashboard"] });
    expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(3, { queryKey: ["matches"] });
    expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(4, { queryKey: ["stats"] });

    deferred.resolve();
    await deferred.promise;
  });

  it("includes stats format in dashboard and stats query keys", () => {
    expect(queryKeys.dashboard(7, "singles")).toEqual(["dashboard", 7, "singles"]);
    expect(queryKeys.matches(7, "singles")).toEqual(["matches", 7, "singles"]);
    expect(queryKeys.stats(7, "doubles")).toEqual(["stats", 7, "doubles"]);
  });

  it("includes the saved match detail query for update invalidation", async () => {
    const queryClient = createQueryClientMock();

    invalidateDiaryQueriesInBackground(queryClient, 42);

    await Promise.resolve();

    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(5);
    expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(5, {
      queryKey: queryKeys.matchDetail(42),
    });
  });

  it("catches background invalidation failures without throwing", async () => {
    const error = new Error("invalidate failed");
    const queryClient = {
      invalidateQueries: jest.fn().mockRejectedValue(error),
      removeQueries: jest.fn(),
    } as unknown as QueryClient;
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => invalidateDiaryQueriesInBackground(queryClient)).not.toThrow();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to invalidate diary queries after match save.",
      error,
    );
  });
});
