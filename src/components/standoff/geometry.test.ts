import { seatPositions, pairGeometry } from "./geometry";

describe("seatPositions", () => {
  it("returns N positions on a circle of radius RADIUS, top-first clockwise", () => {
    const pos = seatPositions(4, 100);
    expect(pos).toHaveLength(4);
    // 0: top (-90deg) → x=0, y=-100
    expect(pos[0].x).toBeCloseTo(0);
    expect(pos[0].y).toBeCloseTo(-100);
    // 1: right (0deg) → x=100, y=0
    expect(pos[1].x).toBeCloseTo(100);
    expect(pos[1].y).toBeCloseTo(0);
  });

  it("returns 6 positions for the standard hex layout", () => {
    const pos = seatPositions(6, 100);
    expect(pos).toHaveLength(6);
    expect(pos[0].x).toBeCloseTo(0);
    expect(pos[0].y).toBeCloseTo(-100);
  });
});

describe("pairGeometry", () => {
  it("returns C(N, 2) entries", () => {
    const pos = seatPositions(6, 100);
    expect(pairGeometry(pos)).toHaveLength(15);
  });

  it("computes length and rotation for each unordered pair", () => {
    const pairs = pairGeometry([{ x: 0, y: 0 }, { x: 100, y: 0 }]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].length).toBeCloseTo(100);
    expect(pairs[0].rotation).toBeCloseTo(0);
  });
});
