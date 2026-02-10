// Main scoring algorithm for settlement placement recommendations

import { BoardState } from '@/types/board';
import { VertexScore, ScoreWeights, DEFAULT_WEIGHTS } from '@/types/scoring';
import { calculateProbabilityScore } from './probabilityScore';
import { calculateDiversityScore } from './diversityScore';
import { calculateNumberQualityScore } from './numberQualityScore';
import { generateExplanation } from '@/lib/explanations/explanationGenerator';
import { isValidPlacement } from '@/lib/game/placementRules';

// Calculate score for a single vertex
export function calculateVertexScore(
  vertexId: string,
  board: BoardState,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
  explanationMode: 'beginner' | 'advanced' = 'beginner'
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

  // For MVP, port, expansion, and scarcity scores are 0
  const portScore = 0;
  const expansionScore = 0;
  const scarcityScore = 0;

  // Calculate weighted total score
  const totalScore =
    probabilityScore * weights.probability +
    diversityScore * weights.diversity +
    numberQualityScore * weights.numberQuality +
    portScore * weights.port +
    expansionScore * weights.expansion +
    scarcityScore * weights.scarcity;

  const breakdown = {
    probabilityScore,
    diversityScore,
    numberQualityScore,
    portScore,
    expansionScore,
    scarcityScore,
  };

  const explanation = generateExplanation(
    vertexId,
    adjacentHexes,
    breakdown,
    explanationMode
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
  explanationMode: 'beginner' | 'advanced' = 'beginner'
): VertexScore[] {
  const scores: VertexScore[] = [];

  board.vertices.forEach((_vertex, vertexId) => {
    const score = calculateVertexScore(vertexId, board, weights, explanationMode);
    if (score) {
      scores.push(score);
    }
  });

  // Sort by total score descending
  scores.sort((a, b) => b.totalScore - a.totalScore);

  return scores.slice(0, count);
}
