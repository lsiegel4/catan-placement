import { BoardRating } from '@/lib/board/boardRating';

interface BoardRatingBadgeProps {
  rating: BoardRating;
}

const GRADE_COLORS: Record<BoardRating['grade'], { bg: string; border: string; text: string }> = {
  S: { bg: '#1a4a2e', border: '#2d6b4f', text: '#a8e6c0' },
  A: { bg: '#2d4a1e', border: '#4a7a30', text: '#b8d896' },
  B: { bg: '#3a4a1a', border: '#6b7a2a', text: '#d4e090' },
  C: { bg: '#4a3a1a', border: '#8b6a2a', text: '#d4b870' },
  D: { bg: '#4a2a1a', border: '#8b4a2a', text: '#d49870' },
  F: { bg: '#4a1a1a', border: '#8b2a2a', text: '#d47070' },
};

export function BoardRatingBadge({ rating }: BoardRatingBadgeProps) {
  const colors = GRADE_COLORS[rating.grade];
  const { numberSpread, resourceSpread, resourceDiversity } = rating.breakdown;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 rounded-sm"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        fontFamily: 'Cinzel, serif',
      }}
      title={`Number Spread: ${numberSpread} · Resource Spread: ${resourceSpread} · Diversity: ${resourceDiversity}`}
    >
      {/* Grade seal */}
      <div className="relative flex-shrink-0">
        <svg viewBox="0 0 40 40" className="w-10 h-10">
          {/* Outer ring */}
          <circle cx="20" cy="20" r="18" fill="none" stroke={colors.border} strokeWidth="1.5" />
          {/* Inner fill */}
          <circle cx="20" cy="20" r="15" fill={colors.bg} />
          {/* Decorative tick marks */}
          {[0, 60, 120, 180, 240, 300].map(angle => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 20 + 15 * Math.cos(rad);
            const y1 = 20 + 15 * Math.sin(rad);
            const x2 = 20 + 18 * Math.cos(rad);
            const y2 = 20 + 18 * Math.sin(rad);
            return (
              <line
                key={angle}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={colors.border}
                strokeWidth="1"
              />
            );
          })}
          {/* Grade letter */}
          <text
            x="20" y="25"
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            fill={colors.text}
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            {rating.grade}
          </text>
        </svg>
      </div>

      {/* Label + score */}
      <div className="min-w-0">
        <div className="text-xs font-semibold tracking-wide leading-tight" style={{ color: colors.text }}>
          {rating.label}
        </div>
        {/* Mini breakdown bars */}
        <div className="mt-1 flex flex-col gap-0.5">
          {[
            { label: 'Nums', value: numberSpread },
            { label: 'Res',  value: resourceSpread },
            { label: 'Div',  value: resourceDiversity },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="text-[9px] w-7 opacity-60 tracking-wider" style={{ color: colors.text }}>{label}</span>
              <div
                className="h-1 rounded-full flex-1"
                style={{ background: `${colors.border}66` }}
              >
                <div
                  className="h-1 rounded-full transition-all duration-700"
                  style={{ width: `${value}%`, background: colors.text }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
