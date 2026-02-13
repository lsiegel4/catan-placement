// Expansion scoring — measures future settlement potential via road building.
//
// Improvement over simple counting: each reachable 2-hop vertex is weighted by
// its dice-probability quality rather than counting it as a flat 1. A vertex
// touching 6/8/5 counts more than one touching 3/11/2.

import { BoardState } from '@/types/board';
import { NUMBER_DOTS } from '@/constants/numbers';

export function calculateExpansionScore(vertexId: string, board: BoardState): number {
  const vertex = board.vertices.get(vertexId);
  if (!vertex) return 0;

  // Find vertices exactly 2 edges away (valid future settlement spots).
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

  let qualitySum = 0;

  twoAway.forEach(id => {
    const v = board.vertices.get(id);
    if (!v || v.hasSettlement) return;

    // Distance rule check (ignoring our hypothetical placement at vertexId).
    const blocked = v.adjacentVertices.some(avId => {
      if (avId === vertexId) return false;
      const av = board.vertices.get(avId);
      return av?.hasSettlement;
    });
    if (blocked) return;

    // Must have at least one non-desert hex.
    const hexes = v.adjacentHexes
      .map(hexId => board.hexes.get(hexId))
      .filter(h => h !== undefined && h!.resource !== 'desert');

    if (hexes.length === 0) return;

    // Weight by probability: sum pip counts / 36 for adjacent resource hexes.
    const prob = hexes.reduce((sum, hex) => {
      return sum + (NUMBER_DOTS[hex!.number ?? 0] ?? 0) / 36;
    }, 0);

    // Score per spot: 0.4 baseline (just for being accessible) + quality bonus.
    // A premium 3-hex spot (6, 8, 5) gives prob ≈ 0.42, scaling to a full bonus.
    qualitySum += 0.4 + Math.min(prob / 0.42, 1) * 0.6;
  });

  // Normalize: ~6 spots at average quality 0.7 each = 4.2 represents a wide-open board.
  return Math.min(qualitySum / 4.2, 1);
}
