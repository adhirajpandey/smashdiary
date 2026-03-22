import { initialUpsertGameActionState } from "@/app/action-state";
import { upsertGameAction } from "@/app/actions";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

jest.mock("@/lib/store", () => ({
  saveGame: jest.fn(),
}));

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { saveGame } from "@/lib/store";

function buildValidFormData() {
  const formData = new FormData();
  formData.set("playedAt", "2026-03-22T12:00");
  formData.set("format", "singles");
  formData.set("sideAScore", "21");
  formData.set("sideBScore", "18");
  formData.append("sideAPlayers", "Sanidhya");
  formData.append("sideBPlayers", "Amar");
  return formData;
}

describe("upsertGameAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns normalized errors for invalid input", async () => {
    const formData = new FormData();
    formData.set("playedAt", "");
    formData.set("format", "singles");
    formData.set("sideAScore", "12");
    formData.set("sideBScore", "12");
    formData.append("sideAPlayers", "");
    formData.append("sideBPlayers", "");

    const result = await upsertGameAction(initialUpsertGameActionState, formData);
    expect(result.formError).toBe("Please fix the highlighted input and try again.");
    expect(Object.keys(result.fieldErrors).length).toBeGreaterThan(0);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects with savedGameId on success", async () => {
    (saveGame as jest.Mock).mockResolvedValue(101);
    const formData = buildValidFormData();

    await expect(upsertGameAction(initialUpsertGameActionState, formData)).rejects.toThrow("NEXT_REDIRECT");
    expect(revalidatePath).toHaveBeenCalledTimes(4);
    expect(redirect).toHaveBeenCalledWith("/?savedGameId=101");
  });
});
