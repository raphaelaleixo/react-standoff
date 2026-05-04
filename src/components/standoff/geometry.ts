export interface Pos {
  x: number;
  y: number;
}

export interface PairGeom {
  i: number;
  j: number;
  length: number;
  rotation: number; // degrees, atan2(dy, dx)
}

// Top-centered seat positions on a circle of given radius. The first seat
// sits at the top (-90deg) and the rest follow clockwise.
export function seatPositions(n: number, radius: number): Pos[] {
  const out: Pos[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (-90 + (i * 360) / n) * (Math.PI / 180);
    out.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
  }
  return out;
}

// Returns geometry for every unordered pair (i < j), with the segment's
// length and the rotation needed to lay a horizontal element from i to j.
export function pairGeometry(positions: Pos[]): PairGeom[] {
  const out: PairGeom[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dx = positions[j].x - positions[i].x;
      const dy = positions[j].y - positions[i].y;
      out.push({
        i,
        j,
        length: Math.hypot(dx, dy),
        rotation: (Math.atan2(dy, dx) * 180) / Math.PI,
      });
    }
  }
  return out;
}
