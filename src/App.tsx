import { useState, useMemo, useCallback } from 'react';
import { HexGrid } from '@/components/board/HexGrid';
import { RecommendationPanel } from '@/components/recommendations/RecommendationPanel';
import { BoardRatingBadge } from '@/components/board/BoardRatingBadge';
import { TurnTracker } from '@/components/game/TurnTracker';
import { getTopRecommendations } from '@/lib/scoring/scoreCalculator';
import { rateBoard } from '@/lib/board/boardRating';
import { useGameState } from '@/hooks/useGameState';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ScoreWeights, DEFAULT_WEIGHTS } from '@/types/scoring';

function App() {
  const game = useGameState();

  const [selectedVertex, setSelectedVertex] = useState<string | null>(null);
  const [explanationMode, setExplanationMode] = useState<'beginner' | 'advanced'>('beginner');
  const [focusedRecIndex, setFocusedRecIndex] = useState<number>(0);
  const [weights, setWeights] = useState<ScoreWeights>(DEFAULT_WEIGHTS);

  const recommendations = useMemo(
    () => getTopRecommendations(game.board, 5, weights, explanationMode, game.activeColor),
    [game.board, weights, explanationMode, game.activeColor]
  );

  const boardRating = useMemo(() => rateBoard(game.board), [game.board]);

  const handleVertexClick = useCallback((vertexId: string) => {
    const vertex = game.board.vertices.get(vertexId);
    if (!vertex) return;

    if (vertex.hasSettlement) {
      game.removeSettlement(vertexId);
      setSelectedVertex(null);
    } else {
      if (selectedVertex === vertexId) {
        game.placeSettlement(vertexId);
        setSelectedVertex(null);
      } else {
        setSelectedVertex(vertexId);
      }
    }
  }, [game, selectedVertex]);

  const handleModeToggle = () => {
    setExplanationMode(prev => prev === 'beginner' ? 'advanced' : 'beginner');
  };

  const handleClearAll = () => {
    game.clearAll();
    setSelectedVertex(null);
    setFocusedRecIndex(0);
  };

  const handleNewBoard = useCallback(() => {
    game.generateNewBoard();
    setSelectedVertex(null);
    setFocusedRecIndex(0);
  }, [game]);

  // Keyboard shortcut handlers
  const handleSelectFocused = useCallback(() => {
    const rec = recommendations[focusedRecIndex];
    if (!rec) return;
    const vertexId = rec.vertexId;
    if (selectedVertex === vertexId) {
      game.placeSettlement(vertexId);
      setSelectedVertex(null);
    } else {
      setSelectedVertex(vertexId);
    }
  }, [recommendations, focusedRecIndex, selectedVertex, game]);

  const handleDeselect = useCallback(() => setSelectedVertex(null), []);

  useKeyboardShortcuts({
    recommendationCount: recommendations.length,
    focusedIndex: focusedRecIndex,
    onFocusChange: setFocusedRecIndex,
    onSelectFocused: handleSelectFocused,
    onDeselect: handleDeselect,
    onNewBoard: handleNewBoard,
  });

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, var(--parchment-light) 0%, var(--parchment) 50%, var(--parchment-dark) 100%)' }}>
      {/* Decorative corner flourishes */}
      {['', 'rotate-90', '-rotate-90', 'rotate-180'].map((rot, i) => (
        <div key={i} className={`fixed ${['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'][i]} w-32 h-32 opacity-20 pointer-events-none ${rot}`}>
          <svg viewBox="0 0 100 100" fill="none" stroke="var(--sepia-dark)" strokeWidth="1">
            <path d="M0 30 Q30 30 30 0" /><path d="M0 20 Q20 20 20 0" />
            <circle cx="15" cy="15" r="3" fill="var(--sepia-dark)" />
          </svg>
        </div>
      ))}

      {/* Header */}
      <header className="relative border-b-2" style={{ borderColor: 'var(--sepia)', background: 'linear-gradient(180deg, var(--parchment-light) 0%, var(--parchment) 100%)' }}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              {/* Compass rose icon */}
              <div className="w-14 h-14 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="var(--sepia)" strokeWidth="2" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="var(--sepia)" strokeWidth="1" opacity="0.5" />
                  <polygon points="50,8 45,35 50,30 55,35" fill="var(--copper)" />
                  <polygon points="50,92 45,65 50,70 55,65" fill="var(--sepia)" />
                  <polygon points="8,50 35,45 30,50 35,55" fill="var(--sepia)" />
                  <polygon points="92,50 65,45 70,50 65,55" fill="var(--sepia)" />
                  <circle cx="50" cy="50" r="6" fill="var(--gold-muted)" stroke="var(--sepia-dark)" strokeWidth="1" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl tracking-wide" style={{ color: 'var(--ink)' }}>Settlement Advisor</h1>
                <p className="text-sm mt-1 italic" style={{ color: 'var(--ink-faded)' }}>Chart Your Course to Victory</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Board mode toggle */}
              <div className="flex rounded-full p-1 gap-1" style={{ background: 'var(--parchment-dark)', border: '1px solid var(--sepia)' }}>
                {(['random', 'balanced'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => game.setBoardMode(mode)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 capitalize ${
                      game.boardMode === mode ? 'raised-shadow' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      fontFamily: 'Cinzel, serif',
                      color: 'var(--ink)',
                      background: game.boardMode === mode ? 'var(--parchment-light)' : 'transparent',
                    }}
                    title={mode === 'balanced' ? 'Official Catan recommended beginner setup' : 'Fully randomized board'}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* New board button */}
              <button
                onClick={handleNewBoard}
                disabled={game.boardMode === 'balanced'}
                className="group flex items-center gap-2 px-5 py-3 rounded transition-all duration-300 ornate-border"
                style={{
                  background: 'linear-gradient(135deg, var(--parchment-light) 0%, var(--parchment) 100%)',
                  opacity: game.boardMode === 'balanced' ? 0.4 : 1,
                  cursor: game.boardMode === 'balanced' ? 'not-allowed' : 'pointer',
                }}
                title={game.boardMode === 'balanced' ? 'Fixed layout — switch to Random for new boards' : 'New board (N)'}
              >
                <svg
                  className={`w-5 h-5 transition-transform duration-500 ${game.boardMode !== 'balanced' ? 'group-hover:rotate-180' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="var(--sepia-dark)" strokeWidth="2"
                >
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="font-medium" style={{ color: 'var(--ink)', fontFamily: 'Cinzel, serif' }}>New Voyage</span>
              </button>
            </div>
          </div>
        </div>
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
                  {game.boardMode === 'balanced' ? 'Official Layout' : 'Territory Map'}
                </span>
              </div>

              {/* Board rating badge */}
              <div className="absolute top-3 right-3">
                <BoardRatingBadge rating={boardRating} />
              </div>

              {/* Hex board */}
              <HexGrid
                board={game.board}
                selectedVertex={selectedVertex}
                onVertexClick={handleVertexClick}
                recommendations={recommendations}
              />

              {/* Turn tracker */}
              <TurnTracker
                snakeDraft={game.snakeDraft}
                setupTurnIndex={game.setupTurnIndex}
                isSetupComplete={game.isSetupComplete}
                playerCount={game.playerCount}
                onSetPlayerCount={game.setPlayerCount}
                settlementCounts={game.settlementCounts}
              />

              {/* Actions row */}
              <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                {Object.keys(game.settlementCounts).length > 0 && (
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
                <p className="text-xs italic" style={{ color: 'var(--ink-faded)' }}>
                  Click a spot to select, click again to place. Click a settlement to remove it.
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
                <div className="flex items-center gap-2 opacity-60">
                  <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--parchment-dark)', border: '1px solid var(--sepia)' }}>↑↓</kbd>
                  <span>Navigate</span>
                  <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--parchment-dark)', border: '1px solid var(--sepia)' }}>↵</kbd>
                  <span>Select</span>
                  <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--parchment-dark)', border: '1px solid var(--sepia)' }}>N</kbd>
                  <span>New board</span>
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
              focusedIndex={focusedRecIndex}
              onFocusChange={setFocusedRecIndex}
              weights={weights}
              onWeightsChange={setWeights}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 py-4 text-center text-xs" style={{ color: 'var(--sepia)', borderTop: '1px solid var(--sepia)' }}>
        <p className="italic">"Fortune favors the prepared settler"</p>
      </footer>
    </div>
  );
}

export default App;
