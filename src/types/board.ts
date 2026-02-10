// Core type definitions for Catan board entities

export type ResourceType = 'wheat' | 'wood' | 'brick' | 'ore' | 'sheep' | 'desert';

export type PortType = '3:1' | '2:1:wheat' | '2:1:wood' | '2:1:brick' | '2:1:ore' | '2:1:sheep';

export interface HexTile {
  id: string; // e.g., "hex-0-0" (axial coordinates)
  q: number; // axial coordinate q
  r: number; // axial coordinate r
  resource: ResourceType;
  number: number | null; // 2-12, null for desert
  hasRobber: boolean;
}

export interface Vertex {
  id: string; // e.g., "vertex-0-0-N" (hex q, r, direction)
  q: number;
  r: number;
  direction: 'N' | 'NE' | 'SE' | 'S' | 'SW' | 'NW'; // which corner of the hex
  adjacentHexes: string[]; // IDs of 2-3 adjacent hexes
  adjacentVertices: string[]; // IDs of vertices within 2 edges (for distance rule)
  hasSettlement: boolean;
  playerColor?: string; // if settlement exists
  hasPort?: PortType;
}

export interface Edge {
  id: string;
  vertexA: string;
  vertexB: string;
  hasRoad: boolean;
  playerColor?: string;
}

export interface BoardState {
  hexes: Map<string, HexTile>;
  vertices: Map<string, Vertex>;
  edges: Map<string, Edge>;
  ports: Map<string, PortType>; // vertex ID -> port type
}

export interface GameState {
  board: BoardState;
  placedSettlements: string[]; // vertex IDs
  currentPlayer: number; // 1-4
  phase: 'setup' | 'playing';
  turnOrder: number[]; // snake draft order
}
