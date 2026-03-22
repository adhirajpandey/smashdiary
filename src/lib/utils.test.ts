import { cn, ensureArray, formatPlayerName, fromInputDateTimeValue, toInputDateTimeValue } from "@/lib/utils";

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
    const iso = fromInputDateTimeValue(input);

    expect(iso).toContain("T");
    expect(iso.endsWith("Z")).toBe(true);
    expect(toInputDateTimeValue(iso)).toBe(input);
  });

  it("formats player names for full and stacked display", () => {
    expect(formatPlayerName("  Adhiraj   Pandey  ")).toBe("Adhiraj Pandey");
    expect(formatPlayerName("Adhiraj Pandey", "stacked")).toEqual(["Adhiraj", "Pandey"]);
    expect(formatPlayerName("Mary Jane Watson", "stacked")).toEqual(["Mary", "Jane", "Watson"]);
  });
});
