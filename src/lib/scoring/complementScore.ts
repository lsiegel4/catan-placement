// Complement scoring — rewards spots that fill gaps in your existing settlements

import { HexTile, BoardState, ResourceType } from '@/types/board';

export function calculateComplementScore(
  adjacentHexes: HexTile[],
  board: BoardState,
  playerColor: string
): number {
  // Find existing player settlements
  const playerVertices: string[] = [];
  board.vertices.forEach(v => {
    if (v.hasSettlement && v.playerColor === playerColor) {
      playerVertices.push(v.id);
    }
  });

  // No bonus when placing first settlement — nothing to complement
  if (playerVertices.length === 0) return 0;

  // Gather resources and numbers already covered
  const coveredResources = new Set<ResourceType>();
  const coveredNumbers = new Set<number>();

  playerVertices.forEach(sid => {
    const sv = board.vertices.get(sid);
    if (!sv) return;
    sv.adjacentHexes.forEach(hexId => {
      const hex = board.hexes.get(hexId);
      if (!hex || hex.resource === 'desert') return;
      coveredResources.add(hex.resource);
      if (hex.number) coveredNumbers.add(hex.number);
    });
  });

  // Score based on new resources and numbers this vertex would add
  let newResourceBonus = 0;
  let newNumberBonus = 0;
  const thisResources = new Set<ResourceType>();

  adjacentHexes.forEach(hex => {
    if (hex.resource === 'desert' || hex.number === null) return;

    if (!coveredResources.has(hex.resource) && !thisResources.has(hex.resource)) {
      newResourceBonus += 0.3; // Big bonus for each new resource type
    }
    thisResources.add(hex.resource);

    if (!coveredNumbers.has(hex.number)) {
      newNumberBonus += 0.1; // Smaller bonus for new number
    }
  });

  return Math.min(newResourceBonus + newNumberBonus, 1);
}
