import { useState, useCallback, useMemo } from 'react';
import { BoardState } from '@/types/board';
import { generateRandomBoard, generateBalancedBoard, createEmptyBoard } from '@/lib/board/boardGeneration';
import {
  placeSettlement as doPlace,
  removeSettlement as doRemove,
} from '@/lib/game/placementRules';
import { PLAYER_COLORS } from '@/constants/players';
import { ResourceType } from '@/types/board';

export type BoardMode = 'random' | 'balanced' | 'manual';

const RESOURCE_CYCLE: ResourceType[] = ['desert', 'wheat', 'wood', 'brick', 'ore', 'sheep'];
const NUMBER_CYCLE: (number | null)[] = [null, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12];

// Generate snake draft indices: [0,1,...,n-1, n-1,...,1,0]
function buildSnakeDraft(playerCount: number): number[] {
  const forward = Array.from({ length: playerCount }, (_, i) => i);
  return [...forward, ...forward.slice().reverse()];
}

// Find the first unfilled slot in the snake draft based on actual board state.
// A slot for player P at occurrence k (0-indexed) is "filled" when P has placed
// at least k+1 settlements. Returns snakeDraft.length when all slots are filled.
function computeTurnIndex(snakeDraft: number[], board: BoardState): number {
  const settlementsByColor: Record<string, number> = {};
  board.vertices.forEach(v => {
    if (v.hasSettlement && v.playerColor) {
      settlementsByColor[v.playerColor] = (settlementsByColor[v.playerColor] || 0) + 1;
    }
  });

  const occurrenceSoFar: Record<number, number> = {};
  for (let i = 0; i < snakeDraft.length; i++) {
    const playerIndex = snakeDraft[i];
    const seen = occurrenceSoFar[playerIndex] ?? 0;
    const color = PLAYER_COLORS[playerIndex]?.id ?? '';
    const placed = settlementsByColor[color] ?? 0;
    if (placed <= seen) return i; // This slot hasn't been claimed yet
    occurrenceSoFar[playerIndex] = seen + 1;
  }
  return snakeDraft.length; // All slots filled = setup complete
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
  editHexResource: (hexId: string) => void;
  editHexNumber: (hexId: string) => void;
}

export function useGameState(): UseGameState {
  const [boardMode, setBoardModeState] = useState<BoardMode>('random');
  const [board, setBoard] = useState<BoardState>(() => generateRandomBoard());
  const [playerCount, setPlayerCountState] = useState(4);

  const snakeDraft = useMemo(() => buildSnakeDraft(playerCount), [playerCount]);
  const totalSetupTurns = snakeDraft.length;

  // Derive turn from board state — no separate counter needed.
  // This means the turn auto-corrects whenever settlements are placed or removed,
  // and invalid placements (board unchanged) leave the turn index unchanged.
  const setupTurnIndex = useMemo(
    () => computeTurnIndex(snakeDraft, board),
    [snakeDraft, board]
  );

  const isSetupComplete = setupTurnIndex >= totalSetupTurns;
  const currentPlayerIndex = isSetupComplete
    ? snakeDraft[totalSetupTurns - 1]
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
    setBoard(prev => {
      const turnIdx = computeTurnIndex(snakeDraft, prev);
      if (turnIdx >= totalSetupTurns) return prev; // setup complete
      const color = PLAYER_COLORS[snakeDraft[turnIdx]]?.id ?? 'red';
      // doPlace returns prev unchanged if placement is invalid — turn won't advance
      return doPlace(vertexId, prev, color);
    });
  }, [snakeDraft, totalSetupTurns]);

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
  }, []);

  const setPlayerCount = useCallback((n: number) => {
    setPlayerCountState(n);
    setBoard(boardMode === 'balanced' ? generateBalancedBoard() : boardMode === 'manual' ? createEmptyBoard() : generateRandomBoard());
  }, [boardMode]);

  const setBoardMode = useCallback((mode: BoardMode) => {
    setBoardModeState(mode);
    setBoard(mode === 'balanced' ? generateBalancedBoard() : mode === 'manual' ? createEmptyBoard() : generateRandomBoard());
  }, []);

  const generateNewBoard = useCallback(() => {
    setBoard(boardMode === 'balanced' ? generateBalancedBoard() : boardMode === 'manual' ? createEmptyBoard() : generateRandomBoard());
  }, [boardMode]);

  const editHexResource = useCallback((hexId: string) => {
    setBoard(prev => {
      const hex = prev.hexes.get(hexId);
      if (!hex) return prev;
      const nextResource = RESOURCE_CYCLE[(RESOURCE_CYCLE.indexOf(hex.resource) + 1) % RESOURCE_CYCLE.length];
      const newHexes = new Map(prev.hexes);
      newHexes.set(hexId, {
        ...hex,
        resource: nextResource,
        number: nextResource === 'desert' ? null : hex.number,
        hasRobber: nextResource === 'desert',
      });
      return { ...prev, hexes: newHexes };
    });
  }, []);

  const editHexNumber = useCallback((hexId: string) => {
    setBoard(prev => {
      const hex = prev.hexes.get(hexId);
      if (!hex || hex.resource === 'desert') return prev;
      const currentIdx = NUMBER_CYCLE.indexOf(hex.number);
      const nextNumber = NUMBER_CYCLE[(currentIdx + 1) % NUMBER_CYCLE.length];
      const newHexes = new Map(prev.hexes);
      newHexes.set(hexId, { ...hex, number: nextNumber });
      return { ...prev, hexes: newHexes };
    });
  }, []);

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
    editHexResource,
    editHexNumber,
  };
}
