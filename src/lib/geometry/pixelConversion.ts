// Convert hex coordinates to pixel positions for SVG rendering
// Using pointy-top orientation (points at top and bottom)

import { AxialCoord } from './hexCoordinates';

// Hex size in pixels (distance from center to corner)
export const HEX_SIZE = 50;

// For pointy-top hex:
// - Width = sqrt(3) * size
// - Height = 2 * size
export const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
export const HEX_HEIGHT = 2 * HEX_SIZE;

// Convert axial coordinates to pixel coordinates (pointy-top)
export function hexToPixel(hex: AxialCoord, hexSize: number = HEX_SIZE): { x: number; y: number } {
  const x = hexSize * Math.sqrt(3) * (hex.q + hex.r / 2);
  const y = hexSize * (3 / 2) * hex.r;
  return { x, y };
}

// Convert pixel coordinates back to axial (for click detection)
export function pixelToHex(x: number, y: number, hexSize: number = HEX_SIZE): AxialCoord {
  const q = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / hexSize;
  const r = (2 / 3 * y) / hexSize;
  return hexRound({ q, r });
}

// Round fractional hex coordinates to nearest integer hex
function hexRound(hex: { q: number; r: number }): AxialCoord {
  let q = Math.round(hex.q);
  let r = Math.round(hex.r);
  const s = Math.round(-hex.q - hex.r);

  const qDiff = Math.abs(q - hex.q);
  const rDiff = Math.abs(r - hex.r);
  const sDiff = Math.abs(s - (-hex.q - hex.r));

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  }

  return { q, r };
}

// Get polygon points for a pointy-top hex (corners at 0°, 60°, 120°, 180°, 240°, 300°)
export function getHexagonPoints(hexSize: number = HEX_SIZE): string {
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i - 90; // Start at top (−90° = pointing up)
    const angleRad = (Math.PI / 180) * angleDeg;
    points.push({
      x: hexSize * Math.cos(angleRad),
      y: hexSize * Math.sin(angleRad),
    });
  }

  return points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}

// Get the 6 corner positions for a pointy-top hex
export function getHexCorners(hexSize: number = HEX_SIZE): Array<{ x: number; y: number; index: number }> {
  const corners = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i - 90;
    const angleRad = (Math.PI / 180) * angleDeg;
    corners.push({
      x: hexSize * Math.cos(angleRad),
      y: hexSize * Math.sin(angleRad),
      index: i,
    });
  }
  return corners;
}

// Vertex directions for pointy-top hex
// Corners: 0=top, 1=upper-right, 2=lower-right, 3=bottom, 4=lower-left, 5=upper-left
export type VertexDirection = 'N' | 'NE' | 'SE' | 'S' | 'SW' | 'NW';

// Map direction to corner index
const VERTEX_ANGLES: Record<VertexDirection, number> = {
  N: -90,    // Top (0)
  NE: -30,   // Upper-right (1)
  SE: 30,    // Lower-right (2)
  S: 90,     // Bottom (3)
  SW: 150,   // Lower-left (4)
  NW: -150,  // Upper-left (5)
};

export function getVertexPixelOffset(
  direction: VertexDirection,
  hexSize: number = HEX_SIZE
): { x: number; y: number } {
  const angleDeg = VERTEX_ANGLES[direction];
  const angleRad = (Math.PI / 180) * angleDeg;

  return {
    x: hexSize * Math.cos(angleRad),
    y: hexSize * Math.sin(angleRad),
  };
}
