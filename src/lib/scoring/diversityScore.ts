// Calculate resource diversity score

import { HexTile, ResourceType } from '@/types/board';

// Calculate bonus for having access to multiple resource types
export function calculateDiversityScore(adjacentHexes: HexTile[]): number {
  const uniqueResources = new Set<ResourceType>();

  adjacentHexes.forEach(hex => {
    if (hex.resource !== 'desert') {
      uniqueResources.add(hex.resource);
    }
  });

  // Score from 0 to 1 based on diversity (5 unique resources = 1.0)
  return uniqueResources.size / 5;
}
