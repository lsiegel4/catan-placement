# Catan Settlement Placement Advisor

An intelligent web application that helps Settlers of Catan players find optimal settlement placements during the initial game setup phase.

## Features

- **Smart Recommendations**: Heuristic scoring algorithm analyzing probability, resource diversity, and number quality
- **Visual Board**: Interactive hex grid matching the colonist.io aesthetic
- **Dual Explanation Modes**: Beginner-friendly tips and advanced statistical breakdowns
- **Random Board Generation**: Generate valid random boards matching standard Catan distribution
- **Real-time Analysis**: Instant recommendations as you explore different placements

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The app will be available at `http://localhost:5173` (or the next available port).

## How to Use

1. **View the Board**: The app starts with a randomly generated standard 3-4 player Catan board
2. **See Recommendations**: The right panel shows the top 5 recommended settlement placements
3. **Click Vertices**: Click on any vertex (corner where 3 hexes meet) to see detailed analysis
4. **Toggle Modes**: Switch between Beginner and Advanced explanation modes
5. **Randomize**: Generate a new random board with the "Randomize Board" button

## Scoring Algorithm

The recommendation engine uses a multi-factor heuristic scoring system:

- **Probability Score**: Expected resource production based on dice roll probabilities
- **Diversity Score**: Bonus for access to multiple resource types
- **Number Quality Score**: Preference for high-probability numbers (6, 8 > 5, 9 > ... > 2, 12)
- **Port Score**: Value of adjacent trading ports (Phase 2)
- **Expansion Score**: Available adjacent vertices for future settlements (Phase 2)
- **Scarcity Score**: Bonus for rare resources on the board (Phase 2)

## Technology Stack

- **React 18** + **TypeScript** - Component-based UI with type safety
- **Vite** - Fast build tooling and HMR
- **Tailwind CSS** - Utility-first styling
- **SVG** - Resolution-independent board rendering
- **Zustand** - Lightweight state management (future)

## Project Structure

```
src/
├── components/          # React components
│   ├── board/          # Hex grid, tiles, vertices
│   └── recommendations/ # Recommendation panel and cards
├── lib/                # Core logic
│   ├── geometry/       # Hex coordinate math
│   ├── board/          # Board generation
│   ├── game/           # Placement rules
│   ├── scoring/        # Recommendation algorithm
│   └── explanations/   # Text generation
├── types/              # TypeScript definitions
├── constants/          # Game constants
└── styles/             # Global styles
```

## Roadmap

### MVP (Current)
- ✅ Random board generation
- ✅ Basic recommendation algorithm
- ✅ Interactive hex grid
- ✅ Beginner/Advanced explanations

### Phase 2 (Planned)
- [ ] Manual board builder
- [ ] Port placement and scoring
- [ ] Enhanced scoring (expansion, scarcity)
- [ ] Save/load board configurations

### Phase 3 (Future)
- [ ] colonist.io URL input (with manual fallback)
- [ ] Browser extension integration
- [ ] Screenshot OCR board import
- [ ] Snake draft mode (track multiple placements)

### Phase 4 (Advanced)
- [ ] Mobile responsive design
- [ ] Dark mode
- [ ] Multiplayer analysis
- [ ] Historical performance tracking

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

MIT

## Acknowledgments

- Game mechanics from **Settlers of Catan** by Klaus Teuber
- Hex grid math from [Red Blob Games](https://www.redblobgames.com/grids/hexagons/)
- Inspired by [colonist.io](https://colonist.io) for the visual aesthetic
