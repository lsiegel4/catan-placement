import { HexTile as HexTileType, ResourceType } from '@/types/board';
import { hexToPixel, getHexagonPoints, HEX_SIZE } from '@/lib/geometry/pixelConversion';
import { NumberToken } from './NumberToken';

// Colonist.io-style vibrant resource colors with gradients
const RESOURCE_STYLES: Record<ResourceType, {
  fill: string;
  gradientStart: string;
  gradientEnd: string;
  stroke: string;
  pattern: 'wheat' | 'forest' | 'hills' | 'mountains' | 'pasture' | 'desert';
}> = {
  wheat: {
    fill: '#f7c948',
    gradientStart: '#fad961',
    gradientEnd: '#d4a012',
    stroke: '#b8860b',
    pattern: 'wheat',
  },
  wood: {
    fill: '#228b22',
    gradientStart: '#32a852',
    gradientEnd: '#1a5f1a',
    stroke: '#0d4d0d',
    pattern: 'forest',
  },
  brick: {
    fill: '#cd5c5c',
    gradientStart: '#e07a5f',
    gradientEnd: '#9c3d3d',
    stroke: '#8b0000',
    pattern: 'hills',
  },
  ore: {
    fill: '#708090',
    gradientStart: '#8899aa',
    gradientEnd: '#4a5568',
    stroke: '#2d3748',
    pattern: 'mountains',
  },
  sheep: {
    fill: '#90ee90',
    gradientStart: '#a8f0a8',
    gradientEnd: '#68c468',
    stroke: '#228b22',
    pattern: 'pasture',
  },
  desert: {
    fill: '#deb887',
    gradientStart: '#edd9b5',
    gradientEnd: '#c4a35a',
    stroke: '#a0825a',
    pattern: 'desert',
  },
};

interface HexTileProps {
  hex: HexTileType;
}

export function HexTile({ hex }: HexTileProps) {
  const position = hexToPixel({ q: hex.q, r: hex.r }, HEX_SIZE);
  const points = getHexagonPoints(HEX_SIZE);
  const innerPoints = getHexagonPoints(HEX_SIZE - 3);
  const style = RESOURCE_STYLES[hex.resource];
  const gradientId = `gradient-${hex.id}`;
  const patternId = `pattern-${hex.id}`;

  return (
    <g transform={`translate(${position.x}, ${position.y})`}>
      {/* Definitions for this hex */}
      <defs>
        {/* Radial gradient for 3D effect */}
        <radialGradient id={gradientId} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor={style.gradientStart} />
          <stop offset="100%" stopColor={style.gradientEnd} />
        </radialGradient>

        {/* Pattern overlays */}
        {style.pattern === 'wheat' && (
          <pattern id={patternId} width="12" height="20" patternUnits="userSpaceOnUse">
            <path d="M6 0 L6 20" stroke="#c4960f" strokeWidth="1.5" opacity="0.4" />
            <ellipse cx="6" cy="5" rx="2" ry="4" fill="#d4a012" opacity="0.5" />
            <ellipse cx="6" cy="15" rx="2" ry="4" fill="#d4a012" opacity="0.5" />
          </pattern>
        )}
        {style.pattern === 'forest' && (
          <pattern id={patternId} width="20" height="20" patternUnits="userSpaceOnUse">
            <polygon points="10,2 6,12 14,12" fill="#1a5f1a" opacity="0.5" />
            <polygon points="3,10 0,18 6,18" fill="#0d4d0d" opacity="0.4" />
            <polygon points="17,10 14,18 20,18" fill="#0d4d0d" opacity="0.4" />
          </pattern>
        )}
        {style.pattern === 'hills' && (
          <pattern id={patternId} width="24" height="16" patternUnits="userSpaceOnUse">
            <rect x="2" y="8" width="8" height="5" rx="1" fill="#8b4444" opacity="0.4" />
            <rect x="12" y="4" width="10" height="6" rx="1" fill="#9c3d3d" opacity="0.3" />
            <rect x="6" y="2" width="8" height="5" rx="1" fill="#b05555" opacity="0.3" />
          </pattern>
        )}
        {style.pattern === 'mountains' && (
          <pattern id={patternId} width="30" height="24" patternUnits="userSpaceOnUse">
            <polygon points="15,0 5,20 25,20" fill="#4a5568" opacity="0.4" />
            <polygon points="8,8 0,24 16,24" fill="#2d3748" opacity="0.3" />
            <polygon points="22,8 14,24 30,24" fill="#2d3748" opacity="0.3" />
            <polygon points="15,0 12,6 18,6" fill="#a0aec0" opacity="0.5" />
          </pattern>
        )}
        {style.pattern === 'pasture' && (
          <pattern id={patternId} width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="10" r="4" fill="#ffffff" opacity="0.3" />
            <circle cx="15" cy="6" r="3" fill="#ffffff" opacity="0.25" />
            <circle cx="12" cy="16" r="3.5" fill="#ffffff" opacity="0.25" />
          </pattern>
        )}
        {style.pattern === 'desert' && (
          <pattern id={patternId} width="30" height="15" patternUnits="userSpaceOnUse">
            <path d="M0 12 Q7 6 15 12 Q23 18 30 12" fill="none" stroke="#a0825a" strokeWidth="1.5" opacity="0.3" />
            <path d="M0 6 Q7 0 15 6 Q23 12 30 6" fill="none" stroke="#a0825a" strokeWidth="1" opacity="0.2" />
          </pattern>
        )}
      </defs>

      {/* Drop shadow */}
      <polygon
        points={points}
        fill="rgba(0,0,0,0.2)"
        transform="translate(2, 3)"
      />

      {/* Main hex with gradient */}
      <polygon
        points={points}
        fill={`url(#${gradientId})`}
        stroke={style.stroke}
        strokeWidth="2"
      />

      {/* Pattern overlay */}
      <polygon
        points={innerPoints}
        fill={`url(#${patternId})`}
      />

      {/* Inner highlight edge */}
      <polygon
        points={getHexagonPoints(HEX_SIZE - 2)}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />

      {/* Number token */}
      {hex.number !== null && (
        <NumberToken number={hex.number} />
      )}

      {/* Robber for desert */}
      {hex.hasRobber && hex.resource === 'desert' && (
        <g>
          <circle cx="0" cy="0" r="14" fill="rgba(0,0,0,0.7)" />
          <text x="0" y="5" textAnchor="middle" fontSize="18">
            🏴‍☠️
          </text>
        </g>
      )}
    </g>
  );
}
