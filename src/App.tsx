import { useState, useMemo, useCallback } from 'react';
import { BoardState } from '@/types/board';
import { generateRandomBoard } from '@/lib/board/boardGeneration';
import { HexGrid } from '@/components/board/HexGrid';
import { RecommendationPanel } from '@/components/recommendations/RecommendationPanel';
import { getTopRecommendations } from '@/lib/scoring/scoreCalculator';
import { placeSettlement, removeSettlement } from '@/lib/game/placementRules';

const PLAYER_COLORS = [
  { id: 'red', label: 'You', color: '#e74c3c', textColor: '#fff' },
  { id: 'blue', label: 'P2', color: '#3498db', textColor: '#fff' },
  { id: 'orange', label: 'P3', color: '#e67e22', textColor: '#fff' },
  { id: 'white', label: 'P4', color: '#ecf0f1', textColor: '#333' },
];

function App() {
  const [board, setBoard] = useState<BoardState>(() => generateRandomBoard());
  const [selectedVertex, setSelectedVertex] = useState<string | null>(null);
  const [explanationMode, setExplanationMode] = useState<'beginner' | 'advanced'>('beginner');
  const [activeColor, setActiveColor] = useState<string>('red');

  const recommendations = useMemo(
    () => getTopRecommendations(board, 5, undefined, explanationMode, 'red'),
    [board, explanationMode]
  );

  const handleRandomize = () => {
    setBoard(generateRandomBoard());
    setSelectedVertex(null);
  };

  const handleVertexClick = useCallback((vertexId: string) => {
    const vertex = board.vertices.get(vertexId);
    if (!vertex) return;

    if (vertex.hasSettlement) {
      // Remove settlement on click
      setBoard(prev => removeSettlement(vertexId, prev));
      setSelectedVertex(null);
    } else {
      // First click selects, second click on same vertex places settlement
      if (selectedVertex === vertexId) {
        setBoard(prev => placeSettlement(vertexId, prev, activeColor));
        setSelectedVertex(null);
      } else {
        setSelectedVertex(vertexId);
      }
    }
  }, [board, selectedVertex, activeColor]);

  const handleModeToggle = () => {
    setExplanationMode(prev => prev === 'beginner' ? 'advanced' : 'beginner');
  };

  const handleClearAll = () => {
    setBoard(prev => {
      const newVertices = new Map(prev.vertices);
      newVertices.forEach((v, id) => {
        if (v.hasSettlement) {
          newVertices.set(id, { ...v, hasSettlement: false, playerColor: undefined });
        }
      });
      return { ...prev, vertices: newVertices };
    });
    setSelectedVertex(null);
  };

  // Count settlements per player
  const settlementCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    board.vertices.forEach(v => {
      if (v.hasSettlement && v.playerColor) {
        counts[v.playerColor] = (counts[v.playerColor] || 0) + 1;
      }
    });
    return counts;
  }, [board]);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, var(--parchment-light) 0%, var(--parchment) 50%, var(--parchment-dark) 100%)' }}>
      {/* Decorative corner flourishes */}
      <div className="fixed top-0 left-0 w-32 h-32 opacity-20 pointer-events-none">
        <svg viewBox="0 0 100 100" fill="none" stroke="var(--sepia-dark)" strokeWidth="1">
          <path d="M0 30 Q30 30 30 0" />
          <path d="M0 20 Q20 20 20 0" />
          <circle cx="15" cy="15" r="3" fill="var(--sepia-dark)" />
        </svg>
      </div>
      <div className="fixed top-0 right-0 w-32 h-32 opacity-20 pointer-events-none rotate-90">
        <svg viewBox="0 0 100 100" fill="none" stroke="var(--sepia-dark)" strokeWidth="1">
          <path d="M0 30 Q30 30 30 0" />
          <path d="M0 20 Q20 20 20 0" />
          <circle cx="15" cy="15" r="3" fill="var(--sepia-dark)" />
        </svg>
      </div>
      <div className="fixed bottom-0 left-0 w-32 h-32 opacity-20 pointer-events-none -rotate-90">
        <svg viewBox="0 0 100 100" fill="none" stroke="var(--sepia-dark)" strokeWidth="1">
          <path d="M0 30 Q30 30 30 0" />
          <path d="M0 20 Q20 20 20 0" />
          <circle cx="15" cy="15" r="3" fill="var(--sepia-dark)" />
        </svg>
      </div>
      <div className="fixed bottom-0 right-0 w-32 h-32 opacity-20 pointer-events-none rotate-180">
        <svg viewBox="0 0 100 100" fill="none" stroke="var(--sepia-dark)" strokeWidth="1">
          <path d="M0 30 Q30 30 30 0" />
          <path d="M0 20 Q20 20 20 0" />
          <circle cx="15" cy="15" r="3" fill="var(--sepia-dark)" />
        </svg>
      </div>

      {/* Header */}
      <header className="relative border-b-2" style={{ borderColor: 'var(--sepia)', background: 'linear-gradient(180deg, var(--parchment-light) 0%, var(--parchment) 100%)' }}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Compass rose icon */}
              <div className="w-14 h-14 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="var(--sepia)" strokeWidth="2" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="var(--sepia)" strokeWidth="1" opacity="0.5" />
                  {/* Cardinal points */}
                  <polygon points="50,8 45,35 50,30 55,35" fill="var(--copper)" />
                  <polygon points="50,92 45,65 50,70 55,65" fill="var(--sepia)" />
                  <polygon points="8,50 35,45 30,50 35,55" fill="var(--sepia)" />
                  <polygon points="92,50 65,45 70,50 65,55" fill="var(--sepia)" />
                  {/* Center */}
                  <circle cx="50" cy="50" r="6" fill="var(--gold-muted)" stroke="var(--sepia-dark)" strokeWidth="1" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl tracking-wide" style={{ color: 'var(--ink)' }}>
                  Settlement Advisor
                </h1>
                <p className="text-sm mt-1 italic" style={{ color: 'var(--ink-faded)' }}>
                  Chart Your Course to Victory
                </p>
              </div>
            </div>

            <button
              onClick={handleRandomize}
              className="group flex items-center gap-2 px-5 py-3 rounded transition-all duration-300 ornate-border"
              style={{
                background: 'linear-gradient(135deg, var(--parchment-light) 0%, var(--parchment) 100%)',
              }}
            >
              <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" viewBox="0 0 24 24" fill="none" stroke="var(--sepia-dark)" strokeWidth="2">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="font-medium" style={{ color: 'var(--ink)', fontFamily: 'Cinzel, serif' }}>
                New Voyage
              </span>
            </button>
          </div>
        </div>

        {/* Decorative bottom border pattern */}
        <div className="absolute bottom-0 left-0 right-0 h-1 opacity-30" style={{ background: 'repeating-linear-gradient(90deg, var(--sepia) 0px, var(--sepia) 10px, transparent 10px, transparent 20px)' }} />
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Board Container */}
          <div className="lg:col-span-8 animate-fade-in-up">
            <div
              className="relative p-8 ornate-border paper-edge rounded-sm"
              style={{ background: 'linear-gradient(145deg, var(--parchment-light) 0%, var(--parchment) 50%, var(--parchment-dark) 100%)' }}
            >
              {/* Map title cartouche */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-8 py-2 rounded-sm" style={{ background: 'var(--parchment)', border: '2px solid var(--sepia)' }}>
                <span className="text-sm tracking-widest uppercase" style={{ color: 'var(--sepia-dark)', fontFamily: 'Cinzel, serif' }}>
                  Territory Map
                </span>
              </div>

              {/* The hex board */}
              <HexGrid
                board={board}
                selectedVertex={selectedVertex}
                onVertexClick={handleVertexClick}
                recommendations={recommendations}
              />

              {/* Settlement Controls */}
              <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--sepia)' }}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  {/* Player color picker */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--ink-faded)', fontFamily: 'Cinzel, serif' }}>
                      Place as:
                    </span>
                    {PLAYER_COLORS.map(pc => (
                      <button
                        key={pc.id}
                        onClick={() => setActiveColor(pc.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          activeColor === pc.id ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'
                        }`}
                        style={{
                          background: pc.color,
                          color: pc.textColor,
                        }}
                      >
                        {pc.label}
                        {(settlementCounts[pc.id] || 0) > 0 && (
                          <span className="ml-1 opacity-80">({settlementCounts[pc.id]})</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {Object.keys(settlementCounts).length > 0 && (
                      <button
                        onClick={handleClearAll}
                        className="px-3 py-1.5 rounded text-xs transition-all hover:opacity-80"
                        style={{
                          background: 'var(--parchment-dark)',
                          color: 'var(--ink-faded)',
                          border: '1px solid var(--sepia)',
                        }}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Hint */}
                <p className="text-xs mt-2 italic" style={{ color: 'var(--ink-faded)' }}>
                  Click a position to select it, click again to place. Click a settlement to remove it.
                  {(settlementCounts['red'] || 0) > 0 && ' Recommendations now complement your settlements.'}
                </p>
              </div>

              {/* Legend */}
              <div className="mt-4 pt-3 flex flex-wrap justify-center gap-4 text-xs" style={{ borderTop: '1px solid var(--sepia)', color: 'var(--ink-faded)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: 'var(--vertex-recommended)' }} />
                  <span>Best Position</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: 'var(--vertex-selected)' }} />
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: 'var(--vertex-available)' }} />
                  <span>Available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations Panel */}
          <div className="lg:col-span-4 animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
            <RecommendationPanel
              recommendations={recommendations}
              selectedVertex={selectedVertex}
              onVertexSelect={setSelectedVertex}
              explanationMode={explanationMode}
              onModeToggle={handleModeToggle}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 py-4 text-center text-xs" style={{ color: 'var(--sepia)', borderTop: '1px solid var(--sepia)' }}>
        <p className="italic">
          "Fortune favors the prepared settler"
        </p>
      </footer>
    </div>
  );
}

export default App;
