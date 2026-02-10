import { Vertex as VertexType } from '@/types/board';
import { getVertexPixelPosition } from '@/lib/board/boardGeneration';

interface VertexProps {
  vertex: VertexType;
  isSelected: boolean;
  isTopRecommendation: boolean;
  score?: number;
  onClick: () => void;
}

export function Vertex({ vertex, isSelected, isTopRecommendation, score, onClick }: VertexProps) {
  // Get position from vertex ID
  const position = getVertexPixelPosition(vertex.id);
  if (!position) return null;

  const x = position.x;
  const y = position.y;

  // Determine vertex appearance based on state
  let fill = 'rgba(255, 255, 255, 0.5)';
  let radius = 8;
  let strokeWidth = 2;
  let stroke = 'rgba(0, 0, 0, 0.4)';
  let showPulse = false;
  let glowColor = '';

  if (vertex.hasSettlement) {
    fill = '#e74c3c';
    radius = 12;
    strokeWidth = 2;
    stroke = '#c0392b';
  } else if (isTopRecommendation) {
    fill = '#27ae60';
    radius = 11;
    strokeWidth = 2;
    stroke = '#1e8449';
    showPulse = true;
    glowColor = '#27ae60';
  } else if (isSelected) {
    fill = '#f39c12';
    radius = 11;
    strokeWidth = 2;
    stroke = '#d68910';
    glowColor = '#f39c12';
  } else if (score !== undefined && score > 0) {
    // Color vertices by recommendation strength
    const intensity = Math.min(score / 2.5, 1);
    const green = Math.round(120 + intensity * 80);
    fill = `rgba(39, ${green}, 60, ${0.5 + intensity * 0.4})`;
    radius = 8 + intensity * 2;
    stroke = `rgba(30, ${green - 30}, 50, 0.8)`;
  }

  return (
    <g
      className="cursor-pointer"
      onClick={onClick}
      style={{ pointerEvents: 'all' }}
    >
      {/* Pulse animation for top recommendation */}
      {showPulse && (
        <>
          <circle
            cx={x}
            cy={y}
            r={radius + 6}
            fill="none"
            stroke={glowColor}
            strokeWidth="2"
            opacity="0.6"
          >
            <animate
              attributeName="r"
              values={`${radius + 6};${radius + 16};${radius + 6}`}
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.6;0.1;0.6"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx={x}
            cy={y}
            r={radius + 3}
            fill="none"
            stroke={glowColor}
            strokeWidth="3"
            opacity="0.3"
          />
        </>
      )}

      {/* Glow effect for selected */}
      {isSelected && !isTopRecommendation && (
        <circle
          cx={x}
          cy={y}
          r={radius + 4}
          fill="none"
          stroke={glowColor}
          strokeWidth="3"
          opacity="0.4"
        />
      )}

      {/* Drop shadow */}
      <circle
        cx={x + 1}
        cy={y + 2}
        r={radius}
        fill="rgba(0, 0, 0, 0.3)"
      />

      {/* Main vertex circle */}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        className="transition-all duration-150"
      />

      {/* Inner highlight */}
      {radius >= 8 && !vertex.hasSettlement && (
        <circle
          cx={x - radius * 0.2}
          cy={y - radius * 0.2}
          r={radius * 0.3}
          fill="rgba(255, 255, 255, 0.4)"
        />
      )}

      {/* Settlement house icon */}
      {vertex.hasSettlement && (
        <g transform={`translate(${x}, ${y})`}>
          <polygon
            points="0,-8 8,0 8,7 -8,7 -8,0"
            fill="#f5f0e1"
            stroke="#5c4a37"
            strokeWidth="1.5"
          />
          <rect x="-3" y="1" width="6" height="6" fill="#8b7355" />
        </g>
      )}

      {/* Rank badge for top recommendation */}
      {isTopRecommendation && !vertex.hasSettlement && (
        <g transform={`translate(${x + 10}, ${y - 12})`}>
          <circle r="9" fill="#f1c40f" stroke="#d4ac0d" strokeWidth="1.5" />
          <text
            x="0"
            y="1"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fontWeight="bold"
            fontFamily="Arial, sans-serif"
            fill="#1a1a1a"
          >
            1
          </text>
        </g>
      )}

      {/* Hover hit area (invisible, larger than visual) */}
      <circle
        cx={x}
        cy={y}
        r={radius + 6}
        fill="transparent"
        className="hover:cursor-pointer"
      />
    </g>
  );
}
