import { VertexScore } from '@/types/scoring';
import { RecommendationCard } from './RecommendationCard';

interface RecommendationPanelProps {
  recommendations: VertexScore[];
  selectedVertex: string | null;
  onVertexSelect: (vertexId: string) => void;
  explanationMode: 'beginner' | 'advanced';
  onModeToggle: () => void;
}

export function RecommendationPanel({
  recommendations,
  selectedVertex,
  onVertexSelect,
  explanationMode,
  onModeToggle,
}: RecommendationPanelProps) {
  return (
    <div
      className="ornate-border paper-edge rounded-sm sticky top-8"
      style={{ background: 'linear-gradient(145deg, var(--parchment-light) 0%, var(--parchment) 100%)' }}
    >
      {/* Header with scroll decoration */}
      <div
        className="relative px-6 py-4 border-b"
        style={{ borderColor: 'var(--sepia)' }}
      >
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

        <h2
          className="text-lg text-center tracking-wider"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--ink)' }}
        >
          Strategic Positions
        </h2>

        {/* Mode Toggle - styled as a wax seal toggle */}
        <div className="flex justify-center mt-3">
          <div
            className="flex rounded-full p-1 gap-1"
            style={{ background: 'var(--parchment-dark)', border: '1px solid var(--sepia)' }}
          >
            <button
              onClick={onModeToggle}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                explanationMode === 'beginner'
                  ? 'raised-shadow'
                  : 'opacity-60 hover:opacity-100'
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
                explanationMode === 'advanced'
                  ? 'raised-shadow'
                  : 'opacity-60 hover:opacity-100'
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
        </div>
      </div>

      {/* Recommendations List */}
      <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
        {recommendations.length === 0 ? (
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
              onClick={() => onVertexSelect(recommendation.vertexId)}
              explanationMode={explanationMode}
            />
          ))
        )}
      </div>

      {/* Footer with navigation hint */}
      <div
        className="px-4 py-3 text-center border-t"
        style={{ borderColor: 'var(--sepia)', color: 'var(--ink-faded)' }}
      >
        <p className="text-xs italic flex items-center justify-center gap-2">
          <span className="opacity-60">⚓</span>
          Select a position to view details
          <span className="opacity-60">⚓</span>
        </p>
      </div>
    </div>
  );
}
