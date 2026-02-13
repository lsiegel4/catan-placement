import React from 'react';
import { RoadSuggestion } from '@/types/scoring';
import { PLAYER_COLORS } from '@/constants/players';

interface RoadSuggestionsSectionProps {
  suggestions: RoadSuggestion[];
  focusedKey: string | null;
  onFocus: (key: string | null) => void;
}

const RESOURCE_LABELS: Record<string, string> = {
  wheat: 'Grain',
  wood: 'Lumber',
  brick: 'Brick',
  ore: 'Ore',
  sheep: 'Wool',
};

const RISK_STYLES: Record<string, { label: string; color: string }> = {
  low:    { label: 'Safe',     color: '#27ae60' },
  medium: { label: 'Contested', color: '#e67e22' },
  high:   { label: 'Risky',   color: '#e74c3c' },
};

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = score > 0.6 ? '#27ae60' : score > 0.35 ? '#e67e22' : '#e74c3c';
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="h-1.5 rounded-full flex-1"
        style={{ background: 'var(--parchment-dark)', border: '1px solid var(--sepia)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[10px] w-7 text-right" style={{ color: 'var(--ink-faded)' }}>
        {pct}%
      </span>
    </div>
  );
}

function describeRoad(suggestion: RoadSuggestion): string {
  const parts: string[] = [];

  if (suggestion.hasPortAccess) {
    parts.push('leads to port access');
  }

  const unique = suggestion.newHexResources
    .filter((r, i, arr) => arr.indexOf(r) === i)
    .map(r => RESOURCE_LABELS[r] ?? r);
  if (unique.length > 0) {
    parts.push(`opens ${unique.join(', ')}`);
  }

  const n = suggestion.expansionSpots;
  if (n === 0) {
    parts.push('dead end — no future spots');
  } else {
    parts.push(`${n} viable spot${n !== 1 ? 's' : ''} ahead`);
  }

  return parts.join(' · ');
}

function RoadCard({
  suggestion,
  isFocused,
  isTop,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  suggestion: RoadSuggestion;
  isFocused: boolean;
  isTop: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}) {
  const risk = RISK_STYLES[suggestion.contestRisk];

  return (
    <button
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className="w-full text-left rounded transition-all duration-150"
      style={{
        padding: isTop ? '10px 12px' : '7px 10px',
        background: isFocused
          ? 'var(--parchment-dark)'
          : isTop
          ? 'linear-gradient(135deg, var(--parchment-light) 0%, var(--parchment) 100%)'
          : 'var(--parchment-light)',
        border: isTop
          ? `1.5px solid ${isFocused ? 'var(--sepia-dark)' : 'var(--sepia)'}`
          : `1px solid ${isFocused ? 'var(--sepia)' : 'var(--sepia)'}`,
        boxShadow: isTop && !isFocused ? '0 1px 3px rgba(0,0,0,0.08)' :
                   isFocused ? 'inset 0 1px 3px rgba(0,0,0,0.15)' : undefined,
        opacity: isTop ? 1 : 0.85,
      }}
    >
      {/* Row 1: rank indicator + risk badge */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          {isTop ? (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide"
              style={{ background: '#f1c40f', color: '#1a1a1a', fontFamily: 'Cinzel, serif' }}
            >
              ★ BEST
            </span>
          ) : (
            <span className="text-[10px]" style={{ color: 'var(--ink-faded)' }}>
              Alt.
            </span>
          )}
        </div>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
          style={{ background: `${risk.color}22`, color: risk.color, border: `1px solid ${risk.color}55` }}
        >
          {risk.label}
        </span>
      </div>

      {/* Row 2: description */}
      <p className="text-[11px] mb-1.5" style={{ color: 'var(--ink-faded)' }}>
        {describeRoad(suggestion)}
      </p>

      {/* Score bar */}
      <ScoreBar score={suggestion.score} />
    </button>
  );
}

// Group suggestions by player color, then by settlement vertex.
function groupSuggestions(suggestions: RoadSuggestion[]) {
  const byPlayer: Map<string, Map<string, RoadSuggestion[]>> = new Map();

  PLAYER_COLORS.forEach(pc => {
    const forPlayer = suggestions.filter(s => s.playerColor === pc.id);
    if (forPlayer.length === 0) return;

    const bySettlement = new Map<string, RoadSuggestion[]>();
    forPlayer.forEach(s => {
      if (!bySettlement.has(s.fromVertex)) bySettlement.set(s.fromVertex, []);
      bySettlement.get(s.fromVertex)!.push(s);
    });
    byPlayer.set(pc.id, bySettlement);
  });

  return byPlayer;
}

export function RoadSuggestionsSection({
  suggestions,
  focusedKey,
  onFocus,
}: RoadSuggestionsSectionProps) {
  const grouped = React.useMemo(() => groupSuggestions(suggestions), [suggestions]);

  if (grouped.size === 0) {
    return (
      <div className="py-6 text-center" style={{ color: 'var(--ink-faded)' }}>
        <p className="italic text-sm">No settlements placed yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {PLAYER_COLORS.map(pc => {
        const settlements = grouped.get(pc.id);
        if (!settlements) return null;

        return (
          <div key={pc.id}>
            {/* Player header */}
            <div
              className="flex items-center gap-2 mb-2 px-1"
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: pc.color, border: '1.5px solid rgba(0,0,0,0.2)' }}
              />
              <span
                className="text-xs font-semibold tracking-wider uppercase"
                style={{ fontFamily: 'Cinzel, serif', color: 'var(--ink)' }}
              >
                {pc.label}
              </span>
              <div
                className="flex-1 h-px"
                style={{ background: 'var(--sepia)', opacity: 0.4 }}
              />
            </div>

            {/* Settlements */}
            <div className="space-y-3 pl-1">
              {Array.from(settlements.entries()).map(([fromVertex, roads], si) => (
                <div key={fromVertex}>
                  <p
                    className="text-[10px] mb-1.5 italic"
                    style={{ color: 'var(--ink-faded)' }}
                  >
                    Settlement {si + 1}
                  </p>
                  <div className="space-y-1.5">
                    {roads.map((road, ri) => {
                      const key = `${road.fromVertex}|${road.toVertex}`;
                      return (
                        <RoadCard
                          key={key}
                          suggestion={road}
                          isFocused={focusedKey === key}
                          isTop={ri === 0}
                          onMouseEnter={() => onFocus(key)}
                          onMouseLeave={() => onFocus(null)}
                          onClick={() => onFocus(focusedKey === key ? null : key)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
