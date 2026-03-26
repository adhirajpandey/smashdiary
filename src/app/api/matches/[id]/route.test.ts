jest.mock("@/lib/services/matches", () => ({
  getMatchDetailData: jest.fn(),
}));

jest.mock("@/lib/services/save-match", () => ({
  saveMatchFromJson: jest.fn(),
}));

import { GET, PUT } from "@/app/api/matches/[id]/route";
import { getMatchDetailData } from "@/lib/services/matches";
import { saveMatchFromJson } from "@/lib/services/save-match";

describe("GET /api/matches/[id]", () => {
  it("returns not found for unknown match ids", async () => {
    (getMatchDetailData as jest.Mock).mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/matches/12"), {
      params: Promise.resolve({ id: "12" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "NOT_FOUND",
      },
    });
  });
});

describe("PUT /api/matches/[id]", () => {
  it("returns the saved id on success", async () => {
    (saveMatchFromJson as jest.Mock).mockResolvedValue({ ok: true, id: 12 });

    const response = await PUT(
      new Request("http://localhost/api/matches/12", {
        method: "PUT",
        body: JSON.stringify({
          playedAt: "2026-03-22T12:00",
          format: "singles",
          sideAScore: 21,
          sideBScore: 18,
          sideAPlayers: ["Aman"],
          sideBPlayers: ["Riya"],
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "12" }) },
    );

    expect(saveMatchFromJson).toHaveBeenCalledWith(
      expect.objectContaining({
        format: "singles",
        sideAScore: 21,
      }),
      12,
    );
    expect(response.status).toBe(200);
  });
});
