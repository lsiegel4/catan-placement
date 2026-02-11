// Resource scarcity scoring — rare resources are more valuable

import { HexTile, BoardState, ResourceType } from '@/types/board';
import { NUMBER_DOTS } from '@/constants/numbers';

// Compute probability-weighted abundance for each resource across the board
function computeResourceAbundance(board: BoardState): Map<ResourceType, number> {
  const abundance = new Map<ResourceType, number>();

  board.hexes.forEach(hex => {
    if (hex.resource === 'desert' || hex.number === null) return;
    const dots = NUMBER_DOTS[hex.number] || 0;
    const current = abundance.get(hex.resource) || 0;
    abundance.set(hex.resource, current + dots);
  });

  return abundance;
}

export function calculateScarcityScore(adjacentHexes: HexTile[], board: BoardState): number {
  const abundance = computeResourceAbundance(board);

  let maxAbundance = 0;
  abundance.forEach(v => { if (v > maxAbundance) maxAbundance = v; });
  if (maxAbundance === 0) return 0;

  let score = 0;
  const counted = new Set<ResourceType>();

  adjacentHexes.forEach(hex => {
    if (hex.resource === 'desert' || hex.number === null) return;
    if (counted.has(hex.resource)) return;
    counted.add(hex.resource);

    const resourceAbundance = abundance.get(hex.resource) || 0;
    // Scarce resources (low abundance relative to max) get higher scores
    score += 1 - (resourceAbundance / maxAbundance);
  });

  // Normalize: max 3 unique non-desert resources per vertex
  return score / 3;
}
