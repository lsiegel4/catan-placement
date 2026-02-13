import { BoardState, Vertex as VertexType } from '@/types/board';
import { VertexScore, RoadSuggestion } from '@/types/scoring';
import { HexTile } from './HexTile';
import { Vertex } from './Vertex';
import { OceanBorder } from './OceanBorder';
import { hexToPixel, HEX_SIZE } from '@/lib/geometry/pixelConversion';
import { isValidPlacement, } from '@/lib/game/placementRules';
import { getVertexPixelPosition } from '@/lib/board/boardGeneration';
import { PLAYER_COLORS } from '@/constants/players';

const PLAYER_HEX: Record<string, string> = Object.fromEntries(
  PLAYER_COLORS.map(p => [p.id, p.color])
);

interface HexGridProps {
  board: BoardState;
  selectedVertex: string | null;
  onVertexClick: (vertexId: string) => void;
  recommendations: VertexScore[];
  isSetupComplete: boolean;
  isEditing: boolean;
  onEditHexResource: (hexId: string) => void;
  onEditHexNumber: (hexId: string) => void;
  roadSuggestions?: RoadSuggestion[];
  focusedRoadKey?: string | null;
  pendingRoadFor?: string | null;
  activeColor?: string;
}

export function HexGrid({ board, selectedVertex, onVertexClick, recommendations, isSetupComplete, isEditing, onEditHexResource, onEditHexNumber, roadSuggestions = [], focusedRoadKey = null, pendingRoadFor = null, activeColor = 'red' }: HexGridProps) {
  const hexArray = Array.from(board.hexes.values());
  const allVertices = Array.from(board.vertices.values());

  // Pre-compute road-phase adjacency set once.
  const roadTargetSet: Set<string> = pendingRoadFor
    ? new Set(board.vertices.get(pendingRoadFor)?.adjacentVertices ?? [])
    : new Set();

  const activeColorHex = PLAYER_HEX[activeColor] ?? '#888';

  // Map: road endpoint vertex → rank (1-based) within its settlement's suggestions.
  // Used to style the top road target differently from alternatives.
  const roadRankMap = new Map<string, number>();
  if (pendingRoadFor) {
    roadSuggestions.forEach((s, i) => {
      if (!roadRankMap.has(s.toVertex)) {
        roadRankMap.set(s.toVertex, i + 1);
      }
    });
  }

  // Ghost vertices: the best target expansion spot for the focused road suggestion.
  const focusedSuggestion = focusedRoadKey
    ? roadSuggestions.find(r => `${r.fromVertex}|${r.toVertex}` === focusedRoadKey)
    : null;
  const ghostVertexSet = new Set<string>(focusedSuggestion?.targetVertices ?? []);

  // Determine which vertices to render:
  // - Always show placed settlements
  // - Road phase: show vertices adjacent to the pending settlement (road endpoints)
  // - Hide everything once setup is complete (cleaner board view)
  // - Otherwise only show vertices that are valid placement spots (or the selected one)
  const shouldShow = (v: VertexType): boolean => {
    if (v.hasSettlement) return true;
    if (isEditing) return false;
    if (ghostVertexSet.has(v.id)) return true; // always show focused road targets
    if (pendingRoadFor) return roadTargetSet.has(v.id); // road phase
    if (isSetupComplete) return false;
    return isValidPlacement(v.id, board) || v.id === selectedVertex;
  };

  const vertexArray = allVertices.filter(shouldShow);

  // Calculate board bounds for centering
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  hexArray.forEach(hex => {
    const pos = hexToPixel({ q: hex.q, r: hex.r }, HEX_SIZE);
    minX = Math.min(minX, pos.x - HEX_SIZE * 1.5);
    maxX = Math.max(maxX, pos.x + HEX_SIZE * 1.5);
    minY = Math.min(minY, pos.y - HEX_SIZE * 1.5);
    maxY = Math.max(maxY, pos.y + HEX_SIZE * 1.5);
  });

  // Add extra padding for ocean border
  const oceanPadding = HEX_SIZE * 1.2;
  const padding = 20;
  const viewBoxWidth = (maxX - minX) + (oceanPadding + padding) * 2;
  const viewBoxHeight = (maxY - minY) + (oceanPadding + padding) * 2;
  const offsetX = -minX + oceanPadding + padding;
  const offsetY = -minY + oceanPadding + padding;

  // Create a map of vertex scores for quick lookup
  const vertexScoreMap = new Map(
    recommendations.map(rec => [rec.vertexId, rec.totalScore])
  );

  // Top recommendation vertex for highlighting
  const topRecommendation = recommendations[0]?.vertexId;

  return (
    <div className="w-full flex items-center justify-center">
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-auto"
        style={{ maxHeight: '70vh', maxWidth: '100%' }}
      >
        <defs>
          {/* Ocean gradient */}
          <radialGradient id="oceanGradient" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#4a90a4" />
            <stop offset="100%" stopColor="#2c5f7c" />
          </radialGradient>

          {/* Wave pattern */}
          <pattern id="wavePattern" width="60" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M0 10 Q15 0 30 10 Q45 20 60 10"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1.5"
            />
          </pattern>
        </defs>

        <g transform={`translate(${offsetX}, ${offsetY})`}>
          {/* Ocean background with border */}
          <OceanBorder hexes={hexArray} hexSize={HEX_SIZE} portPlacements={board.portPlacements} />

          {/* Render hexes */}
          {hexArray.map(hex => (
            <HexTile
              key={hex.id}
              hex={hex}
              isEditing={isEditing}
              onResourceClick={() => onEditHexResource(hex.id)}
              onNumberClick={e => { e.stopPropagation(); onEditHexNumber(hex.id); }}
            />
          ))}

          {/* Placed roads (solid lines from board.edges) */}
          {Array.from(board.edges.values()).map(edge => {
            const from = getVertexPixelPosition(edge.vertexA);
            const to = getVertexPixelPosition(edge.vertexB);
            if (!from || !to) return null;
            const color = PLAYER_HEX[edge.playerColor ?? 'red'] ?? '#888';
            return (
              <line
                key={edge.id}
                x1={from.x} y1={from.y}
                x2={to.x} y2={to.y}
                stroke={color}
                strokeWidth={6}
                strokeLinecap="round"
                opacity={0.9}
              />
            );
          })}

          {/* Road suggestion lines — shown after setup.
              Top suggestion per settlement: full opacity.
              Alternatives: very faint. Focused: bright solid. */}
          {isSetupComplete && (() => {
            // Determine which toVertex is the #1 suggestion for each settlement.
            const topPerSettlement = new Set<string>();
            const seen = new Set<string>();
            roadSuggestions.forEach(r => {
              if (!seen.has(r.fromVertex)) {
                seen.add(r.fromVertex);
                topPerSettlement.add(`${r.fromVertex}|${r.toVertex}`);
              }
            });

            return roadSuggestions.map(road => {
              const from = getVertexPixelPosition(road.fromVertex);
              const to = getVertexPixelPosition(road.toVertex);
              if (!from || !to) return null;
              const key = `${road.fromVertex}|${road.toVertex}`;
              const isFocused = focusedRoadKey === key;
              const isTop = topPerSettlement.has(key);
              const color = PLAYER_HEX[road.playerColor] ?? '#888';
              const opacity = isFocused ? 0.95 : isTop ? 0.6 : 0.18;
              const strokeWidth = isFocused ? 5 : isTop ? 3.5 : 2.5;
              const dashArray = isFocused ? '9,4' : '6,5';
              return (
                <line
                  key={key}
                  x1={from.x} y1={from.y}
                  x2={to.x} y2={to.y}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={dashArray}
                  strokeLinecap="round"
                  opacity={opacity}
                />
              );
            });
          })()}

          {/* Render vertices on top */}
          {vertexArray.map(vertex => (
            <Vertex
              key={vertex.id}
              vertex={vertex}
              isSelected={vertex.id === selectedVertex}
              isTopRecommendation={vertex.id === topRecommendation && !pendingRoadFor}
              score={pendingRoadFor ? undefined : vertexScoreMap.get(vertex.id)}
              onClick={() => onVertexClick(vertex.id)}
              isRoadTarget={pendingRoadFor !== null && roadTargetSet.has(vertex.id)}
              roadTargetColor={activeColorHex}
              roadRank={roadRankMap.get(vertex.id)}
              isGhost={ghostVertexSet.has(vertex.id) && !vertex.hasSettlement}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
