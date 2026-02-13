import React from 'react';
import { VertexScore, ScoreWeights, DEFAULT_WEIGHTS, RoadSuggestion } from '@/types/scoring';
import { RecommendationCard } from './RecommendationCard';
import { WeightsPanel } from '@/components/scoring/WeightsPanel';
import { RoadSuggestionsSection } from './RoadSuggestionsSection';

interface RecommendationPanelProps {
  recommendations: VertexScore[];
  selectedVertex: string | null;
  onVertexSelect: (vertexId: string) => void;
  explanationMode: 'beginner' | 'advanced';
  onModeToggle: () => void;
  focusedIndex: number;
  onFocusChange: (index: number) => void;
  weights: ScoreWeights;
  onWeightsChange: (w: ScoreWeights) => void;
  isSetupComplete?: boolean;
  pendingRoadFor?: string | null;
  roadSuggestions?: RoadSuggestion[];
  focusedRoadKey?: string | null;
  onRoadFocus?: (key: string | null) => void;
}

export function RecommendationPanel({
  recommendations,
  selectedVertex,
  onVertexSelect,
  explanationMode,
  onModeToggle,
  focusedIndex,
  onFocusChange,
  weights,
  onWeightsChange,
  isSetupComplete = false,
  pendingRoadFor = null,
  roadSuggestions = [],
  focusedRoadKey = null,
  onRoadFocus,
}: RecommendationPanelProps) {
  const isCustomWeights = Object.keys(DEFAULT_WEIGHTS).some(k => {
    const w = weights as unknown as Record<string, number>;
    const d = DEFAULT_WEIGHTS as unknown as Record<string, number>;
    return Math.abs(w[k] - d[k]) > 0.001;
  });
  const [weightsOpen, setWeightsOpen] = React.useState(false);

  return (
    <div
      className="ornate-border paper-edge rounded-sm sticky top-8"
      style={{ background: 'linear-gradient(145deg, var(--parchment-light) 0%, var(--parchment) 100%)' }}
    >
      {/* Header */}
      <div className="relative px-6 py-4 border-b" style={{ borderColor: 'var(--sepia)' }}>
        {/* Scroll/banner decoration */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6">
          <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0 15 C0 5 10 0 20 0 L80 0 C90 0 100 5 100 15 L100 30 L0 30 Z"
              fill="var(--parchment)"
              stroke="var(--sepia)"
              strokeWidth="1"
            />
          </svg>
        </div>

        <h2 className="text-lg text-center tracking-wider" style={{ fontFamily: 'Cinzel, serif', color: 'var(--ink)' }}>
          {(isSetupComplete || pendingRoadFor) ? 'Road Planning' : 'Strategic Positions'}
        </h2>

        {/* Mode toggle + weights gear — only in settlement mode */}
        {(isSetupComplete || pendingRoadFor) && (
          <p className="text-center text-xs mt-2 italic" style={{ color: 'var(--ink-faded)' }}>
            {pendingRoadFor && !isSetupComplete
              ? 'Click the map or select a road below'
              : 'Hover a road to preview it on the map'}
          </p>
        )}

        {/* Mode toggle + weights gear — settlement mode only */}
        {!(isSetupComplete || pendingRoadFor) && <div className="flex justify-center items-center mt-3 gap-2">
          <div
            className="flex rounded-full p-1 gap-1"
            style={{ background: 'var(--parchment-dark)', border: '1px solid var(--sepia)' }}
          >
            <button
              onClick={onModeToggle}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                explanationMode === 'beginner' ? 'raised-shadow' : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                fontFamily: 'Cinzel, serif',
                color: 'var(--ink)',
                background: explanationMode === 'beginner' ? 'var(--parchment-light)' : 'transparent',
              }}
            >
              Guide
            </button>
            <button
              onClick={onModeToggle}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                explanationMode === 'advanced' ? 'raised-shadow' : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                fontFamily: 'Cinzel, serif',
                color: 'var(--ink)',
                background: explanationMode === 'advanced' ? 'var(--parchment-light)' : 'transparent',
              }}
            >
              Scholar
            </button>
          </div>

          {/* Strategy / weights gear button */}
          <button
            onClick={() => setWeightsOpen(o => !o)}
            className="relative w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-80"
            style={{
              background: weightsOpen ? 'var(--sepia)' : 'var(--parchment-dark)',
              border: `1px solid var(--sepia)`,
            }}
            title="Strategy weights"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={weightsOpen ? 'var(--parchment-light)' : 'var(--sepia-dark)'} strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            {/* Dot indicator when custom weights active */}
            {isCustomWeights && (
              <span
                className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full"
                style={{ background: 'var(--copper)' }}
              />
            )}
          </button>
        </div>}
      </div>

      {/* Weights panel (collapsible) — only in settlement mode */}
      {!(isSetupComplete || pendingRoadFor) && weightsOpen && (
        <WeightsPanel weights={weights} onChange={onWeightsChange} />
      )}

      {/* Body: Settlement recommendations OR Road planning */}
      <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
        {(isSetupComplete || pendingRoadFor) ? (
          <RoadSuggestionsSection
            suggestions={roadSuggestions}
            focusedKey={focusedRoadKey}
            onFocus={onRoadFocus ?? (() => {})}
          />
        ) : recommendations.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--ink-faded)' }}>
            <svg className="w-12 h-12 mx-auto mb-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <p className="italic">No territories available</p>
          </div>
        ) : (
          recommendations.map((recommendation, index) => (
            <RecommendationCard
              key={recommendation.vertexId}
              recommendation={recommendation}
              rank={index + 1}
              isSelected={recommendation.vertexId === selectedVertex}
              isFocused={index === focusedIndex}
              onClick={() => { onFocusChange(index); onVertexSelect(recommendation.vertexId); }}
              explanationMode={explanationMode}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 text-center border-t" style={{ borderColor: 'var(--sepia)', color: 'var(--ink-faded)' }}>
        <p className="text-xs italic flex items-center justify-center gap-2">
          <span className="opacity-60">⚓</span>
          {(isSetupComplete || pendingRoadFor) ? 'Hover a road card to preview on the map' : 'Select a position to view details'}
          <span className="opacity-60">⚓</span>
        </p>
      </div>
    </div>
  );
}


