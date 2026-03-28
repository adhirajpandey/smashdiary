import { z } from "zod";

import { normalizeGameFormErrors } from "@/lib/action-errors";

describe("normalizeGameFormErrors", () => {
  it("maps first field errors and returns a stable form message", () => {
    const schema = z.object({
      sideAScore: z.number().min(21, "Winning side must reach 21."),
      playedOn: z.string().min(1, "Date is required."),
    });
    const parsed = schema.safeParse({ sideAScore: 19, playedOn: "" });
    if (parsed.success) {
      throw new Error("Expected parse to fail.");
    }

    const normalized = normalizeGameFormErrors(parsed.error);
    expect(normalized.formError).toBe("Please fix the highlighted input and try again.");
    expect(normalized.fieldErrors.sideAScore).toBe("Winning side must reach 21.");
    expect(normalized.fieldErrors.playedOn).toBe("Date is required.");
  });

  it("falls back to generic form error for non-field issues", () => {
    const schema = z.string().refine(() => false, "Unexpected payload.");
    const parsed = schema.safeParse("ok");
    if (parsed.success) {
      throw new Error("Expected parse to fail.");
    }

    const normalized = normalizeGameFormErrors(parsed.error);
    expect(normalized.formError).toBe("Unexpected payload.");
    expect(normalized.fieldErrors).toEqual({});
  });
});

