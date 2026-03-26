jest.mock("@/lib/services/matches", () => ({
  getMatchesData: jest.fn(),
}));

jest.mock("@/lib/services/save-match", () => ({
  saveMatchFromJson: jest.fn(),
}));

import { GET, POST } from "@/app/api/matches/route";
import { getMatchesData } from "@/lib/services/matches";
import { saveMatchFromJson } from "@/lib/services/save-match";

describe("GET /api/matches", () => {
  it("returns match history JSON", async () => {
    (getMatchesData as jest.Mock).mockResolvedValue({
      selectedPlayerName: "Aman",
      matches: [],
    });

    const response = await GET(new Request("http://localhost/api/matches?playerId=1"));

    expect(getMatchesData).toHaveBeenCalledWith(1);
    expect(response.status).toBe(200);
  });
});

describe("POST /api/matches", () => {
  const payload = {
    playedAt: "2026-03-22T12:00",
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
  });

  it("returns normalized validation errors from the save service", async () => {
    (saveMatchFromJson as jest.Mock).mockResolvedValue({
      ok: false,
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

  it("returns a created match id on success", async () => {
    (saveMatchFromJson as jest.Mock).mockResolvedValue({ ok: true, id: 55 });

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
