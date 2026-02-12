// Board generation and initialization

import { BoardState, HexTile, Vertex, ResourceType, PortType, PortPlacement } from '@/types/board';
import { STANDARD_HEX_POSITIONS, BALANCED_BOARD_LAYOUT } from '@/constants/boardLayout';
import { STANDARD_NUMBER_DISTRIBUTION } from '@/constants/numbers';
import {
  createHexId,
  getHexNeighbors,
  VERTEX_DIRECTIONS,
  VertexDirection,
} from '@/lib/geometry/hexCoordinates';
import { hexToPixel, getVertexPixelOffset, HEX_SIZE } from '@/lib/geometry/pixelConversion';
import { computeCoastalData, PORT_EDGE_INDICES } from './coastalGeometry';

// Shuffle array using Fisher-Yates algorithm
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Check whether a full hexIndex→number assignment satisfies all placement rules:
//   1. No two adjacent hexes may share the same number.
//   2. No 6 adjacent to an 8 (the classic 6/8 rule).
//   3. No 2 adjacent to a 12 (both are 1-pip dead weight next to each other).
function isValidNumberAssignment(
  assignments: Map<number, number>,
  hexPositions: typeof STANDARD_HEX_POSITIONS
): boolean {
  for (const [idx, num] of assignments) {
    const pos = hexPositions[idx];

    for (const neighbor of getHexNeighbors({ q: pos.q, r: pos.r })) {
      const neighborIdx = hexPositions.findIndex(
        p => p.q === neighbor.q && p.r === neighbor.r
      );
      if (neighborIdx === -1 || !assignments.has(neighborIdx)) continue;
      const neighborNum = assignments.get(neighborIdx)!;

      // Rule 1: same number adjacent
      if (neighborNum === num) return false;

      // Rule 2: 6/8 adjacent to each other
      if ((num === 6 || num === 8) && (neighborNum === 6 || neighborNum === 8)) return false;

      // Rule 3: 2 adjacent to 12
      if ((num === 2 && neighborNum === 12) || (num === 12 && neighborNum === 2)) return false;
    }
  }
  return true;
}

// Assign numbers to hexes satisfying both the no-duplicate-adjacent rule and the
// 6/8 rule.  Uses a shuffle-and-validate loop: most random arrangements fail
// (~7% pass on a standard board), so we retry until one succeeds.
function assignNumbersWithRule(
  resources: ResourceType[],
  hexPositions: typeof STANDARD_HEX_POSITIONS
): (number | null)[] {
  const numbers = [...STANDARD_NUMBER_DISTRIBUTION];
  const result: (number | null)[] = new Array(hexPositions.length).fill(null);

  const nonDesertIndices: number[] = [];
  resources.forEach((resource, index) => {
    if (resource !== 'desert') nonDesertIndices.push(index);
  });

  for (let attempt = 0; attempt < 500; attempt++) {
    const shuffledNumbers = shuffle([...numbers]);
    const shuffledIndices = shuffle([...nonDesertIndices]);

    const assignments = new Map<number, number>();
    for (let i = 0; i < shuffledIndices.length; i++) {
      assignments.set(shuffledIndices[i], shuffledNumbers[i]);
    }

    if (isValidNumberAssignment(assignments, hexPositions)) {
      assignments.forEach((num, idx) => { result[idx] = num; });
      return result;
    }
  }

  // Safety fallback (should never be reached on a standard 19-hex board):
  // assign randomly without guarantees.
  const shuffledNumbers = shuffle([...numbers]);
  nonDesertIndices.forEach((idx, i) => { result[idx] = shuffledNumbers[i]; });
  return result;
}

// Standard port type distribution (randomized to positions each game)
const PORT_TYPES: PortType[] = [
  '3:1', '3:1', '3:1', '3:1',
  '2:1:wheat', '2:1:wood', '2:1:brick', '2:1:ore', '2:1:sheep',
];

// Assign randomized ports to coastal edges
function assignPorts(hexes: Map<string, HexTile>): {
  portPlacements: PortPlacement[];
  ports: Map<string, PortType>;
} {
  const { vertices: coastal } = computeCoastalData(hexes, HEX_SIZE);
  const n = coastal.length;
  const shuffledTypes = shuffle(PORT_TYPES);

  const portPlacements: PortPlacement[] = [];
  const ports = new Map<string, PortType>();

  PORT_EDGE_INDICES.forEach((edgeIdx, i) => {
    const v1Key = coastal[edgeIdx % n].key;
    const v2Key = coastal[(edgeIdx + 1) % n].key;
    const v1Id = `vertex_${v1Key}`;
    const v2Id = `vertex_${v2Key}`;
    const type = shuffledTypes[i];

    portPlacements.push({ type, vertices: [v1Id, v2Id] });
    ports.set(v1Id, type);
    ports.set(v2Id, type);
  });

  return { portPlacements, ports };
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

  // Assign randomized ports
  const { portPlacements, ports } = assignPorts(hexes);

  // Mark vertices that have port access
  ports.forEach((portType, vertexId) => {
    const vertex = vertices.get(vertexId);
    if (vertex) {
      vertex.hasPort = portType;
    }
  });

  return {
    hexes,
    vertices,
    edges: new Map(),
    ports,
    portPlacements,
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

// Generate the official Catan recommended beginner setup (fixed layout)
export function generateBalancedBoard(): BoardState {
  const hexes = new Map<string, HexTile>();

  STANDARD_HEX_POSITIONS.forEach((pos, index) => {
    const { resource, number } = BALANCED_BOARD_LAYOUT[index];
    const hexId = createHexId(pos.q, pos.r);

    hexes.set(hexId, {
      id: hexId,
      q: pos.q,
      r: pos.r,
      resource,
      number,
      hasRobber: resource === 'desert',
    });
  });

  const vertices = generateUniqueVertices(hexes);
  const { portPlacements, ports } = assignPorts(hexes);

  ports.forEach((portType, vertexId) => {
    const vertex = vertices.get(vertexId);
    if (vertex) {
      vertex.hasPort = portType;
    }
  });

  return {
    hexes,
    vertices,
    edges: new Map(),
    ports,
    portPlacements,
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
    portPlacements: [],
  };
}
