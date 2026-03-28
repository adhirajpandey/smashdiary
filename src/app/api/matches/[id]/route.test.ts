jest.mock("@/lib/services/matches", () => ({
  getMatchDetailData: jest.fn(),
}));

jest.mock("@/lib/services/save-match", () => ({
  saveMatchFromJson: jest.fn(),
}));

jest.mock("@/lib/services/delete-match", () => ({
  deleteMatchById: jest.fn(),
}));

import { DELETE, GET, PUT } from "@/app/api/matches/[id]/route";
import { deleteMatchById } from "@/lib/services/delete-match";
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
  const payload = {
    playedOn: "2026-03-22",
    slot: "12 PM",
    format: "singles",
    sideAScore: 21,
    sideBScore: 18,
    sideAPlayers: ["Aman"],
    sideBPlayers: ["Riya"],
  };

  it("returns the saved id on success", async () => {
    (saveMatchFromJson as jest.Mock).mockResolvedValue({ type: "success", id: 12 });

    const response = await PUT(
      new Request("http://localhost/api/matches/12", {
        method: "PUT",
        body: JSON.stringify(payload),
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

  it("returns validation errors from the save service", async () => {
    (saveMatchFromJson as jest.Mock).mockResolvedValue({
      type: "validation_error",
      errors: {
        formError: "Please fix the highlighted input and try again.",
        fieldErrors: { sideAScore: "Extended games must still end with a 2-point lead." },
      },
    });

    const response = await PUT(
      new Request("http://localhost/api/matches/12", {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "12" }) },
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

  it("returns not found when the update target does not exist", async () => {
    (saveMatchFromJson as jest.Mock).mockResolvedValue({
      type: "not_found",
      message: "Match not found.",
    });

    const response = await PUT(
      new Request("http://localhost/api/matches/12", {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "12" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "NOT_FOUND",
        message: "Match not found.",
      },
    });
  });

  it("returns an internal error when save execution fails", async () => {
    (saveMatchFromJson as jest.Mock).mockResolvedValue({
      type: "internal_error",
      message: "Could not save match. Please try again.",
    });

    const response = await PUT(
      new Request("http://localhost/api/matches/12", {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "12" }) },
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "INTERNAL_ERROR",
        message: "Could not save match. Please try again.",
      },
    });
  });
});

describe("DELETE /api/matches/[id]", () => {
  it("returns the deleted id on success", async () => {
    (deleteMatchById as jest.Mock).mockResolvedValue(true);

    const response = await DELETE(new Request("http://localhost/api/matches/12"), {
      params: Promise.resolve({ id: "12" }),
    });

    expect(deleteMatchById).toHaveBeenCalledWith(12);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: { id: 12 } });
  });

  it("returns not found when the match does not exist", async () => {
    (deleteMatchById as jest.Mock).mockResolvedValue(false);

    const response = await DELETE(new Request("http://localhost/api/matches/12"), {
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
