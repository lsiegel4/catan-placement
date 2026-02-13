// Road placement scoring — evaluates the best road to build from each settlement.
//
// Core design principle: a road's value is NOT just the quality of the spots it
// reaches. During setup, other players will directly settle on the best available
// vertices, so roads that lead toward obvious #1 spots are risky. The safest and
// most valuable roads lead toward:
//   1. Secondary spots that are good enough for you but not hotly contested
//   2. Port vertices — ports are locked in by the board and can't be "stolen"
//   3. Isolated areas where your settlements provide a geographic advantage
//
// Risk model:
//   attractivenessRisk(T) = rawQuality(T) * 0.35
//     → High-quality spots attract opponents; everyone targets them first
//   proximityRisk(T) = capped(opponentsWithin2Hops(T) / 2) * 0.45
//     → Opponents close to T can race to settle it in setup or via road-building
//   totalRisk = min(attractiveness + proximity, 0.75)
//   adjustedValue(T) = rawQuality(T) * (1 - totalRisk) + portBonus(T)
//
// Ports get a flat 0.3 bonus on top of the risk-adjusted quality. Their value
// is intrinsic (the port doesn't move or get taken), so they're reliable targets.

import { BoardState } from '@/types/board';
import { RoadSuggestion } from '@/types/scoring';
import { NUMBER_DOTS } from '@/constants/numbers';

// Raw probability-based quality for a vertex, 0–1.
// Normalized so a premium 3-hex (6, 8, 5) ≈ 1.0.
function rawVertexQuality(vertexId: string, board: BoardState): number {
  const v = board.vertices.get(vertexId);
  if (!v) return 0;

  let prob = 0;
  let hasResources = false;
  v.adjacentHexes.forEach(hexId => {
    const hex = board.hexes.get(hexId);
    if (!hex || hex.resource === 'desert' || !hex.number) return;
    hasResources = true;
    prob += (NUMBER_DOTS[hex.number] ?? 0) / 36;
  });
  if (!hasResources) return 0;

  return Math.min(prob / 0.42, 1) * 0.85;
}

// Risk-adjusted value for an expansion spot T.
// High-quality spots that everyone wants get discounted; port spots get a bonus.
function riskAdjustedSpotValue(
  spotVertexId: string,
  board: BoardState,
  playerColor: string
): number {
  const quality = rawVertexQuality(spotVertexId, board);
  if (quality === 0) return 0;

  const v = board.vertices.get(spotVertexId);
  if (!v) return 0;

  // Count distinct opponent settlements within 2 hops of T.
  // 1-hop opponents: T is already blocked by distance rule if they exist, so
  // isValidFutureSpot filters those out. In practice we see mostly 2-hop opponents.
  const nearbyOpponents = new Set<string>();
  v.adjacentVertices.forEach(adj1Id => {
    board.vertices.get(adj1Id)?.adjacentVertices.forEach(adj2Id => {
      const adj2 = board.vertices.get(adj2Id);
      if (adj2?.hasSettlement && adj2.playerColor !== playerColor) {
        nearbyOpponents.add(adj2Id);
      }
    });
  });

  // Risk components
  const attractivenessRisk = quality * 0.35;               // beautiful spots attract crowds
  const proximityRisk = Math.min(nearbyOpponents.size / 2, 1) * 0.45; // opponents nearby = race risk

  const totalRisk = Math.min(attractivenessRisk + proximityRisk, 0.75);

  // Port bonus: port access is persistent — no opponent can "take" a port.
  // Even a mediocre port vertex (low dice probability) is a reliable long-term target.
  const portBonus = v.hasPort ? 0.30 : 0;

  return Math.max(0, quality * (1 - totalRisk) + portBonus);
}

// Returns true if vertexId can be used for a future settlement.
// ignoreVertex: skip the distance-rule check for this vertex (the "from" settlement).
function isValidFutureSpot(
  vertexId: string,
  board: BoardState,
  ignoreVertex?: string
): boolean {
  const v = board.vertices.get(vertexId);
  if (!v || v.hasSettlement) return false;

  const blocked = v.adjacentVertices.some(adjId => {
    if (adjId === ignoreVertex) return false;
    return board.vertices.get(adjId)?.hasSettlement;
  });
  if (blocked) return false;

  return v.adjacentHexes.some(hexId => {
    const hex = board.hexes.get(hexId);
    return hex && hex.resource !== 'desert';
  });
}

// Score all candidate roads from a single settlement.
export function getRoadSuggestionsForSettlement(
  settlementVertexId: string,
  playerColor: string,
  board: BoardState
): RoadSuggestion[] {
  const settlement = board.vertices.get(settlementVertexId);
  if (!settlement?.hasSettlement) return [];

  const settlementHexIds = new Set(settlement.adjacentHexes);
  const suggestions: RoadSuggestion[] = [];

  settlement.adjacentVertices.forEach(toVertexId => {
    const toVertex = board.vertices.get(toVertexId);
    if (!toVertex) return;

    // Expansion spots: vertices 2 hops from settlement, reachable via this road.
    // (Distance rule blocks settling 1 hop away, so valid spots start at 2 hops.)
    const expansionSpots: string[] = [];
    const adjustedValues: number[] = [];
    const rawQualities: number[] = [];

    toVertex.adjacentVertices.forEach(nextId => {
      if (nextId === settlementVertexId) return;
      if (!isValidFutureSpot(nextId, board, settlementVertexId)) return;
      expansionSpots.push(nextId);
      adjustedValues.push(riskAdjustedSpotValue(nextId, board, playerColor));
      rawQualities.push(rawVertexQuality(nextId, board));
    });

    // New hexes this road unlocks (adjacent to the road endpoint but not to the settlement).
    const newHexResources: string[] = toVertex.adjacentHexes
      .filter(hexId => !settlementHexIds.has(hexId))
      .map(hexId => board.hexes.get(hexId))
      .filter(hex => hex !== undefined && hex!.resource !== 'desert')
      .map(hex => hex!.resource);

    // Port access: only count ports reachable as EXPANSION SPOTS (you can't settle at
    // the road endpoint V, so V having a port doesn't directly help you).
    const hasPortAccess = expansionSpots.some(id => !!board.vertices.get(id)?.hasPort);

    // Derive contest risk from how much risk is discounting the best expansion spots.
    // avgRiskDiscount = 1 - adjusted/raw for each spot.
    let avgRiskDiscount = 0;
    if (expansionSpots.length > 0) {
      const discounts = adjustedValues.map((adj, i) =>
        rawQualities[i] > 0 ? 1 - adj / (rawQualities[i] * 0.85 + (board.vertices.get(expansionSpots[i])?.hasPort ? 0.3 : 0))
        : 0
      );
      avgRiskDiscount = discounts.reduce((s, d) => s + d, 0) / discounts.length;
    }

    const contestRisk: 'low' | 'medium' | 'high' =
      avgRiskDiscount > 0.45 ? 'high' :
      avgRiskDiscount > 0.20 ? 'medium' : 'low';

    // Final score: sum of risk-adjusted expansion values, normalized.
    // ~3 good spots at 0.55 each = 1.65 is a strong road.
    const adjustedSum = adjustedValues.reduce((s, v) => s + v, 0);
    const portBonus = hasPortAccess ? 0.15 : 0;
    const deadEndPenalty = expansionSpots.length === 0 ? 0.2 : 0;

    const score = Math.max(0, Math.min(1.0,
      adjustedSum / 1.65 + portBonus - deadEndPenalty
    ));

    // Best target spots sorted by adjusted (risk-aware) value.
    const targetVertices = expansionSpots
      .map((id, i) => ({ id, v: adjustedValues[i] }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 2)
      .map(x => x.id);

    suggestions.push({
      fromVertex: settlementVertexId,
      toVertex: toVertexId,
      playerColor,
      score,
      expansionSpots: expansionSpots.length,
      contestRisk,
      hasPortAccess,
      newHexResources,
      targetVertices,
    });
  });

  return suggestions.sort((a, b) => b.score - a.score);
}

// Returns the top-2 road suggestions for every placed settlement on the board.
export function getAllRoadSuggestions(board: BoardState): RoadSuggestion[] {
  const all: RoadSuggestion[] = [];

  board.vertices.forEach(vertex => {
    if (!vertex.hasSettlement || !vertex.playerColor) return;
    const suggestions = getRoadSuggestionsForSettlement(
      vertex.id,
      vertex.playerColor,
      board
    );
    suggestions.slice(0, 2).forEach(s => all.push(s));
  });

  return all;
}
