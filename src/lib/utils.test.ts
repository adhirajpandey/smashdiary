import {
  cn,
  formatCompactDate,
  formatGameDate,
  formatPlayerName,
  formatScore,
  formatScoreline,
  getCurrentInputDateValue,
  toInputDateValue,
} from "@/lib/utils";

describe("utils", () => {
  it("combines class names with falsy filtering", () => {
    expect(cn("card", null, false && "hidden", "active")).toBe("card active");
  });

  it("normalizes stored dates to input values", () => {
    expect(toInputDateValue("2026-03-21")).toBe("2026-03-21");
    expect(toInputDateValue("2026-03-21T22:29:00.000Z")).toBe("2026-03-21");
  });

  it("formats stored match dates without timezone drift", () => {
    const storedValue = "2026-03-22";

    expect(formatCompactDate(storedValue, "8 PM")).toBe("22 Mar • 8 PM");
    expect(formatGameDate(storedValue, "8 PM")).toBe("Sun, 22 Mar • 8 PM");
  });

  it("rejects date strings that are not ISO dates or wall-clock datetimes", () => {
    expect(toInputDateValue("2026-03-22T22:29:00.000Z")).toBe("2026-03-22");
    expect(() => toInputDateValue("March 5 2026")).toThrow("Invalid match date.");
    expect(() => toInputDateValue("garbage")).toThrow("Invalid match date.");
  });

  it("builds the default input value in IST", () => {
    const instant = new Date("2026-03-22T18:30:00.000Z");

    expect(getCurrentInputDateValue(instant)).toBe("2026-03-23");
  });

  it("formats player names for full and stacked display", () => {
    expect(formatPlayerName("  Adhiraj   Pandey  ")).toBe("Adhiraj Pandey");
    expect(formatPlayerName("Adhiraj Pandey", "stacked")).toEqual(["Adhiraj", "Pandey"]);
    expect(formatPlayerName("Mary Jane Watson", "stacked")).toEqual(["Mary", "Jane", "Watson"]);
  });

  it("formats scores as two digits", () => {
    expect(formatScore(0)).toBe("00");
    expect(formatScore(7)).toBe("07");
    expect(formatScore(21)).toBe("21");
  });

  it("formats scorelines with padded values and preserved separators", () => {
    expect(formatScoreline(21, 7, "-")).toBe("21-07");
    expect(formatScoreline(21, 7, "/")).toBe("21/07");
    expect(formatScoreline(21, 7, ":")).toBe("21:07");
  });
});
