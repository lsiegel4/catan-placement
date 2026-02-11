import { HexTile, PortPlacement } from '@/types/board';
import { computeCoastalData } from '@/lib/board/coastalGeometry';
import { getVertexPixelPosition } from '@/lib/board/boardGeneration';

interface OceanBorderProps {
  hexes: HexTile[];
  hexSize: number;
  portPlacements: PortPlacement[];
}

const PORT_COLORS: Record<string, string> = {
  '3:1': '#8B7355',
  '2:1:wheat': '#F5D742',
  '2:1:wood': '#228B22',
  '2:1:brick': '#B84C30',
  '2:1:ore': '#6B7B8C',
  '2:1:sheep': '#90EE90',
};

const PORT_LABELS: Record<string, string> = {
  '3:1': '3:1',
  '2:1:wheat': '2:1',
  '2:1:wood': '2:1',
  '2:1:brick': '2:1',
  '2:1:ore': '2:1',
  '2:1:sheep': '2:1',
};

const PORT_RESOURCE_LABEL: Record<string, string> = {
  '2:1:wheat': 'W',
  '2:1:wood': 'L',
  '2:1:brick': 'B',
  '2:1:ore': 'O',
  '2:1:sheep': 'S',
};

export function OceanBorder({ hexes, hexSize, portPlacements }: OceanBorderProps) {
  const { vertices: coastal, center } = computeCoastalData(hexes, hexSize);
  const { x: centerX, y: centerY } = center;

  // Build coastline path from sorted coastal vertices
  const coastlinePath = coastal
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${v.x.toFixed(2)} ${v.y.toFixed(2)}`)
    .join(' ') + ' Z';

  // Ocean boundary: offset each coastal vertex outward
  const oceanOffset = hexSize * 1.2;
  const oceanVertices = coastal.map(v => {
    const angle = Math.atan2(v.y - centerY, v.x - centerX);
    return {
      x: v.x + oceanOffset * Math.cos(angle),
      y: v.y + oceanOffset * Math.sin(angle),
    };
  });

  const oceanPath = oceanVertices
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${v.x.toFixed(2)} ${v.y.toFixed(2)}`)
    .join(' ') + ' Z';

  return (
    <g className="ocean-border">
      {/* Ocean background */}
      <path d={oceanPath} fill="url(#oceanGradient)" />

      {/* Wave pattern overlay */}
      <path d={oceanPath} fill="url(#wavePattern)" opacity="0.5" />

      {/* Coastline border */}
      <path
        d={coastlinePath}
        fill="none"
        stroke="#D4A574"
        strokeWidth="3"
        strokeDasharray="8 4"
        opacity="0.6"
      />

      {/* Ports from board data */}
      {portPlacements.map((port, idx) => {
        const pos1 = getVertexPixelPosition(port.vertices[0]);
        const pos2 = getVertexPixelPosition(port.vertices[1]);
        if (!pos1 || !pos2) return null;

        // Port circle at midpoint of edge, offset outward
        const midX = (pos1.x + pos2.x) / 2;
        const midY = (pos1.y + pos2.y) / 2;
        const outAngle = Math.atan2(midY - centerY, midX - centerX);
        const portDist = hexSize * 0.7;
        const portX = midX + portDist * Math.cos(outAngle);
        const portY = midY + portDist * Math.sin(outAngle);

        const isGeneric = port.type === '3:1';

        return (
          <g key={idx}>
            {/* Dock lines to the two settlement vertices */}
            <line
              x1={portX} y1={portY} x2={pos1.x} y2={pos1.y}
              stroke="#8B4513" strokeWidth="3"
            />
            <line
              x1={portX} y1={portY} x2={pos2.x} y2={pos2.y}
              stroke="#8B4513" strokeWidth="3"
            />

            {/* Port circle */}
            <circle
              cx={portX} cy={portY}
              r={hexSize * 0.35}
              fill={PORT_COLORS[port.type] || '#8B7355'}
              stroke="#5D4037"
              strokeWidth="2"
            />

            {/* Port label */}
            <text
              x={portX} y={portY}
              textAnchor="middle"
              dominantBaseline="central"
              fill={isGeneric ? '#FFF' : '#333'}
              fontSize="12"
              fontWeight="bold"
              fontFamily="serif"
            >
              {PORT_LABELS[port.type] || '3:1'}
            </text>

            {/* Resource icon for specialized ports */}
            {!isGeneric && PORT_RESOURCE_LABEL[port.type] && (
              <text
                x={portX} y={portY + 14}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#333"
                fontSize="8"
                fontFamily="serif"
              >
                {PORT_RESOURCE_LABEL[port.type]}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
