// Hexagonal grid geometry using axial coordinates
// Reference: https://www.redblobgames.com/grids/hexagons/
// Using pointy-top hex orientation

export interface AxialCoord {
  q: number;
  r: number;
}

export interface CubeCoord {
  x: number;
  y: number;
  z: number;
}

// Convert axial to cube coordinates
export function axialToCube(hex: AxialCoord): CubeCoord {
  const x = hex.q;
  const z = hex.r;
  const y = -x - z;
  return { x, y, z };
}

// Convert cube to axial coordinates
export function cubeToAxial(cube: CubeCoord): AxialCoord {
  return {
    q: cube.x,
    r: cube.z,
  };
}

// Neighbor directions for pointy-top hex (axial coordinates)
// Going clockwise from top-right: NE, E, SE, SW, W, NW
const NEIGHBOR_DIRECTIONS: AxialCoord[] = [
  { q: 1, r: -1 },  // NE (top-right)
  { q: 1, r: 0 },   // E (right)
  { q: 0, r: 1 },   // SE (bottom-right)
  { q: -1, r: 1 },  // SW (bottom-left)
  { q: -1, r: 0 },  // W (left)
  { q: 0, r: -1 },  // NW (top-left)
];

// Get the 6 neighbors of a hex
export function getHexNeighbors(hex: AxialCoord): AxialCoord[] {
  return NEIGHBOR_DIRECTIONS.map(dir => ({
    q: hex.q + dir.q,
    r: hex.r + dir.r,
  }));
}

// Calculate distance between two hexes (in hex steps)
export function hexDistance(a: AxialCoord, b: AxialCoord): number {
  const ac = axialToCube(a);
  const bc = axialToCube(b);

  return (
    Math.abs(ac.x - bc.x) +
    Math.abs(ac.y - bc.y) +
    Math.abs(ac.z - bc.z)
  ) / 2;
}

// Vertex directions for pointy-top hex
// N = top, S = bottom, NE/SE/SW/NW = four corners on the sides
export type VertexDirection = 'N' | 'NE' | 'SE' | 'S' | 'SW' | 'NW';

export const VERTEX_DIRECTIONS: VertexDirection[] = ['N', 'NE', 'SE', 'S', 'SW', 'NW'];

// For a pointy-top hex, each corner is shared by 3 hexes
// This maps each vertex direction to the TWO neighboring hexes that share that corner
const VERTEX_NEIGHBOR_OFFSETS: Record<VertexDirection, AxialCoord[]> = {
  N: [
    { q: 0, r: -1 },  // NW neighbor
    { q: 1, r: -1 },  // NE neighbor
  ],
  NE: [
    { q: 1, r: -1 },  // NE neighbor
    { q: 1, r: 0 },   // E neighbor
  ],
  SE: [
    { q: 1, r: 0 },   // E neighbor
    { q: 0, r: 1 },   // SE neighbor
  ],
  S: [
    { q: 0, r: 1 },   // SE neighbor
    { q: -1, r: 1 },  // SW neighbor
  ],
  SW: [
    { q: -1, r: 1 },  // SW neighbor
    { q: -1, r: 0 },  // W neighbor
  ],
  NW: [
    { q: -1, r: 0 },  // W neighbor
    { q: 0, r: -1 },  // NW neighbor
  ],
};

// Get the 3 hexes that share a vertex
export function getVertexNeighborHexes(
  hex: AxialCoord,
  direction: VertexDirection
): AxialCoord[] {
  return VERTEX_NEIGHBOR_OFFSETS[direction].map(offset => ({
    q: hex.q + offset.q,
    r: hex.r + offset.r,
  }));
}

// Create a vertex ID from hex coordinates and direction
export function createVertexId(q: number, r: number, direction: VertexDirection): string {
  return `vertex-${q}-${r}-${direction}`;
}

// Create a hex ID from coordinates
export function createHexId(q: number, r: number): string {
  return `hex-${q}-${r}`;
}

// Parse vertex ID back to components
export function parseVertexId(id: string): { q: number; r: number; direction: VertexDirection } | null {
  const match = id.match(/^vertex-(-?\d+)-(-?\d+)-([A-Z]+)$/);
  if (!match) return null;

  return {
    q: parseInt(match[1], 10),
    r: parseInt(match[2], 10),
    direction: match[3] as VertexDirection,
  };
}

// Parse hex ID back to components
export function parseHexId(id: string): { q: number; r: number } | null {
  const match = id.match(/^hex-(-?\d+)-(-?\d+)$/);
  if (!match) return null;

  return {
    q: parseInt(match[1], 10),
    r: parseInt(match[2], 10),
  };
}
