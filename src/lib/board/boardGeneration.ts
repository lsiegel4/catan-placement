// Board generation and initialization

import { BoardState, HexTile, Vertex, ResourceType } from '@/types/board';
import { STANDARD_HEX_POSITIONS } from '@/constants/boardLayout';
import { STANDARD_NUMBER_DISTRIBUTION } from '@/constants/numbers';
import {
  createHexId,
  getHexNeighbors,
  VERTEX_DIRECTIONS,
  VertexDirection,
} from '@/lib/geometry/hexCoordinates';
import { hexToPixel, getVertexPixelOffset, HEX_SIZE } from '@/lib/geometry/pixelConversion';

// Shuffle array using Fisher-Yates algorithm
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Check if placing a number at a position would violate the 6/8 adjacency rule
function wouldViolate68Rule(
  hexIndex: number,
  number: number,
  currentAssignments: Map<number, number>, // hexIndex -> number
  hexPositions: typeof STANDARD_HEX_POSITIONS
): boolean {
  // Only check for 6 and 8
  if (number !== 6 && number !== 8) return false;

  const pos = hexPositions[hexIndex];
  const neighbors = getHexNeighbors({ q: pos.q, r: pos.r });

  // Check each neighbor
  for (const neighbor of neighbors) {
    // Find if this neighbor is in our hex positions
    const neighborIndex = hexPositions.findIndex(
      p => p.q === neighbor.q && p.r === neighbor.r
    );

    if (neighborIndex !== -1 && currentAssignments.has(neighborIndex)) {
      const neighborNumber = currentAssignments.get(neighborIndex)!;
      // 6 and 8 can't be adjacent to each other (including 6-6, 8-8, 6-8, 8-6)
      if (neighborNumber === 6 || neighborNumber === 8) {
        return true;
      }
    }
  }

  return false;
}

// Assign numbers to hexes following the 6/8 rule
function assignNumbersWithRule(
  resources: ResourceType[],
  hexPositions: typeof STANDARD_HEX_POSITIONS
): (number | null)[] {
  const numbers = [...STANDARD_NUMBER_DISTRIBUTION];
  const result: (number | null)[] = new Array(hexPositions.length).fill(null);

  // Find indices of non-desert hexes
  const nonDesertIndices: number[] = [];
  resources.forEach((resource, index) => {
    if (resource !== 'desert') {
      nonDesertIndices.push(index);
    }
  });

  // Separate 6s and 8s from other numbers
  const redNumbers = numbers.filter(n => n === 6 || n === 8);
  const otherNumbers = numbers.filter(n => n !== 6 && n !== 8);

  // Try to place 6s and 8s first (they have the most constraints)
  const currentAssignments = new Map<number, number>();
  const shuffledRedNumbers = shuffle(redNumbers);
  const shuffledIndices = shuffle([...nonDesertIndices]);

  // Try to assign 6s and 8s
  for (const num of shuffledRedNumbers) {
    let placed = false;
    for (const idx of shuffledIndices) {
      if (!currentAssignments.has(idx) && !wouldViolate68Rule(idx, num, currentAssignments, hexPositions)) {
        currentAssignments.set(idx, num);
        result[idx] = num;
        placed = true;
        break;
      }
    }

    // If we couldn't place following the rule, try harder with backtracking
    if (!placed) {
      // Find any available spot (relaxed rule - shouldn't happen with standard board)
      for (const idx of shuffledIndices) {
        if (!currentAssignments.has(idx)) {
          currentAssignments.set(idx, num);
          result[idx] = num;
          break;
        }
      }
    }
  }

  // Assign remaining numbers to remaining spots
  const shuffledOtherNumbers = shuffle(otherNumbers);
  let numberIdx = 0;

  for (const idx of nonDesertIndices) {
    if (!currentAssignments.has(idx)) {
      result[idx] = shuffledOtherNumbers[numberIdx];
      numberIdx++;
    }
  }

  return result;
}

// Generate a random standard board
export function generateRandomBoard(): BoardState {
  // Standard resource distribution (3-4 player)
  const resources: ResourceType[] = [
    'desert',
    'wheat', 'wheat', 'wheat', 'wheat',
    'wood', 'wood', 'wood', 'wood',
    'brick', 'brick', 'brick',
    'ore', 'ore', 'ore',
    'sheep', 'sheep', 'sheep', 'sheep',
  ];

  const shuffledResources = shuffle(resources);
  const hexes = new Map<string, HexTile>();

  // Assign numbers following 6/8 rule
  const numberAssignments = assignNumbersWithRule(shuffledResources, STANDARD_HEX_POSITIONS);

  // Create hex tiles
  STANDARD_HEX_POSITIONS.forEach((pos, index) => {
    const resource = shuffledResources[index];
    const hexId = createHexId(pos.q, pos.r);
    const number = numberAssignments[index];

    hexes.set(hexId, {
      id: hexId,
      q: pos.q,
      r: pos.r,
      resource,
      number,
      hasRobber: resource === 'desert',
    });
  });

  // Generate unique vertices (deduplicated)
  const vertices = generateUniqueVertices(hexes);

  return {
    hexes,
    vertices,
    edges: new Map(),
    ports: new Map(),
  };
}

// Round to integer for robust floating point comparison
function roundToInt(n: number): number {
  return Math.round(n);
}

// Create a position key for deduplication using integer coordinates
function getPositionKey(x: number, y: number): string {
  return `${roundToInt(x)}_${roundToInt(y)}`;
}

// Generate unique vertices - each physical corner position has exactly one vertex
function generateUniqueVertices(hexes: Map<string, HexTile>): Map<string, Vertex> {
  const vertices = new Map<string, Vertex>();
  const positionMap = new Map<string, { x: number; y: number; adjacentHexes: string[]; direction: VertexDirection; q: number; r: number }>();

  // First pass: collect all vertex positions and their adjacent hexes
  hexes.forEach(hex => {
    const hexPos = hexToPixel({ q: hex.q, r: hex.r }, HEX_SIZE);
    const hexId = createHexId(hex.q, hex.r);

    VERTEX_DIRECTIONS.forEach(direction => {
      const offset = getVertexPixelOffset(direction, HEX_SIZE);
      const vertexX = hexPos.x + offset.x;
      const vertexY = hexPos.y + offset.y;
      const posKey = getPositionKey(vertexX, vertexY);

      if (positionMap.has(posKey)) {
        // Add this hex to existing vertex's adjacent hexes
        const existing = positionMap.get(posKey)!;
        if (!existing.adjacentHexes.includes(hexId)) {
          existing.adjacentHexes.push(hexId);
        }
      } else {
        // Create new vertex entry
        positionMap.set(posKey, {
          x: vertexX,
          y: vertexY,
          adjacentHexes: [hexId],
          direction,
          q: hex.q,
          r: hex.r,
        });
      }
    });
  });

  // Second pass: create vertex objects from unique positions
  positionMap.forEach((data, posKey) => {
    const vertexId = `vertex_${posKey}`;

    vertices.set(vertexId, {
      id: vertexId,
      q: data.q,
      r: data.r,
      direction: data.direction,
      adjacentHexes: data.adjacentHexes,
      adjacentVertices: [], // Computed below
      hasSettlement: false,
    });
  });

  // Third pass: compute adjacent vertices for distance rule
  const vertexList = Array.from(vertices.values());
  const vertexPositions = new Map<string, { x: number; y: number }>();

  // Cache positions for all vertices
  positionMap.forEach((data, posKey) => {
    const vertexId = `vertex_${posKey}`;
    vertexPositions.set(vertexId, { x: data.x, y: data.y });
  });

  vertexList.forEach(vertex => {
    const vertexPos = vertexPositions.get(vertex.id);
    if (!vertexPos) return;

    // Find vertices that are approximately one edge length away
    const edgeLength = HEX_SIZE;
    const tolerance = edgeLength * 0.3;

    vertexList.forEach(otherVertex => {
      if (vertex.id === otherVertex.id) return;

      const otherPos = vertexPositions.get(otherVertex.id);
      if (!otherPos) return;

      const distance = Math.sqrt(
        Math.pow(vertexPos.x - otherPos.x, 2) +
        Math.pow(vertexPos.y - otherPos.y, 2)
      );

      if (Math.abs(distance - edgeLength) < tolerance) {
        if (!vertex.adjacentVertices.includes(otherVertex.id)) {
          vertex.adjacentVertices.push(otherVertex.id);
        }
      }
    });
  });

  return vertices;
}

export function getVertexPixelPosition(vertexId: string): { x: number; y: number } | null {
  // Parse the position key from vertex ID (format: vertex_X_Y)
  const match = vertexId.match(/^vertex_(-?\d+)_(-?\d+)$/);
  if (!match) return null;
  return {
    x: parseInt(match[1], 10),
    y: parseInt(match[2], 10),
  };
}

// Create an empty board (for manual building)
export function createEmptyBoard(): BoardState {
  const hexes = new Map<string, HexTile>();

  STANDARD_HEX_POSITIONS.forEach(pos => {
    const hexId = createHexId(pos.q, pos.r);
    hexes.set(hexId, {
      id: hexId,
      q: pos.q,
      r: pos.r,
      resource: 'desert',
      number: null,
      hasRobber: false,
    });
  });

  const vertices = generateUniqueVertices(hexes);

  return {
    hexes,
    vertices,
    edges: new Map(),
    ports: new Map(),
  };
}
