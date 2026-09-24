jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/services/matches", () => ({
  getMatchesData: jest.fn(),
}));

jest.mock("@/lib/services/save-match", () => ({
  saveMatchFromJson: jest.fn(),
}));

import { GET, POST } from "@/app/api/matches/route";
import { getMatchesData } from "@/lib/services/matches";
import { saveMatchFromJson } from "@/lib/services/save-match";
import { logger } from "@/lib/logger";

describe("GET /api/matches", () => {
  it("returns match history JSON", async () => {
    (getMatchesData as jest.Mock).mockResolvedValue({
      format: "singles",
      selectedPlayerName: "Aman",
      matches: [],
    });

    const response = await GET(new Request("http://localhost/api/matches?playerId=1&format=doubles"));

    expect(getMatchesData).toHaveBeenCalledWith(1, "doubles");
    expect(response.status).toBe(200);
  });
});

describe("POST /api/matches", () => {
  const payload = {
    playedOn: "2026-03-22",
    slot: "12 PM",
    format: "singles",
    sideAScore: 21,
    sideBScore: 18,
    sideAPlayers: ["Aman"],
    sideBPlayers: ["Riya"],
  };

  it("returns validation errors for invalid JSON payloads", async () => {
    const request = new Request("http://localhost/api/matches", {
      method: "POST",
      body: "{",
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        formError: "Invalid request payload.",
      },
    });
    expect(logger.warn).toHaveBeenCalledWith(
      "api",
      "route_warning",
      expect.objectContaining({ route: "POST /api/matches" }),
    );
  });

  it("returns normalized validation errors from the save service", async () => {
    (saveMatchFromJson as jest.Mock).mockResolvedValue({
      type: "validation_error",
      errors: {
        formError: "Please fix the highlighted input and try again.",
        fieldErrors: { sideAScore: "Extended games must still end with a 2-point lead." },
      },
    });

    const response = await POST(
      new Request("http://localhost/api/matches", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        fieldErrors: {
          sideAScore: "Extended games must still end with a 2-point lead.",
        },
      },
    });
  });

  it("returns an internal error when save execution fails", async () => {
    (saveMatchFromJson as jest.Mock).mockResolvedValue({
      type: "internal_error",
      message: "Could not save match. Please try again.",
    });

    const response = await POST(
      new Request("http://localhost/api/matches", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "INTERNAL_ERROR",
        message: "Could not save match. Please try again.",
      },
    });
  });

  it("returns a created match id on success", async () => {
    (saveMatchFromJson as jest.Mock).mockResolvedValue({ type: "success", id: 55 });

    const response = await POST(
      new Request("http://localhost/api/matches", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ data: { id: 55 } });
  });
});
