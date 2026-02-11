// Port access scoring

import { Vertex, HexTile, PortType, ResourceType } from '@/types/board';
import { NUMBER_DOTS } from '@/constants/numbers';

function portResource(type: PortType): ResourceType | null {
  const match = type.match(/^2:1:(.+)$/);
  if (!match) return null;
  return match[1] as ResourceType;
}

export function calculatePortScore(vertex: Vertex, adjacentHexes: HexTile[]): number {
  if (!vertex.hasPort) return 0;

  const portType = vertex.hasPort;

  if (portType === '3:1') {
    // Generic port: moderate flat value
    return 0.4;
  }

  // Specialized 2:1 port
  const specialResource = portResource(portType);
  if (!specialResource) return 0;

  // Check if this vertex produces the port's resource
  const matchingHexes = adjacentHexes.filter(
    hex => hex.resource === specialResource && hex.number !== null
  );

  if (matchingHexes.length > 0) {
    // Producing the port's resource here = very valuable
    const production = matchingHexes.reduce(
      (sum, hex) => sum + (NUMBER_DOTS[hex.number!] || 0), 0
    );
    return 0.6 + Math.min(production / 10, 0.4); // 0.6 to 1.0
  }

  // Has port but doesn't produce the matching resource — still some value
  return 0.2;
}
