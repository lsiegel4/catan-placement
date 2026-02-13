import { useState, useCallback, useMemo } from 'react';
import { BoardState } from '@/types/board';
import { generateRandomBoard, generateBalancedBoard, createEmptyBoard } from '@/lib/board/boardGeneration';
import {
  placeSettlement as doPlace,
  removeSettlement as doRemove,
  isValidPlacement,
} from '@/lib/game/placementRules';
import { PLAYER_COLORS } from '@/constants/players';
import { ResourceType } from '@/types/board';

export type BoardMode = 'random' | 'balanced' | 'manual';
export type SetupPhase = 'settlement' | 'road';

const RESOURCE_CYCLE: ResourceType[] = ['desert', 'wheat', 'wood', 'brick', 'ore', 'sheep'];
const NUMBER_CYCLE: (number | null)[] = [null, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12];

// Generate snake draft indices: [0,1,...,n-1, n-1,...,1,0]
function buildSnakeDraft(playerCount: number): number[] {
  const forward = Array.from({ length: playerCount }, (_, i) => i);
  return [...forward, ...forward.slice().reverse()];
}

// Find the first unfilled settlement slot in the snake draft based on actual board state.
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
    if (placed <= seen) return i;
    occurrenceSoFar[playerIndex] = seen + 1;
  }
  return snakeDraft.length;
}

export interface UseGameState {
  board: BoardState;
  boardMode: BoardMode;
  playerCount: number;
  setupTurnIndex: number;
  snakeDraft: number[];
  currentPlayerIndex: number;
  activeColor: string;
  setupPhase: SetupPhase;
  pendingRoadFor: string | null;
  isSetupComplete: boolean;
  settlementCounts: Record<string, number>;
  placeSettlement: (vertexId: string) => void;
  placeRoad: (toVertexId: string) => void;
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
  // Tracks which settlement vertex is waiting for its road placement.
  const [pendingRoadFor, setPendingRoadFor] = useState<string | null>(null);

  const snakeDraft = useMemo(() => buildSnakeDraft(playerCount), [playerCount]);
  const totalSetupTurns = snakeDraft.length;

  const setupTurnIndex = useMemo(
    () => computeTurnIndex(snakeDraft, board),
    [snakeDraft, board]
  );

  // Setup is only complete once all settlements AND all roads are placed.
  const isSetupComplete = setupTurnIndex >= totalSetupTurns && pendingRoadFor === null;

  const setupPhase: SetupPhase = pendingRoadFor !== null ? 'road' : 'settlement';

  // Active player: the one who placed pendingRoadFor during road phase,
  // otherwise the next settlement player.
  const currentPlayerIndex = (() => {
    if (pendingRoadFor !== null) {
      const color = board.vertices.get(pendingRoadFor)?.playerColor;
      const idx = PLAYER_COLORS.findIndex(p => p.id === color);
      return idx >= 0 ? idx : snakeDraft[0];
    }
    if (setupTurnIndex >= totalSetupTurns) return snakeDraft[totalSetupTurns - 1];
    return snakeDraft[setupTurnIndex];
  })();

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

  // Place a settlement. On success, locks the turn into road-placement phase
  // for the same player (they must immediately place a road).
  const placeSettlement = useCallback((vertexId: string) => {
    if (pendingRoadFor !== null) return; // must place road first

    const turnIdx = computeTurnIndex(snakeDraft, board);
    if (turnIdx >= totalSetupTurns) return;

    const color = PLAYER_COLORS[snakeDraft[turnIdx]]?.id ?? 'red';
    if (!isValidPlacement(vertexId, board)) return;

    const newBoard = doPlace(vertexId, board, color);
    if (newBoard !== board) {
      setBoard(newBoard);
      setPendingRoadFor(vertexId);
    }
  }, [snakeDraft, totalSetupTurns, pendingRoadFor, board]);

  // Place a road from the pending settlement to an adjacent vertex.
  const placeRoad = useCallback((toVertexId: string) => {
    if (!pendingRoadFor) return;

    const fromVertex = board.vertices.get(pendingRoadFor);
    if (!fromVertex) return;

    // Must be directly adjacent to the settlement.
    if (!fromVertex.adjacentVertices.includes(toVertexId)) return;

    const playerColor = fromVertex.playerColor ?? 'red';
    const [a, b] = [pendingRoadFor, toVertexId].sort();
    const edgeId = `road_${a}_${b}`;

    if (board.edges.has(edgeId)) return;

    const newEdges = new Map(board.edges);
    newEdges.set(edgeId, {
      id: edgeId,
      vertexA: pendingRoadFor,
      vertexB: toVertexId,
      hasRoad: true,
      playerColor,
    });

    setBoard(prev => ({ ...prev, edges: newEdges }));
    setPendingRoadFor(null);
  }, [pendingRoadFor, board]);

  // Remove a settlement and its associated road (if placed), reset road-pending state.
  const removeSettlement = useCallback((vertexId: string) => {
    setBoard(prev => {
      const newBoard = doRemove(vertexId, prev);
      const newEdges = new Map(newBoard.edges);
      newEdges.forEach((edge, id) => {
        if (edge.vertexA === vertexId || edge.vertexB === vertexId) {
          newEdges.delete(id);
        }
      });
      return { ...newBoard, edges: newEdges };
    });
    if (pendingRoadFor === vertexId) {
      setPendingRoadFor(null);
    }
  }, [pendingRoadFor]);

  const clearAll = useCallback(() => {
    setBoard(prev => {
      const newVertices = new Map(prev.vertices);
      newVertices.forEach((v, id) => {
        if (v.hasSettlement) {
          newVertices.set(id, { ...v, hasSettlement: false, playerColor: undefined });
        }
      });
      return { ...prev, vertices: newVertices, edges: new Map() };
    });
    setPendingRoadFor(null);
  }, []);

  const setPlayerCount = useCallback((n: number) => {
    setPlayerCountState(n);
    setBoard(boardMode === 'balanced' ? generateBalancedBoard() : boardMode === 'manual' ? createEmptyBoard() : generateRandomBoard());
    setPendingRoadFor(null);
  }, [boardMode]);

  const setBoardMode = useCallback((mode: BoardMode) => {
    setBoardModeState(mode);
    setBoard(mode === 'balanced' ? generateBalancedBoard() : mode === 'manual' ? createEmptyBoard() : generateRandomBoard());
    setPendingRoadFor(null);
  }, []);

  const generateNewBoard = useCallback(() => {
    setBoard(boardMode === 'balanced' ? generateBalancedBoard() : boardMode === 'manual' ? createEmptyBoard() : generateRandomBoard());
    setPendingRoadFor(null);
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
    setupPhase,
    pendingRoadFor,
    isSetupComplete,
    settlementCounts,
    placeSettlement,
    placeRoad,
    removeSettlement,
    clearAll,
    setBoardMode,
    setPlayerCount,
    generateNewBoard,
    editHexResource,
    editHexNumber,
  };
}
