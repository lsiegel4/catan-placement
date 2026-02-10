import { VertexScore } from '@/types/scoring';

interface RecommendationCardProps {
  recommendation: VertexScore;
  rank: number;
  isSelected: boolean;
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

export function RecommendationCard({
  recommendation,
  rank,
  isSelected,
  onClick,
  explanationMode,
}: RecommendationCardProps) {
  const { totalScore, explanation, breakdown } = recommendation;
  const rankStyle = RANK_STYLES[rank - 1] || RANK_STYLES[4];

  // Calculate a quality rating (1-5 stars, shown as compass points)
  const quality = Math.min(5, Math.max(1, Math.round((totalScore / 3) * 5)));

  return (
    <div
      onClick={onClick}
      className={`relative p-4 rounded-sm cursor-pointer transition-all duration-300 ${
        isSelected ? 'ring-2 ring-amber-600' : 'hover:translate-x-1'
      }`}
      style={{
        background: isSelected
          ? 'linear-gradient(135deg, var(--parchment-light) 0%, var(--parchment) 100%)'
          : 'var(--parchment)',
        border: `1.5px solid ${isSelected ? 'var(--copper)' : 'var(--sepia)'}`,
        boxShadow: isSelected
          ? 'inset 0 0 20px rgba(184, 115, 51, 0.1), 2px 2px 8px rgba(0,0,0,0.1)'
          : '1px 1px 3px rgba(0,0,0,0.08)',
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

      {/* Advanced Mode: Score Breakdown */}
      {explanationMode === 'advanced' && (
        <div
          className="mt-3 pt-3 grid grid-cols-3 gap-2 text-xs"
          style={{ borderTop: '1px dashed var(--sepia)' }}
        >
          <div className="text-center">
            <div
              className="font-medium"
              style={{ color: 'var(--ink)', fontFamily: 'Cinzel, serif' }}
            >
              {(breakdown.probabilityScore * 100).toFixed(0)}%
            </div>
            <div style={{ color: 'var(--ink-faded)' }}>Yield</div>
          </div>
          <div className="text-center">
            <div
              className="font-medium"
              style={{ color: 'var(--ink)', fontFamily: 'Cinzel, serif' }}
            >
              {(breakdown.diversityScore * 100).toFixed(0)}%
            </div>
            <div style={{ color: 'var(--ink-faded)' }}>Variety</div>
          </div>
          <div className="text-center">
            <div
              className="font-medium"
              style={{ color: 'var(--ink)', fontFamily: 'Cinzel, serif' }}
            >
              {(breakdown.numberQualityScore / 3 * 100).toFixed(0)}%
            </div>
            <div style={{ color: 'var(--ink-faded)' }}>Fortune</div>
          </div>
        </div>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div
          className="absolute bottom-1 right-1 text-xs italic"
          style={{ color: 'var(--copper)' }}
        >
          ◆ viewing
        </div>
      )}
    </div>
  );
}
