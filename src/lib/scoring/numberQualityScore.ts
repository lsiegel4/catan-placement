// Calculate number quality score (preference for 6/8)

import { HexTile } from '@/types/board';
import { NUMBER_QUALITY } from '@/constants/numbers';

// Calculate bonus for high-quality numbers (6, 8 are best)
export function calculateNumberQualityScore(adjacentHexes: HexTile[]): number {
  let score = 0;

  adjacentHexes.forEach(hex => {
    if (hex.resource === 'desert' || hex.number === null) {
      return;
    }

    score += NUMBER_QUALITY[hex.number] || 0;
  });

  return score;
}
