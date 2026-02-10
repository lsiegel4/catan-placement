// Calculate probability-based expected value score

import { HexTile } from '@/types/board';
import { NUMBER_DOTS } from '@/constants/numbers';

// Calculate expected resource production based on dice probabilities
export function calculateProbabilityScore(adjacentHexes: HexTile[]): number {
  let score = 0;

  adjacentHexes.forEach(hex => {
    if (hex.resource === 'desert' || hex.number === null) {
      return;
    }

    // Each dot represents a 1/36 probability of rolling that number
    const dots = NUMBER_DOTS[hex.number] || 0;
    score += dots / 36;
  });

  return score;
}
