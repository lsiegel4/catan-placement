// Generate human-readable explanations for recommendations

import { HexTile } from '@/types/board';
import { ScoreBreakdown } from '@/types/scoring';
import { RESOURCE_ICONS, RESOURCE_NAMES } from '@/constants/resources';
import { NUMBER_DOTS } from '@/constants/numbers';

export function generateExplanation(
  _vertexId: string,
  adjacentHexes: HexTile[],
  breakdown: ScoreBreakdown,
  mode: 'beginner' | 'advanced'
): string {
  if (mode === 'beginner') {
    return generateBeginnerExplanation(adjacentHexes, breakdown);
  } else {
    return generateAdvancedExplanation(adjacentHexes, breakdown);
  }
}

function generateBeginnerExplanation(
  adjacentHexes: HexTile[],
  breakdown: ScoreBreakdown
): string {
  const reasons: string[] = [];

  // List adjacent resources
  const resourcesList = adjacentHexes
    .filter(hex => hex.resource !== 'desert')
    .map(hex => {
      const icon = RESOURCE_ICONS[hex.resource];
      const name = RESOURCE_NAMES[hex.resource];
      const number = hex.number || '';
      return `${icon} ${name} (${number})`;
    })
    .join(', ');

  if (resourcesList) {
    reasons.push(`Adjacent to: ${resourcesList}`);
  }

  // High probability numbers
  const goodNumbers = adjacentHexes.filter(
    hex => hex.number && (hex.number === 6 || hex.number === 8)
  );
  if (goodNumbers.length > 0) {
    reasons.push('✓ Excellent probability numbers (6 or 8)');
  } else if (breakdown.probabilityScore > 0.2) {
    reasons.push('✓ Good resource production frequency');
  }

  // Resource diversity
  const uniqueResources = new Set(
    adjacentHexes
      .filter(hex => hex.resource !== 'desert')
      .map(hex => hex.resource)
  );
  if (uniqueResources.size >= 3) {
    reasons.push(`✓ Access to ${uniqueResources.size} different resources`);
  }

  return reasons.join('\n');
}

function generateAdvancedExplanation(
  adjacentHexes: HexTile[],
  breakdown: ScoreBreakdown
): string {
  const sections: string[] = [];

  // Resource Production
  const totalDots = adjacentHexes.reduce((sum, hex) => {
    if (hex.resource === 'desert' || !hex.number) return sum;
    return sum + (NUMBER_DOTS[hex.number] || 0);
  }, 0);

  sections.push(`Expected Production: ${totalDots} dots (${(totalDots / 36 * 100).toFixed(1)}% per roll)`);

  // Adjacent Resources with Numbers
  const resourceDetails = adjacentHexes
    .filter(hex => hex.resource !== 'desert')
    .map(hex => {
      const icon = RESOURCE_ICONS[hex.resource];
      const name = RESOURCE_NAMES[hex.resource];
      const number = hex.number || '?';
      const dots = hex.number ? NUMBER_DOTS[hex.number] : 0;
      return `  ${icon} ${name}: ${number} (${dots} dots)`;
    })
    .join('\n');

  if (resourceDetails) {
    sections.push(`\nAdjacent Hexes:\n${resourceDetails}`);
  }

  // Score Breakdown
  sections.push(`\nScore Breakdown:`);
  sections.push(`  Probability: ${breakdown.probabilityScore.toFixed(3)}`);
  sections.push(`  Diversity: ${breakdown.diversityScore.toFixed(3)}`);
  sections.push(`  Number Quality: ${breakdown.numberQualityScore.toFixed(3)}`);

  return sections.join('\n');
}
