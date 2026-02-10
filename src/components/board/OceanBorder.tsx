import { HexTile } from '@/types/board';
import { hexToPixel } from '@/lib/geometry/pixelConversion';

interface OceanBorderProps {
  hexes: HexTile[];
  hexSize: number;
}

// Standard Catan port configuration (3-4 player)
const PORT_POSITIONS = [
  { angle: -60, type: '3:1' as const },
  { angle: -30, type: 'wheat' as const },
  { angle: 0, type: 'ore' as const },
  { angle: 30, type: '3:1' as const },
  { angle: 60, type: 'sheep' as const },
  { angle: 120, type: '3:1' as const },
  { angle: 150, type: 'brick' as const },
  { angle: 180, type: 'wood' as const },
  { angle: -120, type: '3:1' as const },
];

const PORT_COLORS: Record<string, string> = {
  '3:1': '#8B7355',
  wheat: '#F5D742',
  wood: '#228B22',
  brick: '#B84C30',
  ore: '#6B7B8C',
  sheep: '#90EE90',
};

const PORT_LABELS: Record<string, string> = {
  '3:1': '3:1',
  wheat: '2:1',
  wood: '2:1',
  brick: '2:1',
  ore: '2:1',
  sheep: '2:1',
};

export function OceanBorder({ hexes, hexSize }: OceanBorderProps) {
  // Calculate center of board
  let centerX = 0;
  let centerY = 0;

  hexes.forEach(hex => {
    const pos = hexToPixel({ q: hex.q, r: hex.r }, hexSize);
    centerX += pos.x;
    centerY += pos.y;
  });

  centerX /= hexes.length;
  centerY /= hexes.length;

  // Calculate the outer boundary points
  const boundaryPoints: { x: number; y: number }[] = [];
  const numPoints = 60;

  // Find the maximum distance from center to any hex corner
  let maxRadius = 0;
  hexes.forEach(hex => {
    const pos = hexToPixel({ q: hex.q, r: hex.r }, hexSize);
    for (let i = 0; i < 6; i++) {
      const angleDeg = 60 * i - 90;
      const angleRad = (Math.PI / 180) * angleDeg;
      const cornerX = pos.x + hexSize * Math.cos(angleRad);
      const cornerY = pos.y + hexSize * Math.sin(angleRad);
      const dist = Math.sqrt(
        Math.pow(cornerX - centerX, 2) + Math.pow(cornerY - centerY, 2)
      );
      maxRadius = Math.max(maxRadius, dist);
    }
  });

  // Create ocean border path (slightly larger than board)
  const oceanRadius = maxRadius + hexSize * 1.2;

  for (let i = 0; i < numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;
    boundaryPoints.push({
      x: centerX + oceanRadius * Math.cos(angle),
      y: centerY + oceanRadius * Math.sin(angle),
    });
  }

  const oceanPath = boundaryPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ') + ' Z';

  // Create inner boundary (edge of land)
  const innerRadius = maxRadius + hexSize * 0.15;
  const innerPoints: { x: number; y: number }[] = [];

  for (let i = 0; i < numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;
    innerPoints.push({
      x: centerX + innerRadius * Math.cos(angle),
      y: centerY + innerRadius * Math.sin(angle),
    });
  }

  const innerPath = innerPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ') + ' Z';

  // Port positions
  const portRadius = maxRadius + hexSize * 0.7;

  return (
    <g className="ocean-border">
      {/* Ocean background */}
      <path
        d={oceanPath}
        fill="url(#oceanGradient)"
      />

      {/* Wave pattern overlay */}
      <path
        d={oceanPath}
        fill="url(#wavePattern)"
        opacity="0.5"
      />

      {/* Inner land border (coastline) */}
      <path
        d={innerPath}
        fill="none"
        stroke="#D4A574"
        strokeWidth="3"
        strokeDasharray="8 4"
        opacity="0.6"
      />

      {/* Ports */}
      {PORT_POSITIONS.map((port, index) => {
        const angleRad = (Math.PI / 180) * port.angle;
        const portX = centerX + portRadius * Math.cos(angleRad);
        const portY = centerY + portRadius * Math.sin(angleRad);

        // Direction pointing toward center
        const towardCenterAngle = Math.atan2(centerY - portY, centerX - portX);

        // Port dock lines
        const dockLength = hexSize * 0.4;
        const dockEndX = portX + dockLength * Math.cos(towardCenterAngle);
        const dockEndY = portY + dockLength * Math.sin(towardCenterAngle);

        return (
          <g key={index}>
            {/* Dock lines */}
            <line
              x1={portX - 8 * Math.cos(towardCenterAngle + Math.PI / 2)}
              y1={portY - 8 * Math.sin(towardCenterAngle + Math.PI / 2)}
              x2={dockEndX - 8 * Math.cos(towardCenterAngle + Math.PI / 2)}
              y2={dockEndY - 8 * Math.sin(towardCenterAngle + Math.PI / 2)}
              stroke="#8B4513"
              strokeWidth="3"
            />
            <line
              x1={portX + 8 * Math.cos(towardCenterAngle + Math.PI / 2)}
              y1={portY + 8 * Math.sin(towardCenterAngle + Math.PI / 2)}
              x2={dockEndX + 8 * Math.cos(towardCenterAngle + Math.PI / 2)}
              y2={dockEndY + 8 * Math.sin(towardCenterAngle + Math.PI / 2)}
              stroke="#8B4513"
              strokeWidth="3"
            />

            {/* Port circle */}
            <circle
              cx={portX}
              cy={portY}
              r={hexSize * 0.35}
              fill={PORT_COLORS[port.type]}
              stroke="#5D4037"
              strokeWidth="2"
            />

            {/* Port label */}
            <text
              x={portX}
              y={portY}
              textAnchor="middle"
              dominantBaseline="central"
              fill={port.type === '3:1' ? '#FFF' : '#333'}
              fontSize="12"
              fontWeight="bold"
              fontFamily="serif"
            >
              {PORT_LABELS[port.type]}
            </text>

            {/* Resource icon for specialized ports */}
            {port.type !== '3:1' && (
              <text
                x={portX}
                y={portY + 14}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#333"
                fontSize="8"
                fontFamily="serif"
              >
                {port.type.charAt(0).toUpperCase()}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
