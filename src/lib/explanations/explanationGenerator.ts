// Generate human-readable explanations for recommendations

import { HexTile, Vertex, BoardState, ResourceType } from '@/types/board';
import { ScoreBreakdown } from '@/types/scoring';
import { RESOURCE_ICONS, RESOURCE_NAMES } from '@/constants/resources';
import { NUMBER_DOTS } from '@/constants/numbers';
import { DEFAULT_WEIGHTS } from '@/types/scoring';

export function generateExplanation(
  _vertexId: string,
  adjacentHexes: HexTile[],
  breakdown: ScoreBreakdown,
  mode: 'beginner' | 'advanced',
  vertex?: Vertex,
  board?: BoardState,
  playerColor?: string
): string {
  if (mode === 'beginner') {
    return generateGuideExplanation(adjacentHexes, breakdown, vertex, board, playerColor);
  } else {
    return generateScholarExplanation(adjacentHexes, breakdown, vertex, board, playerColor);
  }
}

// ── Guide Mode ──────────────────────────────────────────────────────

function generateGuideExplanation(
  adjacentHexes: HexTile[],
  breakdown: ScoreBreakdown,
  vertex?: Vertex,
  board?: BoardState,
  playerColor?: string
): string {
  const sections: string[] = [];
  const productiveHexes = adjacentHexes.filter(h => h.resource !== 'desert' && h.number !== null);

  // ── Resources at this spot ──
  const resourcesList = productiveHexes
    .map(hex => `${RESOURCE_ICONS[hex.resource]} ${RESOURCE_NAMES[hex.resource]} (${hex.number})`)
    .join(', ');
  if (resourcesList) {
    sections.push(`Produces: ${resourcesList}`);
  }

  // ── Probability / Income ──
  const totalDots = productiveHexes.reduce((s, h) => s + (NUMBER_DOTS[h.number!] || 0), 0);
  const pct = ((totalDots / 36) * 100).toFixed(0);

  const has6or8 = productiveHexes.filter(h => h.number === 6 || h.number === 8);
  if (has6or8.length >= 2) {
    sections.push(`💰 Excellent income — ${totalDots} pips, ${pct}% chance per roll. Two of the best numbers (6 & 8) are rolled 5 times each out of 36.`);
  } else if (has6or8.length === 1) {
    const n = has6or8[0].number;
    sections.push(`💰 Good income — ${totalDots} pips, ${pct}% chance per roll. The ${n} is one of the two most-rolled numbers in the game.`);
  } else if (totalDots >= 8) {
    sections.push(`💰 Decent income — ${totalDots} pips, ${pct}% chance per roll. No 6 or 8, but solid mid-range numbers add up.`);
  } else {
    sections.push(`💰 Low income — only ${totalDots} pips (${pct}% per roll). You won't collect resources here very often.`);
  }

  // ── Diversity ──
  const uniqueResources = new Set(productiveHexes.map(h => h.resource));
  if (uniqueResources.size >= 4) {
    sections.push(`🎯 Outstanding variety — ${uniqueResources.size} resource types. You can build almost anything without trading.`);
  } else if (uniqueResources.size === 3) {
    sections.push(`🎯 Good variety — 3 resource types. You'll need to trade for the other two, but you have a solid base.`);
  } else if (uniqueResources.size === 2) {
    const missing = getMissingResources(uniqueResources);
    sections.push(`🎯 Limited variety — only 2 types. You'll depend on trading for ${missing.join(', ')}.`);
  }

  // ── What you can build ──
  const buildHint = getBuildabilityHint(uniqueResources);
  if (buildHint) {
    sections.push(buildHint);
  }

  // ── Port ──
  if (vertex?.hasPort) {
    if (vertex.hasPort === '3:1') {
      sections.push(`⚓ 3:1 port — trade any 3 of one resource for 1 of anything. Better than the default 4:1 bank rate.`);
    } else {
      const res = vertex.hasPort.replace('2:1:', '');
      const resName = RESOURCE_NAMES[res as ResourceType] || res;
      const producesIt = productiveHexes.some(h => h.resource === res);
      if (producesIt) {
        sections.push(`⚓ 2:1 ${resName} port — trade just 2 ${resName.toLowerCase()} for any resource. You're producing ${resName.toLowerCase()} here, so this is a powerful combo.`);
      } else {
        sections.push(`⚓ 2:1 ${resName} port — trade 2 ${resName.toLowerCase()} for anything. You aren't producing ${resName.toLowerCase()} here though, so this is weaker until you expand.`);
      }
    }
  }

  // ── Scarcity ──
  if (breakdown.scarcityScore > 0.4 && board) {
    const scarceHere = findScarceResources(productiveHexes, board);
    if (scarceHere.length > 0) {
      const names = scarceHere.map(r => RESOURCE_NAMES[r].toLowerCase()).join(' and ');
      sections.push(`💎 Scarce resource advantage — ${names} ${scarceHere.length === 1 ? 'is' : 'are'} hard to come by on this board. Locking it down here gives you leverage in trades.`);
    }
  } else if (breakdown.scarcityScore > 0.2 && board) {
    const scarceHere = findScarceResources(productiveHexes, board);
    if (scarceHere.length > 0) {
      const names = scarceHere.map(r => RESOURCE_NAMES[r].toLowerCase()).join(' and ');
      sections.push(`💎 Includes relatively scarce ${names} — fewer hexes produce it on this board.`);
    }
  }

  // ── Expansion ──
  if (breakdown.expansionScore > 0.7) {
    sections.push(`🧭 Great expansion potential — many open settlement spots within 2 roads. You'll have room to grow.`);
  } else if (breakdown.expansionScore > 0.4) {
    sections.push(`🧭 Decent expansion options nearby for your next settlement.`);
  } else if (breakdown.expansionScore < 0.2) {
    sections.push(`🧭 Limited expansion — few good spots nearby. You may get boxed in.`);
  }

  // ── Complement (only when player has settlements) ──
  if (breakdown.complementScore > 0.5 && board && playerColor) {
    const newResources = findNewResources(productiveHexes, board, playerColor);
    if (newResources.length > 0) {
      const names = newResources.map(r => `${RESOURCE_ICONS[r]} ${RESOURCE_NAMES[r]}`).join(', ');
      sections.push(`🤝 Fills gaps in your portfolio — adds ${names} that your current settlements don't produce.`);
    }
  } else if (breakdown.complementScore > 0.2 && board && playerColor) {
    sections.push(`🤝 Adds some new numbers and resources to complement your existing production.`);
  }

  // ── Weaknesses ──
  const weaknesses = getWeaknesses(productiveHexes, uniqueResources, breakdown);
  if (weaknesses.length > 0) {
    sections.push(`⚠️ ${weaknesses.join(' ')}`);
  }

  return sections.join('\n');
}

// ── Scholar Mode ────────────────────────────────────────────────────

function generateScholarExplanation(
  adjacentHexes: HexTile[],
  breakdown: ScoreBreakdown,
  vertex?: Vertex,
  board?: BoardState,
  playerColor?: string
): string {
  const sections: string[] = [];
  const productiveHexes = adjacentHexes.filter(h => h.resource !== 'desert' && h.number !== null);

  // ── Per-hex breakdown ──
  const hexLines = productiveHexes.map(hex => {
    const dots = NUMBER_DOTS[hex.number!] || 0;
    const prob = ((dots / 36) * 100).toFixed(1);
    return `  ${RESOURCE_ICONS[hex.resource]} ${RESOURCE_NAMES[hex.resource]}  #${hex.number}  ${dots} pips  (${prob}%)`;
  });
  if (hexLines.length > 0) {
    const totalDots = productiveHexes.reduce((s, h) => s + (NUMBER_DOTS[h.number!] || 0), 0);
    sections.push(`Adjacent Hexes (${totalDots} total pips):\n${hexLines.join('\n')}`);
  }

  // ── Port ──
  if (vertex?.hasPort) {
    const portDesc = vertex.hasPort === '3:1'
      ? '3:1 generic — any 3 same resource → 1 of choice'
      : `${vertex.hasPort.replace('2:1:', '2:1 ')} — 2 of that resource → 1 of choice`;
    const producesPort = vertex.hasPort !== '3:1' &&
      productiveHexes.some(h => h.resource === vertex.hasPort!.replace('2:1:', ''));
    sections.push(`Port: ${portDesc}${producesPort ? ' (producing here!)' : ''}`);
  }

  // ── Scarcity context ──
  if (board) {
    const abundanceInfo = getAbundanceContext(productiveHexes, board);
    if (abundanceInfo) {
      sections.push(abundanceInfo);
    }
  }

  // ── Complement context ──
  if (breakdown.complementScore > 0 && board && playerColor) {
    const newRes = findNewResources(productiveHexes, board, playerColor);
    const newNums = findNewNumbers(productiveHexes, board, playerColor);
    const parts: string[] = [];
    if (newRes.length > 0) parts.push(`${newRes.length} new resource type${newRes.length > 1 ? 's' : ''} (${newRes.map(r => RESOURCE_NAMES[r]).join(', ')})`);
    if (newNums.length > 0) parts.push(`${newNums.length} new number${newNums.length > 1 ? 's' : ''} (${newNums.join(', ')})`);
    if (parts.length > 0) {
      sections.push(`Complements: ${parts.join('; ')}`);
    }
  }

  // ── Weighted score table ──
  const w = DEFAULT_WEIGHTS;
  const b = breakdown;

  const rows: { label: string; raw: number; weight: number; desc: string }[] = [
    {
      label: 'Probability',
      raw: b.probabilityScore,
      weight: w.probability,
      desc: 'Sum of (pips/36) for each adjacent hex. Higher = more resources per turn.',
    },
    {
      label: 'Diversity',
      raw: b.diversityScore,
      weight: w.diversity,
      desc: `${Math.round(b.diversityScore * 5)}/5 unique resource types. Reduces trade dependency.`,
    },
    {
      label: 'Num. Quality',
      raw: b.numberQualityScore,
      weight: w.numberQuality,
      desc: 'Rewards 6/8 (1.0), penalizes 2/12 (0.0). Sum across adjacent hexes.',
    },
    {
      label: 'Port',
      raw: b.portScore,
      weight: w.port,
      desc: b.portScore > 0.5 ? '2:1 port matching a produced resource — best case.'
        : b.portScore > 0.3 ? '3:1 generic port — better than the 4:1 bank rate.'
          : b.portScore > 0 ? 'Port present but not ideally synergized.'
            : 'No port access at this vertex.',
    },
    {
      label: 'Scarcity',
      raw: b.scarcityScore,
      weight: w.scarcity,
      desc: 'Inversely proportional to board-wide abundance of adjacent resources.',
    },
    {
      label: 'Expansion',
      raw: b.expansionScore,
      weight: w.expansion,
      desc: `Valid future settlement sites within 2 roads. Score: ${(b.expansionScore * 6).toFixed(0)}/6 available.`,
    },
  ];

  if (b.complementScore > 0) {
    rows.push({
      label: 'Complement',
      raw: b.complementScore,
      weight: w.complement,
      desc: 'Bonus for adding resources/numbers not covered by your other settlements.',
    });
  }

  sections.push(''); // blank line
  sections.push('Scoring Breakdown (raw × weight = contribution):');
  let computedTotal = 0;
  rows.forEach(r => {
    const contribution = r.raw * r.weight;
    computedTotal += contribution;
    const rawStr = r.raw.toFixed(3).padStart(6);
    const wStr = `×${r.weight.toFixed(1)}`;
    const cStr = `= ${contribution.toFixed(3)}`;
    sections.push(`  ${r.label.padEnd(13)} ${rawStr} ${wStr} ${cStr}`);
    sections.push(`    ↳ ${r.desc}`);
  });
  sections.push(`  ${'─'.repeat(38)}`);
  sections.push(`  ${'Total'.padEnd(13)} ${' '.repeat(6)}     ${computedTotal.toFixed(3)}`);

  return sections.join('\n');
}

// ── Helpers ─────────────────────────────────────────────────────────

function getMissingResources(have: Set<ResourceType>): string[] {
  const all: ResourceType[] = ['wheat', 'wood', 'brick', 'ore', 'sheep'];
  return all.filter(r => !have.has(r)).map(r => RESOURCE_NAMES[r].toLowerCase());
}

function getBuildabilityHint(resources: Set<ResourceType>): string | null {
  const has = (r: ResourceType) => resources.has(r);

  const canRoad = has('wood') && has('brick');
  const canSettle = canRoad && has('wheat') && has('sheep');
  const canCity = has('wheat') && has('ore');
  const canDevCard = has('ore') && has('wheat') && has('sheep');

  const abilities: string[] = [];
  if (canSettle) abilities.push('settlements');
  else if (canRoad) abilities.push('roads');
  if (canCity) abilities.push('cities');
  if (canDevCard) abilities.push('dev cards');

  if (abilities.length >= 3) {
    return `🔨 Can self-build ${abilities.join(', ')} — extremely self-sufficient.`;
  } else if (abilities.length > 0) {
    return `🔨 Resources here let you build ${abilities.join(' and ')} without trading.`;
  }
  return null;
}

function findScarceResources(hexes: HexTile[], board: BoardState): ResourceType[] {
  // Count total pips per resource on the board
  const abundance = new Map<ResourceType, number>();
  board.hexes.forEach(hex => {
    if (hex.resource === 'desert' || hex.number === null) return;
    abundance.set(hex.resource, (abundance.get(hex.resource) || 0) + (NUMBER_DOTS[hex.number] || 0));
  });

  let maxAbundance = 0;
  abundance.forEach(v => { if (v > maxAbundance) maxAbundance = v; });
  if (maxAbundance === 0) return [];

  const scarce: ResourceType[] = [];
  const seen = new Set<ResourceType>();
  hexes.forEach(hex => {
    if (hex.resource === 'desert' || hex.number === null) return;
    if (seen.has(hex.resource)) return;
    seen.add(hex.resource);
    const ratio = (abundance.get(hex.resource) || 0) / maxAbundance;
    if (ratio < 0.6) scarce.push(hex.resource);
  });
  return scarce;
}

function getAbundanceContext(hexes: HexTile[], board: BoardState): string | null {
  const abundance = new Map<ResourceType, number>();
  board.hexes.forEach(hex => {
    if (hex.resource === 'desert' || hex.number === null) return;
    abundance.set(hex.resource, (abundance.get(hex.resource) || 0) + (NUMBER_DOTS[hex.number] || 0));
  });

  const lines: string[] = [];
  const seen = new Set<ResourceType>();
  hexes.forEach(hex => {
    if (hex.resource === 'desert' || hex.number === null) return;
    if (seen.has(hex.resource)) return;
    seen.add(hex.resource);
    const total = abundance.get(hex.resource) || 0;
    const hexCount = Array.from(board.hexes.values()).filter(h => h.resource === hex.resource && h.number !== null).length;
    lines.push(`  ${RESOURCE_NAMES[hex.resource]}: ${total} pips across ${hexCount} hex${hexCount !== 1 ? 'es' : ''}`);
  });

  if (lines.length === 0) return null;
  return `Board-wide abundance of adjacent resources:\n${lines.join('\n')}`;
}

function findNewResources(hexes: HexTile[], board: BoardState, playerColor: string): ResourceType[] {
  const covered = new Set<ResourceType>();
  board.vertices.forEach(v => {
    if (!v.hasSettlement || v.playerColor !== playerColor) return;
    v.adjacentHexes.forEach(hexId => {
      const hex = board.hexes.get(hexId);
      if (hex && hex.resource !== 'desert') covered.add(hex.resource);
    });
  });

  const newRes: ResourceType[] = [];
  const seen = new Set<ResourceType>();
  hexes.forEach(hex => {
    if (hex.resource === 'desert' || seen.has(hex.resource)) return;
    seen.add(hex.resource);
    if (!covered.has(hex.resource)) newRes.push(hex.resource);
  });
  return newRes;
}

function findNewNumbers(hexes: HexTile[], board: BoardState, playerColor: string): number[] {
  const covered = new Set<number>();
  board.vertices.forEach(v => {
    if (!v.hasSettlement || v.playerColor !== playerColor) return;
    v.adjacentHexes.forEach(hexId => {
      const hex = board.hexes.get(hexId);
      if (hex && hex.number) covered.add(hex.number);
    });
  });

  const newNums: number[] = [];
  const seen = new Set<number>();
  hexes.forEach(hex => {
    if (!hex.number || seen.has(hex.number)) return;
    seen.add(hex.number);
    if (!covered.has(hex.number)) newNums.push(hex.number);
  });
  return newNums.sort((a, b) => a - b);
}

function getWeaknesses(
  hexes: HexTile[],
  uniqueResources: Set<ResourceType>,
  breakdown: ScoreBreakdown
): string[] {
  const issues: string[] = [];

  // Only 1 resource type
  if (uniqueResources.size <= 1 && hexes.length > 0) {
    issues.push('Only 1 resource type — you\'ll be heavily reliant on trading.');
  }

  // All low numbers
  const allLow = hexes.length > 0 && hexes.every(h => {
    if (!h.number) return true;
    return h.number <= 4 || h.number >= 10;
  });
  if (allLow && hexes.length > 1) {
    issues.push('All low-probability numbers — expect slow production.');
  }

  // Boxed in
  if (breakdown.expansionScore < 0.15 && hexes.length > 0) {
    issues.push('Very few expansion routes — may get boxed in by opponents.');
  }

  return issues;
}
