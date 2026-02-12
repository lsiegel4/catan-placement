import { PLAYER_COLORS } from '@/constants/players';

interface TurnTrackerProps {
  snakeDraft: number[];
  setupTurnIndex: number;
  isSetupComplete: boolean;
  playerCount: number;
  onSetPlayerCount: (n: number) => void;
  settlementCounts: Record<string, number>;
}

export function TurnTracker({
  snakeDraft,
  setupTurnIndex,
  isSetupComplete,
  playerCount,
  onSetPlayerCount,
  settlementCounts,
}: TurnTrackerProps) {
  const currentStep = Math.min(setupTurnIndex, snakeDraft.length - 1);

  return (
    <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--sepia)' }}>
      <div className="flex items-center justify-between mb-3 gap-4 flex-wrap">
        {/* Section label */}
        <span
          className="text-xs tracking-widest uppercase"
          style={{ color: 'var(--ink-faded)', fontFamily: 'Cinzel, serif' }}
        >
          {isSetupComplete ? 'Setup Complete' : `Turn ${setupTurnIndex + 1} of ${snakeDraft.length}`}
        </span>

        {/* Player count selector */}
        <div className="flex items-center gap-1">
          <span className="text-xs mr-1" style={{ color: 'var(--ink-faded)', fontFamily: 'Cinzel, serif' }}>
            Players:
          </span>
          {[2, 3, 4].map(n => (
            <button
              key={n}
              onClick={() => onSetPlayerCount(n)}
              className="w-7 h-7 rounded-full text-xs font-medium transition-all"
              style={{
                fontFamily: 'Cinzel, serif',
                background: n === playerCount ? 'var(--sepia)' : 'var(--parchment-dark)',
                color: n === playerCount ? 'var(--parchment-light)' : 'var(--ink-faded)',
                border: `1px solid ${n === playerCount ? 'var(--sepia-dark)' : 'var(--sepia)'}`,
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Snake draft sequence */}
      <div className="flex items-center gap-1 flex-wrap">
        {snakeDraft.map((playerIdx, step) => {
          const player = PLAYER_COLORS[playerIdx];
          const isPast = step < setupTurnIndex;
          const isCurrent = step === currentStep && !isSetupComplete;
          const isFuture = step > setupTurnIndex && !isSetupComplete;
          const settlementCount = settlementCounts[player.id] || 0;

          return (
            <div key={step} className="flex items-center">
              {/* Arrow between tokens */}
              {step > 0 && (
                <svg
                  className="w-3 h-3 mx-0.5 flex-shrink-0"
                  viewBox="0 0 12 12"
                  fill="none"
                  style={{ opacity: isFuture ? 0.25 : 0.5 }}
                >
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="var(--sepia)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}

              {/* Player token */}
              <div className="relative flex-shrink-0">
                <div
                  className="flex items-center justify-center rounded-full font-medium text-xs transition-all duration-300"
                  style={{
                    width: isCurrent ? 32 : 26,
                    height: isCurrent ? 32 : 26,
                    background: player.color,
                    color: player.textColor,
                    fontFamily: 'Cinzel, serif',
                    opacity: isFuture ? 0.35 : 1,
                    border: isCurrent
                      ? `2px solid var(--sepia-dark)`
                      : isPast
                      ? `1.5px solid ${player.color}66`
                      : '1.5px solid transparent',
                    boxShadow: isCurrent
                      ? '0 0 0 3px var(--parchment), 0 0 0 4px var(--sepia)'
                      : 'none',
                    filter: isPast ? 'grayscale(0.4) brightness(0.85)' : 'none',
                    fontSize: isCurrent ? '13px' : '11px',
                  }}
                >
                  {player.label}
                </div>

                {/* Settlement count badge */}
                {settlementCount > 0 && (
                  <div
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{
                      background: 'var(--sepia-dark)',
                      color: 'var(--parchment-light)',
                    }}
                  >
                    {settlementCount}
                  </div>
                )}

                {/* Checkmark for completed turns */}
                {isPast && (
                  <div
                    className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--score-good)' }}
                  >
                    <svg viewBox="0 0 8 8" className="w-2 h-2">
                      <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Setup complete indicator */}
        {isSetupComplete && (
          <div
            className="ml-2 px-2 py-0.5 rounded-full text-xs"
            style={{
              background: 'var(--score-excellent)',
              color: 'var(--parchment-light)',
              fontFamily: 'Cinzel, serif',
              opacity: 0.9,
            }}
          >
            ✓ Done
          </div>
        )}
      </div>
    </div>
  );
}
