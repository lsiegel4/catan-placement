// Type definitions for scoring system

export interface ScoreBreakdown {
  probabilityScore: number;    // Expected resource production
  diversityScore: number;       // Resource variety bonus
  numberQualityScore: number;   // Bias toward 6/8 clusters
  portScore: number;            // Port access value
  expansionScore: number;       // Available adjacent vertices
  scarcityScore: number;        // Rare resource bonus
}

export interface VertexScore {
  vertexId: string;
  totalScore: number;
  breakdown: ScoreBreakdown;
  explanation: string;
}

export interface ScoreWeights {
  probability: number;      // Base expected value
  diversity: number;        // Encourage balanced resources
  numberQuality: number;    // Prefer 6/8 clusters
  port: number;             // Port access
  expansion: number;        // Future placement options
  scarcity: number;         // Rare resource bonus
}

export const DEFAULT_WEIGHTS: ScoreWeights = {
  probability: 1.0,
  diversity: 0.8,
  numberQuality: 0.6,
  port: 0.5,
  expansion: 0.4,
  scarcity: 0.3,
};
