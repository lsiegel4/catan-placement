// Board quality rating algorithm
// Scores a board on three axes and produces a letter grade.

import { BoardState } from '@/types/board';
import { NUMBER_DOTS } from '@/constants/numbers';
import { getHexNeighbors, createHexId } from '@/lib/geometry/hexCoordinates';

export interface BoardRatingBreakdown {
  numberSpread: number;      // 0–100, higher = strong hexes (5/6/8/9) not adjacent
  resourceSpread: number;    // 0–100, higher = same resources not adjacent
  resourceDiversity: number; // 0–100, higher = vertex neighborhoods have varied resources
}

export interface BoardRating {
  score: number;                           // 0–100 composite
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  label: string;
  breakdown: BoardRatingBreakdown;
}

// ─── Metric 1: Strong-Number Spread ──────────────────────────────────────────
// Count adjacent hex pairs where both have ≥4 pips (numbers 5, 6, 8, 9).
// The 6/8 generation rule already prevents 6-6, 6-8, 8-8 adjacency.
// Remaining violations (5-9, 5-6, 5-8, 6-9, 8-9, 5-5, 9-9) are penalised.
// Empirically: good boards 0-2, typical 3-6, bad 7+
function rateNumberSpread(board: BoardState): number {
  const hexes = Array.from(board.hexes.values());
  let violations = 0;

  hexes.forEach(hex => {
    if (hex.resource === 'desert' || hex.number === null) return;
    const pipsA = NUMBER_DOTS[hex.number] ?? 0;
    if (pipsA < 4) return; // only track strong hexes (5/6/8/9)

    getHexNeighbors({ q: hex.q, r: hex.r }).forEach(n => {
      const neighbor = board.hexes.get(createHexId(n.q, n.r));
      if (!neighbor || neighbor.resource === 'desert' || neighbor.number === null) return;
      const pipsB = NUMBER_DOTS[neighbor.number] ?? 0;
      if (pipsB >= 4 && neighbor.id > hex.id) {
        violations++;
      }
    });
  });

  // 0 violations → 100, ~8 violations → 4 (floor at 0)
  return Math.max(0, 100 - violations * 12);
}

// ─── Metric 2: Resource Spread ────────────────────────────────────────────────
// Count adjacent same-resource hex pairs (excluding desert).
// Empirically: good boards 0-1, typical 2-4, bad 5+
function rateResourceSpread(board: BoardState): number {
  const hexes = Array.from(board.hexes.values());
  let violations = 0;

  hexes.forEach(hex => {
    if (hex.resource === 'desert') return;
    getHexNeighbors({ q: hex.q, r: hex.r }).forEach(n => {
      const neighbor = board.hexes.get(createHexId(n.q, n.r));
      if (!neighbor || neighbor.resource === 'desert') return;
      if (neighbor.resource === hex.resource && neighbor.id > hex.id) {
        violations++;
      }
    });
  });

  // 0 violations → 100, 6+ violations → 10 (floor at 0)
  return Math.max(0, 100 - violations * 15);
}

// ─── Metric 3: Resource Diversity at Vertices ─────────────────────────────────
// For each vertex touching ≥2 non-desert hexes, count distinct resource types.
// Average across all qualifying vertices and scale to 0–100.
// avg diversity 1.0 (all same) → 0,  2.5+ (richly varied) → 100
function rateResourceDiversity(board: BoardState): number {
  let totalDiversity = 0;
  let count = 0;

  board.vertices.forEach(vertex => {
    const nonDesertHexes = vertex.adjacentHexes
      .map(id => board.hexes.get(id))
      .filter(h => h !== undefined && h.resource !== 'desert');

    if (nonDesertHexes.length < 2) return;

    const uniqueResources = new Set(nonDesertHexes.map(h => h!.resource)).size;
    totalDiversity += uniqueResources;
    count++;
  });

  if (count === 0) return 50;
  const avg = totalDiversity / count;

  // avg 1.0 → 0, avg 2.5 → 100 (linear, capped)
  return Math.max(0, Math.min(100, Math.round(((avg - 1.0) / 1.5) * 100)));
}

// ─── Composite Score & Grade ──────────────────────────────────────────────────
function scoreToGrade(score: number): BoardRating['grade'] {
  if (score >= 85) return 'S';
  if (score >= 70) return 'A';
  if (score >= 55) return 'B';
  if (score >= 40) return 'C';
  if (score >= 25) return 'D';
  return 'F';
}

const GRADE_LABELS: Record<BoardRating['grade'], string> = {
  S: 'Exceptional',
  A: 'Well Balanced',
  B: 'Good',
  C: 'Average',
  D: 'Uneven',
  F: 'Chaotic',
};

export function rateBoard(board: BoardState): BoardRating {
  const numberSpread = rateNumberSpread(board);
  const resourceSpread = rateResourceSpread(board);
  const resourceDiversity = rateResourceDiversity(board);

  const score = Math.round(
    numberSpread      * 0.40 +
    resourceSpread    * 0.35 +
    resourceDiversity * 0.25
  );

  const grade = scoreToGrade(score);

  return {
    score,
    grade,
    label: GRADE_LABELS[grade],
    breakdown: { numberSpread, resourceSpread, resourceDiversity },
  };
}
