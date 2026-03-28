import {
  cn,
  ensureArray,
  formatCompactDate,
  formatGameDate,
  formatPlayerName,
  formatScore,
  formatScoreline,
  fromInputDateValue,
  getCurrentInputDateValue,
  toInputDateValue,
} from "@/lib/utils";

describe("utils", () => {
  it("wraps non-array values and preserves arrays", () => {
    expect(ensureArray("one")).toEqual(["one"]);
    expect(ensureArray([1, 2])).toEqual([1, 2]);
  });

  it("combines class names with falsy filtering", () => {
    expect(cn("card", null, false && "hidden", "active")).toBe("card active");
  });

  it("round-trips date input values", () => {
    const input = "2026-03-21";
    const normalized = fromInputDateValue(input);

    expect(normalized).toBe("2026-03-21");
    expect(toInputDateValue(normalized)).toBe(input);
  });

  it("formats stored match dates without timezone drift", () => {
    const storedValue = "2026-03-22";

    expect(formatCompactDate(storedValue, "8 PM")).toBe("22 Mar • 8 PM");
    expect(formatGameDate(storedValue, "8 PM")).toBe("Sun, 22 Mar • 8 PM");
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
