import { cn, ensureArray, formatCompactDate, formatGameDate, formatPlayerName, fromInputDateTimeValue, getCurrentInputDateTimeValue, toInputDateTimeValue } from "@/lib/utils";

describe("utils", () => {
  it("wraps non-array values and preserves arrays", () => {
    expect(ensureArray("one")).toEqual(["one"]);
    expect(ensureArray([1, 2])).toEqual([1, 2]);
  });

  it("combines class names with falsy filtering", () => {
    expect(cn("card", null, false && "hidden", "active")).toBe("card active");
  });

  it("round-trips datetime-local values", () => {
    const input = "2026-03-21T18:30";
    const normalized = fromInputDateTimeValue(input);

    expect(normalized).toBe("2026-03-21 18:30:00");
    expect(toInputDateTimeValue(normalized)).toBe(input);
  });

  it("formats stored match dates without timezone drift", () => {
    const storedValue = "2026-03-22 22:29:00";

    expect(formatCompactDate(storedValue)).toBe("22 Mar");
    expect(formatGameDate(storedValue)).toBe("Sun, 22 Mar, 10:29 pm");
  });

  it("builds the default input value in IST", () => {
    const instant = new Date("2026-03-22T18:30:00.000Z");

    expect(getCurrentInputDateTimeValue(instant)).toBe("2026-03-23T00:00");
  });

  it("formats player names for full and stacked display", () => {
    expect(formatPlayerName("  Adhiraj   Pandey  ")).toBe("Adhiraj Pandey");
    expect(formatPlayerName("Adhiraj Pandey", "stacked")).toEqual(["Adhiraj", "Pandey"]);
    expect(formatPlayerName("Mary Jane Watson", "stacked")).toEqual(["Mary", "Jane", "Watson"]);
  });
});
