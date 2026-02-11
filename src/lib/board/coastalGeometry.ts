// Shared coastal geometry computation for port placement and rendering

import { HexTile } from '@/types/board';
import { hexToPixel } from '@/lib/geometry/pixelConversion';

export interface CoastalVertex {
  x: number;
  y: number;
  key: string; // "X_Y" format matching vertex ID suffix
  hexCount: number;
}

export function computeCoastalData(hexes: Map<string, HexTile> | HexTile[], hexSize: number) {
  const hexArray = hexes instanceof Map ? Array.from(hexes.values()) : hexes;

  const vertexMap = new Map<string, CoastalVertex>();
  const vertexAngles = [-90, -30, 30, 90, 150, -150];

  hexArray.forEach(hex => {
    const pos = hexToPixel({ q: hex.q, r: hex.r }, hexSize);
    vertexAngles.forEach(angleDeg => {
      const rad = (Math.PI / 180) * angleDeg;
      const vx = pos.x + hexSize * Math.cos(rad);
      const vy = pos.y + hexSize * Math.sin(rad);
      const key = `${Math.round(vx)}_${Math.round(vy)}`;
      const existing = vertexMap.get(key);
      if (existing) existing.hexCount++;
      else vertexMap.set(key, { x: vx, y: vy, key, hexCount: 1 });
    });
  });

  // Compute board center
  let cx = 0, cy = 0;
  hexArray.forEach(hex => {
    const pos = hexToPixel({ q: hex.q, r: hex.r }, hexSize);
    cx += pos.x;
    cy += pos.y;
  });
  cx /= hexArray.length;
  cy /= hexArray.length;

  // Coastal vertices sorted by angle (counter-clockwise perimeter order)
  const vertices = Array.from(vertexMap.values())
    .filter(v => v.hexCount < 3)
    .sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));

  return { vertices, center: { x: cx, y: cy } };
}

// Standard port edge indices: 9 evenly spaced positions around the 30-edge perimeter
export const PORT_EDGE_INDICES = [1, 4, 7, 11, 14, 17, 21, 24, 27];
