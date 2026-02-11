// Expansion scoring — measures future settlement potential via road building

import { BoardState } from '@/types/board';

export function calculateExpansionScore(vertexId: string, board: BoardState): number {
  const vertex = board.vertices.get(vertexId);
  if (!vertex) return 0;

  // Find vertices exactly 2 edges away (reachable by building 2 roads)
  const adjacentSet = new Set(vertex.adjacentVertices);
  const twoAway = new Set<string>();

  vertex.adjacentVertices.forEach(adjId => {
    const adj = board.vertices.get(adjId);
    if (!adj) return;
    adj.adjacentVertices.forEach(adj2Id => {
      if (adj2Id !== vertexId && !adjacentSet.has(adj2Id)) {
        twoAway.add(adj2Id);
      }
    });
  });

  // Count those that would be valid future settlement placements
  let validCount = 0;

  twoAway.forEach(id => {
    const v = board.vertices.get(id);
    if (!v || v.hasSettlement) return;

    // Check distance rule (ignoring our hypothetical placement at vertexId)
    const blocked = v.adjacentVertices.some(avId => {
      if (avId === vertexId) return false;
      const av = board.vertices.get(avId);
      return av?.hasSettlement;
    });

    if (!blocked) {
      const hasResources = v.adjacentHexes.some(hexId => {
        const hex = board.hexes.get(hexId);
        return hex && hex.resource !== 'desert';
      });
      if (hasResources) validCount++;
    }
  });

  // Normalize: typical max is about 6 reachable valid spots
  return Math.min(validCount / 6, 1);
}
