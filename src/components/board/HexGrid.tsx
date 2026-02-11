import { BoardState } from '@/types/board';
import { VertexScore } from '@/types/scoring';
import { HexTile } from './HexTile';
import { Vertex } from './Vertex';
import { OceanBorder } from './OceanBorder';
import { hexToPixel, HEX_SIZE } from '@/lib/geometry/pixelConversion';

interface HexGridProps {
  board: BoardState;
  selectedVertex: string | null;
  onVertexClick: (vertexId: string) => void;
  recommendations: VertexScore[];
}

export function HexGrid({ board, selectedVertex, onVertexClick, recommendations }: HexGridProps) {
  const hexArray = Array.from(board.hexes.values());
  const vertexArray = Array.from(board.vertices.values());

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
            <HexTile key={hex.id} hex={hex} />
          ))}

          {/* Render vertices on top */}
          {vertexArray.map(vertex => (
            <Vertex
              key={vertex.id}
              vertex={vertex}
              isSelected={vertex.id === selectedVertex}
              isTopRecommendation={vertex.id === topRecommendation}
              score={vertexScoreMap.get(vertex.id)}
              onClick={() => onVertexClick(vertex.id)}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
