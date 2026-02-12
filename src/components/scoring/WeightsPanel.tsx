import { ScoreWeights, DEFAULT_WEIGHTS, SCORE_PRESETS } from '@/types/scoring';

interface WeightsPanelProps {
  weights: ScoreWeights;
  onChange: (weights: ScoreWeights) => void;
}

const WEIGHT_META: { key: keyof ScoreWeights; label: string; description: string }[] = [
  { key: 'probability',   label: 'Yield',     description: 'Expected dice production' },
  { key: 'diversity',     label: 'Variety',   description: 'Covering all resource types' },
  { key: 'numberQuality', label: 'Fortune',   description: 'Preference for 6 & 8 tiles' },
  { key: 'port',          label: 'Port',      description: 'Proximity to trading ports' },
  { key: 'expansion',     label: 'Growth',    description: 'Room for future settlements' },
  { key: 'scarcity',      label: 'Scarcity',  description: 'Bonus for rare resources' },
  { key: 'complement',    label: 'Synergy',   description: 'Complements your placements' },
];

function activePreset(weights: ScoreWeights): string | null {
  for (const [key, preset] of Object.entries(SCORE_PRESETS)) {
    const w = weights as unknown as Record<string, number>;
    const p = preset.weights as unknown as Record<string, number>;
    if (Object.keys(DEFAULT_WEIGHTS).every(k => Math.abs(w[k] - p[k]) < 0.001)) {
      return key;
    }
  }
  return null;
}

export function WeightsPanel({ weights, onChange }: WeightsPanelProps) {
  const currentPreset = activePreset(weights);

  const handleSlider = (key: keyof ScoreWeights, value: number) => {
    onChange({ ...weights, [key]: value });
  };

  return (
    <div
      className="border-t px-4 pt-4 pb-3"
      style={{ borderColor: 'var(--sepia)' }}
    >
      {/* Presets */}
      <div className="mb-4">
        <p className="text-xs mb-2 tracking-wider uppercase" style={{ color: 'var(--ink-faded)', fontFamily: 'Cinzel, serif' }}>
          Strategy
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(SCORE_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => onChange({ ...preset.weights })}
              className="px-2 py-2 rounded-sm text-left transition-all duration-200 hover:opacity-90"
              style={{
                background: currentPreset === key ? 'var(--sepia)' : 'var(--parchment-dark)',
                border: `1px solid ${currentPreset === key ? 'var(--sepia-dark)' : 'var(--sepia)'}`,
                boxShadow: currentPreset === key ? 'inset 0 1px 2px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              <div
                className="text-xs font-semibold leading-tight"
                style={{ fontFamily: 'Cinzel, serif', color: currentPreset === key ? 'var(--parchment-light)' : 'var(--ink)' }}
              >
                {preset.label}
              </div>
              <div
                className="text-[10px] leading-tight mt-0.5 opacity-75"
                style={{ color: currentPreset === key ? 'var(--parchment)' : 'var(--ink-faded)' }}
              >
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs tracking-wider uppercase" style={{ color: 'var(--ink-faded)', fontFamily: 'Cinzel, serif' }}>
            Weights
          </p>
          <button
            onClick={() => onChange({ ...DEFAULT_WEIGHTS })}
            className="text-[10px] px-2 py-0.5 rounded transition-opacity hover:opacity-80"
            style={{
              color: 'var(--ink-faded)',
              border: '1px solid var(--sepia)',
              background: 'var(--parchment-dark)',
              fontFamily: 'Cinzel, serif',
            }}
          >
            Reset
          </button>
        </div>

        {WEIGHT_META.map(({ key, label, description }) => {
          const value = weights[key];
          const pct = (value / 1.5) * 100;
          return (
            <div key={key} title={description}>
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-xs"
                  style={{ color: 'var(--ink)', fontFamily: 'Cinzel, serif' }}
                >
                  {label}
                </span>
                <span
                  className="text-xs tabular-nums"
                  style={{ color: 'var(--ink-faded)', fontFamily: 'Cinzel, serif' }}
                >
                  {value.toFixed(2)}
                </span>
              </div>

              {/* Custom-styled range input */}
              <div className="relative h-3 flex items-center">
                {/* Track background */}
                <div
                  className="absolute inset-x-0 h-1.5 rounded-full"
                  style={{ background: 'var(--parchment-dark)', border: '1px solid var(--sepia)' }}
                />
                {/* Filled portion */}
                <div
                  className="absolute left-0 h-1.5 rounded-full transition-all duration-100"
                  style={{ width: `${pct}%`, background: 'var(--sepia)' }}
                />
                {/* Actual range input (transparent, on top) */}
                <input
                  type="range"
                  min={0}
                  max={1.5}
                  step={0.05}
                  value={value}
                  onChange={e => handleSlider(key, parseFloat(e.target.value))}
                  className="absolute inset-x-0 w-full opacity-0 cursor-pointer"
                  style={{ height: '20px' }}
                />
                {/* Thumb indicator */}
                <div
                  className="absolute w-3.5 h-3.5 rounded-full border-2 pointer-events-none transition-all duration-100"
                  style={{
                    left: `calc(${pct}% - 7px)`,
                    background: 'var(--parchment-light)',
                    borderColor: 'var(--sepia-dark)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
