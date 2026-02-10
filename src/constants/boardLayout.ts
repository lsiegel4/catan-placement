// Standard 3-4 player board hex positions using axial coordinates

export interface HexPosition {
  q: number;
  r: number;
}

// Standard 19-hex board layout (pointy-top orientation)
// Center hex is at (0, 0)
export const STANDARD_HEX_POSITIONS: HexPosition[] = [
  // Center
  { q: 0, r: 0 },

  // Inner ring (6 hexes)
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },

  // Outer ring (12 hexes)
  { q: 2, r: 0 },
  { q: 2, r: -1 },
  { q: 2, r: -2 },
  { q: 1, r: -2 },
  { q: 0, r: -2 },
  { q: -1, r: -1 },
  { q: -2, r: 0 },
  { q: -2, r: 1 },
  { q: -2, r: 2 },
  { q: -1, r: 2 },
  { q: 0, r: 2 },
  { q: 1, r: 1 },
];
