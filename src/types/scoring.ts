// Type definitions for scoring system

export interface ScoreBreakdown {
  probabilityScore: number;    // Expected resource production
  diversityScore: number;       // Resource variety bonus
  numberQualityScore: number;   // Bias toward 6/8 clusters
  portScore: number;            // Port access value
  expansionScore: number;       // Available adjacent vertices
  scarcityScore: number;        // Rare resource bonus
  complementScore: number;      // Bonus for complementing existing settlements
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
  complement: number;       // Complement existing settlements
}

export const DEFAULT_WEIGHTS: ScoreWeights = {
  probability: 1.0,
  diversity: 0.8,
  numberQuality: 0.6,
  port: 0.5,
  expansion: 0.4,
  scarcity: 0.3,
  complement: 0.7,
};

export interface RoadSuggestion {
  fromVertex: string;           // settlement vertex ID
  toVertex: string;             // road endpoint vertex ID (1 hop from settlement)
  playerColor: string;          // player color ID
  score: number;                // 0–1 quality score
  expansionSpots: number;       // count of valid settlement spots reachable beyond this road
  contestRisk: 'low' | 'medium' | 'high';
  hasPortAccess: boolean;
  newHexResources: string[];    // resources of new hexes accessible via this road
  targetVertices: string[];     // top reachable settlement spot vertex IDs
}

export interface ScorePreset {
  label: string;
  description: string;
  weights: ScoreWeights;
}

export const SCORE_PRESETS: Record<string, ScorePreset> = {
  balanced: {
    label: 'Balanced',
    description: 'All-round strategy',
    weights: { ...DEFAULT_WEIGHTS },
  },
  cityBuilder: {
    label: 'City Builder',
    description: 'Ore & wheat for cities',
    weights: {
      probability: 1.0,
      diversity: 0.5,
      numberQuality: 1.0,
      port: 0.3,
      expansion: 0.2,
      scarcity: 0.8,
      complement: 0.9,
    },
  },
  roadRush: {
    label: 'Road Rush',
    description: 'Wood & brick for roads',
    weights: {
      probability: 0.8,
      diversity: 1.0,
      numberQuality: 0.4,
      port: 0.3,
      expansion: 1.0,
      scarcity: 0.3,
      complement: 0.6,
    },
  },
  portTrader: {
    label: 'Port Trader',
    description: 'Maximise port access',
    weights: {
      probability: 1.0,
      diversity: 0.6,
      numberQuality: 0.5,
      port: 1.2,
      expansion: 0.4,
      scarcity: 0.4,
      complement: 0.5,
    },
  },
};
