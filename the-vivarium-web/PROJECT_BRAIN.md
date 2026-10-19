# PROJECT BRAIN — THE VIVARIUM (WEB EDITION)

## 1. System Vision & Architecture
**THE VIVARIUM** is an ecological sandbox simulation featuring two cooperative/interconnected living insect colonies:
- **Canopy / Aboveground:** An ancient mossy tree with a multi-level wild honeycomb, blooming meadow flowers, a living animated lake with swimming fauna, and honeybees (*Apis mellifera*) performing foraging flights.
- **Subterranean / Formicarium:** An organic underground cross-section with rich loam strata, naturally excavated tunnels, queen chamber, nurseries, and worker ants (*Camponotus*) carving new pathways in response to player interaction.

### Decoupled Architectural Layers:
1. **Simulation Core (`src/simulation/`)**: Pure TypeScript logic (tick-driven). Models ants, bees, resource accumulation (Honey, Wax, Mud, Food), day/night progression, and grid/cavity occupancy without any dependency on the rendering engine.
2. **Rendering Engine (`src/engine/`)**: Powered by **PixiJS v8** (WebGL / WebGPU). Manages viewport camera, layered parallax renderers (Sky/Canopy, Tree/Hive, Lake, Organic Soil Shader/Mask), and animated sprite batches.
3. **Reactive UI & HUD (`src/components/`)**: Built in React + Tailwind CSS. Renders top-tier scientific telemetry, worker management panels, tool selection (Dig, Fill, Plant, Inspect), time controls, and minimap without triggering re-renders of the canvas.
4. **Input & Camera Controller (`src/engine/CameraController.ts`)**: Handles smooth WASD pan, drag-to-pan, cursor-centered mouse wheel zoom, and world bounds clamping.

---

## 2. Directory Structure
```
the-vivarium-web/
├── public/                 # Static assets, spritesheets, audio
├── src/
│   ├── assets/             # Vector icons, palette definitions
│   ├── components/         # React HUD, Toolbar, InfoPanel, PopulationPill
│   ├── engine/             # PixiJS Application, Camera, Renderers
│   │   ├── Camera.ts       # Smooth WASD & cursor-centered zoom
│   │   ├── WorldRenderer.ts# Main composite scene controller
│   │   ├── layers/         # Background, Lake, Tree, Hive, SoilMask
│   │   └── entities/       # AntSprite, BeeSprite, FishSprite
│   ├── simulation/         # Pure headless simulation
│   │   ├── EcoSim.ts       # Master tick loop & time scaling
│   │   ├── AntColony.ts    # Queen, Workers, pathfinding, dig tasks
│   │   ├── BeeColony.ts    # Queen, Nectar collection, Honeycomb storage
│   │   ├── SubterraneanGrid.ts # Discrete cell state & smooth mask
│   │   └── Environment.ts  # Temperature, humidity, day/night cycle
│   ├── types/              # Game models, coordinates, interfaces
│   ├── App.tsx             # Root React view binding Canvas + HUD
│   └── main.tsx            # Entry point
├── vite.config.ts          # Port 2000 & build settings
└── PROJECT_BRAIN.md        # This living architecture document
```

---

## 3. Strict Quality Guarantees
- **No Godot tampering**: The original Godot repository remains 100% read-only.
- **No collage textures**: Soil boundaries and chambers use procedural smooth alpha masking and multi-layer shading.
- **Localhost 2000**: Development server binds to `http://localhost:2000`.
