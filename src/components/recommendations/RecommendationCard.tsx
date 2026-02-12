import { VertexScore, ScoreBreakdown } from '@/types/scoring';
import { DEFAULT_WEIGHTS } from '@/types/scoring';

interface RecommendationCardProps {
  recommendation: VertexScore;
  rank: number;
  isSelected: boolean;
  isFocused: boolean;
  onClick: () => void;
  explanationMode: 'beginner' | 'advanced';
}

// Rank styling - decreasing prominence
const RANK_STYLES = [
  { bg: 'var(--gold-muted)', border: 'var(--sepia-dark)', glow: true },      // 1st - gold
  { bg: 'var(--parchment)', border: 'var(--sepia)', glow: false },           // 2nd - silver/parchment
  { bg: 'var(--copper-light)', border: 'var(--sepia-dark)', glow: false },   // 3rd - bronze/copper
  { bg: 'var(--parchment-dark)', border: 'var(--sepia)', glow: false },      // 4th
  { bg: 'var(--parchment-dark)', border: 'var(--sepia)', glow: false },      // 5th
];

// Map score keys to display info
const SCORE_META: {
  key: keyof typeof DEFAULT_WEIGHTS;
  breakdownKey: keyof ScoreBreakdown;
  label: string;
  color: string;
}[] = [
  { key: 'probability', breakdownKey: 'probabilityScore', label: 'Yield', color: '#c9a227' },
  { key: 'diversity', breakdownKey: 'diversityScore', label: 'Variety', color: '#6b8e23' },
  { key: 'numberQuality', breakdownKey: 'numberQualityScore', label: 'Fortune', color: '#b8860b' },
  { key: 'port', breakdownKey: 'portScore', label: 'Port', color: '#4a90a4' },
  { key: 'scarcity', breakdownKey: 'scarcityScore', label: 'Scarcity', color: '#9b59b6' },
  { key: 'expansion', breakdownKey: 'expansionScore', label: 'Growth', color: '#27ae60' },
  { key: 'complement', breakdownKey: 'complementScore', label: 'Synergy', color: '#b87333' },
];

export function RecommendationCard({
  recommendation,
  rank,
  isSelected,
  isFocused,
  onClick,
  explanationMode,
}: RecommendationCardProps) {
  const { totalScore, explanation, breakdown } = recommendation;
  const rankStyle = RANK_STYLES[rank - 1] || RANK_STYLES[4];

  // Calculate a quality rating (1-5 stars, shown as compass points)
  const quality = Math.min(5, Math.max(1, Math.round((totalScore / 3) * 5)));

  // Compute weighted contributions for the bar chart
  const contributions = SCORE_META
    .map(meta => ({
      ...meta,
      raw: breakdown[meta.breakdownKey] || 0,
      weight: DEFAULT_WEIGHTS[meta.key],
      contribution: (breakdown[meta.breakdownKey] || 0) * DEFAULT_WEIGHTS[meta.key],
    }))
    .filter(c => c.contribution > 0.001);

  return (
    <div
      onClick={onClick}
      className={`relative p-4 rounded-sm cursor-pointer transition-all duration-300 ${
        isSelected ? 'ring-2 ring-amber-600' : isFocused ? '' : 'hover:translate-x-1'
      }`}
      style={{
        background: isSelected
          ? 'linear-gradient(135deg, var(--parchment-light) 0%, var(--parchment) 100%)'
          : 'var(--parchment)',
        border: `1.5px solid ${isSelected ? 'var(--copper)' : isFocused ? 'var(--sepia-dark)' : 'var(--sepia)'}`,
        boxShadow: isSelected
          ? 'inset 0 0 20px rgba(184, 115, 51, 0.1), 2px 2px 8px rgba(0,0,0,0.1)'
          : isFocused
          ? 'inset 0 0 12px rgba(92, 74, 55, 0.08), 0 0 0 2px var(--sepia-dark)'
          : '1px 1px 3px rgba(0,0,0,0.08)',
        outline: isFocused ? '1px dashed var(--sepia)' : 'none',
        outlineOffset: '2px',
      }}
    >
      {/* Rank badge */}
      <div
        className="absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center"
        style={{
          background: rankStyle.bg,
          border: `2px solid ${rankStyle.border}`,
          boxShadow: rankStyle.glow ? '0 0 8px rgba(201, 162, 39, 0.4)' : '1px 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        <span
          className="text-sm font-bold"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--ink)' }}
        >
          {rank}
        </span>
      </div>

      {/* Header with score */}
      <div className="flex items-start justify-between mb-2 ml-5">
        <div>
          {/* Quality indicator - compass stars */}
          <div className="flex items-center gap-0.5 mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                className="w-3 h-3"
                viewBox="0 0 24 24"
                fill={i < quality ? 'var(--gold-muted)' : 'none'}
                stroke={i < quality ? 'var(--sepia-dark)' : 'var(--sepia)'}
                strokeWidth="1.5"
                opacity={i < quality ? 1 : 0.3}
              >
                <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
              </svg>
            ))}
          </div>
        </div>

        {/* Score display */}
        <div className="text-right">
          <span
            className="text-lg font-semibold"
            style={{ fontFamily: 'Cinzel, serif', color: 'var(--ink)' }}
          >
            {totalScore.toFixed(2)}
          </span>
          <span
            className="text-xs block"
            style={{ color: 'var(--ink-faded)' }}
          >
            prosperity
          </span>
        </div>
      </div>

      {/* Explanation */}
      <div
        className="text-sm whitespace-pre-line leading-relaxed"
        style={{ color: 'var(--ink-faded)' }}
      >
        {explanation}
      </div>

      {/* Score contribution bar chart (both modes, but compact in guide) */}
      {explanationMode === 'advanced' ? (
        /* Scholar: detailed contribution bars with labels */
        <div className="mt-3 pt-3" style={{ borderTop: '1px dashed var(--sepia)' }}>
          <div className="text-xs mb-2" style={{ color: 'var(--ink-faded)', fontFamily: 'Cinzel, serif' }}>
            Score Contributions
          </div>
          <div className="space-y-1.5">
            {contributions
              .sort((a, b) => b.contribution - a.contribution)
              .map(c => {
                const barWidth = Math.max(4, (c.contribution / totalScore) * 100);
                return (
                  <div key={c.key} className="flex items-center gap-2 text-xs">
                    <span className="w-16 text-right shrink-0" style={{ color: 'var(--ink-faded)' }}>
                      {c.label}
                    </span>
                    <div
                      className="flex-1 rounded-full overflow-hidden"
                      style={{ height: 8, background: 'var(--parchment-dark)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${barWidth}%`, background: c.color, opacity: 0.8 }}
                      />
                    </div>
                    <span
                      className="w-10 text-right shrink-0 tabular-nums"
                      style={{ color: 'var(--ink)', fontFamily: 'Cinzel, serif' }}
                    >
                      {c.contribution.toFixed(2)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        /* Guide: simple stacked bar showing composition at a glance */
        <div className="mt-3 pt-2" style={{ borderTop: '1px dashed var(--sepia)' }}>
          <div className="flex rounded-full overflow-hidden" style={{ height: 6 }}>
            {contributions
              .sort((a, b) => b.contribution - a.contribution)
              .map(c => (
                <div
                  key={c.key}
                  title={`${c.label}: ${((c.contribution / totalScore) * 100).toFixed(0)}%`}
                  style={{
                    width: `${(c.contribution / totalScore) * 100}%`,
                    background: c.color,
                    opacity: 0.7,
                  }}
                />
              ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs" style={{ color: 'var(--ink-faded)' }}>
            {contributions
              .sort((a, b) => b.contribution - a.contribution)
              .slice(0, 4) // top 4 only in guide
              .map(c => (
                <span key={c.key} className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: c.color, opacity: 0.7 }} />
                  {c.label}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Status indicator */}
      {isSelected ? (
        <div
          className="absolute bottom-1 right-1 text-xs italic"
          style={{ color: 'var(--copper)' }}
        >
          ◆ viewing
        </div>
      ) : isFocused ? (
        <div
          className="absolute bottom-1 right-1 text-xs"
          style={{ color: 'var(--sepia)', fontFamily: 'Cinzel, serif', opacity: 0.7 }}
        >
          ↵ select
        </div>
      ) : null}
    </div>
  );
}
