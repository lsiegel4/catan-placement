// Main scoring algorithm for settlement placement recommendations

import { BoardState } from '@/types/board';
import { VertexScore, ScoreWeights, DEFAULT_WEIGHTS } from '@/types/scoring';
import { calculateProbabilityScore } from './probabilityScore';
import { calculateDiversityScore } from './diversityScore';
import { calculateNumberQualityScore } from './numberQualityScore';
import { calculatePortScore } from './portScore';
import { calculateScarcityScore } from './scarcityScore';
import { calculateExpansionScore } from './expansionScore';
import { calculateComplementScore } from './complementScore';
import { generateExplanation } from '@/lib/explanations/explanationGenerator';
import { isValidPlacement } from '@/lib/game/placementRules';

// Calculate score for a single vertex
export function calculateVertexScore(
  vertexId: string,
  board: BoardState,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
  explanationMode: 'beginner' | 'advanced' = 'beginner',
  playerColor: string = 'red'
): VertexScore | null {
  const vertex = board.vertices.get(vertexId);
  if (!vertex || !isValidPlacement(vertexId, board)) {
    return null;
  }

  // Get adjacent hexes
  const adjacentHexes = vertex.adjacentHexes
    .map(hexId => board.hexes.get(hexId))
    .filter(hex => hex !== undefined);

  // Calculate individual score components
  const probabilityScore = calculateProbabilityScore(adjacentHexes);
  const diversityScore = calculateDiversityScore(adjacentHexes);
  const numberQualityScore = calculateNumberQualityScore(adjacentHexes);
  const portScore = calculatePortScore(vertex, adjacentHexes);
  const scarcityScore = calculateScarcityScore(adjacentHexes, board);
  const expansionScore = calculateExpansionScore(vertexId, board);
  const complementScore = calculateComplementScore(adjacentHexes, board, playerColor);

  // Calculate weighted total score
  const totalScore =
    probabilityScore * weights.probability +
    diversityScore * weights.diversity +
    numberQualityScore * weights.numberQuality +
    portScore * weights.port +
    expansionScore * weights.expansion +
    scarcityScore * weights.scarcity +
    complementScore * weights.complement;

  const breakdown = {
    probabilityScore,
    diversityScore,
    numberQualityScore,
    portScore,
    expansionScore,
    scarcityScore,
    complementScore,
  };

  const explanation = generateExplanation(
    vertexId,
    adjacentHexes,
    breakdown,
    explanationMode,
    vertex,
    board,
    playerColor
  );

  return {
    vertexId,
    totalScore,
    breakdown,
    explanation,
  };
}

// Calculate scores for all valid vertices and return top N
export function getTopRecommendations(
  board: BoardState,
  count: number = 5,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
  explanationMode: 'beginner' | 'advanced' = 'beginner',
  playerColor: string = 'red'
): VertexScore[] {
  const scores: VertexScore[] = [];

  board.vertices.forEach((_vertex, vertexId) => {
    const score = calculateVertexScore(vertexId, board, weights, explanationMode, playerColor);
    if (score) {
      scores.push(score);
    }
  });

  // Sort by total score descending
  scores.sort((a, b) => b.totalScore - a.totalScore);

  return scores.slice(0, count);
}
