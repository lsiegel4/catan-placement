// Calculate resource diversity score

import { HexTile, BoardState, ResourceType } from '@/types/board';

const ALL_RESOURCES: ResourceType[] = ['wheat', 'wood', 'brick', 'ore', 'sheep'];

// Calculate bonus for having access to multiple resource types.
// When the player already has settlements, scores how many *new* resource types
// this vertex adds to their existing portfolio (second-settlement awareness).
export function calculateDiversityScore(
  adjacentHexes: HexTile[],
  board?: BoardState,
  playerColor?: string
): number {
  const vertexResources = new Set<ResourceType>();
  adjacentHexes.forEach(hex => {
    if (hex.resource !== 'desert') vertexResources.add(hex.resource);
  });

  if (board && playerColor) {
    // Gather resources the player already covers
    const coveredResources = new Set<ResourceType>();
    board.vertices.forEach(v => {
      if (!v.hasSettlement || v.playerColor !== playerColor) return;
      v.adjacentHexes.forEach(hexId => {
        const hex = board.hexes.get(hexId);
        if (hex && hex.resource !== 'desert') coveredResources.add(hex.resource as ResourceType);
      });
    });

    if (coveredResources.size > 0) {
      // Resources still missing from portfolio
      const uncovered = ALL_RESOURCES.filter(r => !coveredResources.has(r));
      if (uncovered.length === 0) return 0; // Already have everything

      // How many of the missing resources does this vertex fill?
      const newResources = ALL_RESOURCES.filter(
        r => vertexResources.has(r) && !coveredResources.has(r)
      );
      const portfolioScore = newResources.length / uncovered.length;
      const rawScore = vertexResources.size / 5;
      // Blend: still favours new resources, but raw vertex diversity keeps
      // high-production spots competitive (prevents ignoring overall yield).
      return 0.5 * portfolioScore + 0.5 * rawScore;
    }
  }

  // Default: vertex's own diversity (5 unique resources = 1.0)
  return vertexResources.size / 5;
}
