jest.mock("server-only", () => ({}), { virtual: true });

jest.mock("@/lib/runtime-mode", () => ({
  isTestMode: jest.fn(),
}));

jest.mock("@/lib/store-sqlite", () => ({
  deleteGameSqlite: jest.fn(),
  getGameByIdSqlite: jest.fn(),
  listGamesSqlite: jest.fn(),
  listPlayersSqlite: jest.fn(),
  saveGameSqlite: jest.fn(),
}));

jest.mock("@/lib/server/diary-repository", () => ({
  deleteGameRepo: jest.fn(),
  getGameByIdRepo: jest.fn(),
  listGamesRepo: jest.fn(),
  listPlayersRepo: jest.fn(),
  saveGameRepo: jest.fn(),
}));

import { isTestMode } from "@/lib/runtime-mode";
import { deleteGameSqlite } from "@/lib/store-sqlite";
import { deleteGameRepo } from "@/lib/server/diary-repository";
import { ApiNotFoundError } from "@/lib/server/errors";
import { deleteGameService } from "@/lib/server/diary-service";

describe("deleteGameService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes through sqlite in test mode", async () => {
    (isTestMode as jest.Mock).mockReturnValue(true);
    (deleteGameSqlite as jest.Mock).mockResolvedValue(true);

    await expect(deleteGameService("g_test")).resolves.toBeUndefined();

    expect(deleteGameSqlite).toHaveBeenCalledWith("g_test");
    expect(deleteGameRepo).not.toHaveBeenCalled();
  });

  it("deletes through the repository outside test mode", async () => {
    (isTestMode as jest.Mock).mockReturnValue(false);
    (deleteGameRepo as jest.Mock).mockResolvedValue(true);

    await expect(deleteGameService("g_prod")).resolves.toBeUndefined();

    expect(deleteGameRepo).toHaveBeenCalledWith("g_prod");
    expect(deleteGameSqlite).not.toHaveBeenCalled();
  });

  it("throws a not found error when nothing is deleted", async () => {
    (isTestMode as jest.Mock).mockReturnValue(false);
    (deleteGameRepo as jest.Mock).mockResolvedValue(false);

    await expect(deleteGameService("g_missing")).rejects.toEqual(new ApiNotFoundError("Match record not found."));
  });
});
