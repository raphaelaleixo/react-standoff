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
});
