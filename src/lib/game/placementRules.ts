// Settlement placement rule validation

import { BoardState } from '@/types/board';

// Check if a settlement can be placed at a vertex (distance rule)
export function isValidPlacement(vertexId: string, board: BoardState): boolean {
  const vertex = board.vertices.get(vertexId);
  if (!vertex) return false;

  // Check if vertex already has settlement
  if (vertex.hasSettlement) return false;

  // Check distance rule: no settlements within 2 edges (adjacent vertices)
  for (const adjVertexId of vertex.adjacentVertices) {
    const adjVertex = board.vertices.get(adjVertexId);
    if (adjVertex?.hasSettlement) {
      return false;
    }
  }

  return true;
}

// Get all valid placement vertices
export function getValidPlacements(board: BoardState): string[] {
  const validVertices: string[] = [];

  board.vertices.forEach((_vertex, vertexId) => {
    if (isValidPlacement(vertexId, board)) {
      validVertices.push(vertexId);
    }
  });

  return validVertices;
}

// Place a settlement at a vertex
export function placeSettlement(
  vertexId: string,
  board: BoardState,
  playerColor: string = 'red'
): BoardState {
  const vertex = board.vertices.get(vertexId);
  if (!vertex || !isValidPlacement(vertexId, board)) {
    return board;
  }

  // Create new vertices map with updated vertex
  const newVertices = new Map(board.vertices);
  newVertices.set(vertexId, {
    ...vertex,
    hasSettlement: true,
    playerColor,
  });

  return {
    ...board,
    vertices: newVertices,
  };
}

// Remove a settlement from a vertex
export function removeSettlement(vertexId: string, board: BoardState): BoardState {
  const vertex = board.vertices.get(vertexId);
  if (!vertex) return board;

  const newVertices = new Map(board.vertices);
  newVertices.set(vertexId, {
    ...vertex,
    hasSettlement: false,
    playerColor: undefined,
  });

  return {
    ...board,
    vertices: newVertices,
  };
}
