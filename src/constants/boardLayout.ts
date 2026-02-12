// Standard 3-4 player board hex positions using axial coordinates

import { ResourceType } from '@/types/board';

export interface HexPosition {
  q: number;
  r: number;
}

// Official Catan beginner setup — fixed resource + number per position index
// Indices correspond 1:1 with STANDARD_HEX_POSITIONS
export interface BalancedHexConfig {
  resource: ResourceType;
  number: number | null;
}

// Official recommended setup (Catan base game rulebook)
// Resources: ore×3, wheat×4, wood×4, brick×3, sheep×4, desert×1
// Numbers: alphabetical clockwise spiral A=5, B=2, C=6, D=3, E=8, F=10, G=9, H=12,
//          I=11, J=4, K=8, L=10, M=9, N=4, O=5, P=6, Q=3, R=11
export const BALANCED_BOARD_LAYOUT: BalancedHexConfig[] = [
  // Index 0: (0,0)    center
  { resource: 'desert', number: null },
  // Index 1: (1,0)    inner ring
  { resource: 'wood',   number: 4  },
  // Index 2: (1,-1)
  { resource: 'sheep',  number: 9  },
  // Index 3: (0,-1)
  { resource: 'sheep',  number: 11 },
  // Index 4: (-1,0)
  { resource: 'wood',   number: 3  },
  // Index 5: (-1,1)
  { resource: 'sheep',  number: 6  },
  // Index 6: (0,1)
  { resource: 'brick',  number: 5  },
  // Index 7: (2,0)    outer ring
  { resource: 'wheat',  number: 8  },
  // Index 8: (2,-1)
  { resource: 'ore',    number: 3  },
  // Index 9: (2,-2)
  { resource: 'wood',   number: 6  },
  // Index 10: (1,-2)
  { resource: 'wheat',  number: 2  },
  // Index 11: (0,-2)
  { resource: 'ore',    number: 5  },
  // Index 12: (-1,-1)
  { resource: 'brick',  number: 10 },
  // Index 13: (-2,0)
  { resource: 'wheat',  number: 8  },
  // Index 14: (-2,1)
  { resource: 'ore',    number: 4  },
  // Index 15: (-2,2)
  { resource: 'wheat',  number: 11 },
  // Index 16: (-1,2)
  { resource: 'wood',   number: 12 },
  // Index 17: (0,2)
  { resource: 'sheep',  number: 9  },
  // Index 18: (1,1)
  { resource: 'brick',  number: 10 },
];

// Standard 19-hex board layout (pointy-top orientation)
// Center hex is at (0, 0)
export const STANDARD_HEX_POSITIONS: HexPosition[] = [
  // Center
  { q: 0, r: 0 },

  // Inner ring (6 hexes)
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },

  // Outer ring (12 hexes)
  { q: 2, r: 0 },
  { q: 2, r: -1 },
  { q: 2, r: -2 },
  { q: 1, r: -2 },
  { q: 0, r: -2 },
  { q: -1, r: -1 },
  { q: -2, r: 0 },
  { q: -2, r: 1 },
  { q: -2, r: 2 },
  { q: -1, r: 2 },
  { q: 0, r: 2 },
  { q: 1, r: 1 },
];
