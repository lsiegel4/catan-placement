import { useState, useCallback, useMemo } from 'react';
import { BoardState } from '@/types/board';
import { generateRandomBoard, generateBalancedBoard } from '@/lib/board/boardGeneration';
import {
  placeSettlement as doPlace,
  removeSettlement as doRemove,
} from '@/lib/game/placementRules';
import { PLAYER_COLORS } from '@/constants/players';

export type BoardMode = 'random' | 'balanced';

// Generate snake draft indices: [0,1,...,n-1, n-1,...,1,0]
function buildSnakeDraft(playerCount: number): number[] {
  const forward = Array.from({ length: playerCount }, (_, i) => i);
  return [...forward, ...forward.slice().reverse()];
}

export interface UseGameState {
  board: BoardState;
  boardMode: BoardMode;
  playerCount: number;
  setupTurnIndex: number;
  snakeDraft: number[];
  currentPlayerIndex: number;
  activeColor: string;
  isSetupComplete: boolean;
  settlementCounts: Record<string, number>;
  placeSettlement: (vertexId: string) => void;
  removeSettlement: (vertexId: string) => void;
  clearAll: () => void;
  setPlayerCount: (n: number) => void;
  setBoardMode: (mode: BoardMode) => void;
  generateNewBoard: () => void;
}

export function useGameState(): UseGameState {
  const [boardMode, setBoardModeState] = useState<BoardMode>('random');
  const [board, setBoard] = useState<BoardState>(() => generateRandomBoard());
  const [playerCount, setPlayerCountState] = useState(4);
  const [setupTurnIndex, setSetupTurnIndex] = useState(0);

  const snakeDraft = useMemo(() => buildSnakeDraft(playerCount), [playerCount]);
  const totalSetupTurns = snakeDraft.length; // 2 × playerCount

  const isSetupComplete = setupTurnIndex >= totalSetupTurns;
  const currentPlayerIndex = isSetupComplete
    ? snakeDraft[totalSetupTurns - 1] // stay on last player after setup
    : snakeDraft[setupTurnIndex];
  const activeColor = PLAYER_COLORS[currentPlayerIndex]?.id ?? 'red';

  const settlementCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    board.vertices.forEach(v => {
      if (v.hasSettlement && v.playerColor) {
        counts[v.playerColor] = (counts[v.playerColor] || 0) + 1;
      }
    });
    return counts;
  }, [board]);

  const placeSettlement = useCallback((vertexId: string) => {
    // Capture current active color before advancing the turn
    const color = PLAYER_COLORS[
      buildSnakeDraft(playerCount)[Math.min(setupTurnIndex, totalSetupTurns - 1)]
    ]?.id ?? 'red';

    setBoard(prev => doPlace(vertexId, prev, color));
    setSetupTurnIndex(prev => Math.min(prev + 1, totalSetupTurns));
  }, [playerCount, setupTurnIndex, totalSetupTurns]);

  const removeSettlement = useCallback((vertexId: string) => {
    setBoard(prev => doRemove(vertexId, prev));
  }, []);

  const clearAll = useCallback(() => {
    setBoard(prev => {
      const newVertices = new Map(prev.vertices);
      newVertices.forEach((v, id) => {
        if (v.hasSettlement) {
          newVertices.set(id, { ...v, hasSettlement: false, playerColor: undefined });
        }
      });
      return { ...prev, vertices: newVertices };
    });
    setSetupTurnIndex(0);
  }, []);

  const setPlayerCount = useCallback((n: number) => {
    setPlayerCountState(n);
    setSetupTurnIndex(0);
    setBoard(boardMode === 'balanced' ? generateBalancedBoard() : generateRandomBoard());
  }, [boardMode]);

  const setBoardMode = useCallback((mode: BoardMode) => {
    setBoardModeState(mode);
    setSetupTurnIndex(0);
    setBoard(mode === 'balanced' ? generateBalancedBoard() : generateRandomBoard());
  }, []);

  const generateNewBoard = useCallback(() => {
    setBoard(boardMode === 'balanced' ? generateBalancedBoard() : generateRandomBoard());
    setSetupTurnIndex(0);
  }, [boardMode]);

  return {
    board,
    boardMode,
    playerCount,
    setupTurnIndex,
    snakeDraft,
    currentPlayerIndex,
    activeColor,
    isSetupComplete,
    settlementCounts,
    placeSettlement,
    removeSettlement,
    clearAll,
    setBoardMode,
    setPlayerCount,
    generateNewBoard,
  };
}
