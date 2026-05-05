import { navyHoursLabel, toRoman } from "./navyHours";

describe("navyHoursLabel", () => {
  it("returns hours for rounds 1..7", () => {
    expect(navyHoursLabel(1)).toMatch(/8 hours out/);
    expect(navyHoursLabel(7)).toMatch(/2 hours out/);
  });
  it("returns the sails-on-horizon line for round 8+", () => {
    expect(navyHoursLabel(8)).toMatch(/sails on the horizon/);
  });
});

describe("toRoman", () => {
  it("maps 1..8", () => {
    expect(toRoman(1)).toBe("I");
    expect(toRoman(8)).toBe("VIII");
  });
  it("falls back to the decimal string for values out of range", () => {
    expect(toRoman(9)).toBe("9");
    expect(toRoman(0)).toBe("");
  });
});

describe("navyHoursLabel via t", () => {
  it("routes through the translator when one is provided", () => {
    const t = (key: string, vars?: Record<string, unknown>) =>
      `${key}:${JSON.stringify(vars ?? {})}`;
    expect(navyHoursLabel(3, t)).toBe('shell.navyHoursLabel:{"hours":6}');
    expect(navyHoursLabel(8, t)).toBe("shell.sailsLabel:{}");
  });
});
