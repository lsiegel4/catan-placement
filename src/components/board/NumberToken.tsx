import { NUMBER_DOTS } from '@/constants/numbers';

interface NumberTokenProps {
  number: number;
}

export function NumberToken({ number }: NumberTokenProps) {
  const dots = NUMBER_DOTS[number] || 0;

  // Colonist.io style: red for 6/8, black for others
  const isHighProbability = number === 6 || number === 8;
  const textColor = isHighProbability ? '#c41e3a' : '#1a1a1a';

  return (
    <g>
      {/* Outer shadow */}
      <circle
        cx="1"
        cy="2"
        r="16"
        fill="rgba(0,0,0,0.3)"
      />

      {/* Token background - cream/tan color like colonist.io */}
      <circle
        cx="0"
        cy="0"
        r="16"
        fill="#f5f0e1"
        stroke="#8b7355"
        strokeWidth="2"
      />

      {/* Number */}
      <text
        x="0"
        y={dots > 0 ? "-2" : "1"}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={isHighProbability ? "18" : "16"}
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
        fill={textColor}
      >
        {number}
      </text>

      {/* Probability dots */}
      {dots > 0 && (
        <g transform="translate(0, 9)">
          {Array.from({ length: dots }).map((_, i) => {
            const spacing = 5;
            const startX = -((dots - 1) * spacing) / 2;
            return (
              <circle
                key={i}
                cx={startX + i * spacing}
                cy="0"
                r="2"
                fill={textColor}
              />
            );
          })}
        </g>
      )}
    </g>
  );
}
