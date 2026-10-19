# IMPLEMENTATION PLAN — THE VIVARIUM (WEB PROTOTYPE)

## Phase Roadmap & Progress

- [x] **Setup**: Scaffold Vite + React + TypeScript + PixiJS v8 + Tailwind on `localhost:2000`.
- [x] **Project Memory**: Create `PROJECT_BRAIN.md`, `ART_DIRECTION.md`, `IMPLEMENTATION_PLAN.md`.
- [ ] **Phase A — Pure Simulation Core**:
  - `SubterraneanGrid.ts`: Occupancy grid, pathfinding graph, Dig & Fill mutations, smooth distance field generator.
  - `AntColony.ts`: Worker ants, Queen ant, wandering, task queuing, excavation.
  - `BeeColony.ts`: Bee flight state machine (Hive -> Target Flower -> Siphon Nectar -> Return -> Honey Storage).
  - `EcoSim.ts`: Master loop, time scaling (1x, 2x, 5x, Pause), day/night progression.
- [ ] **Phase B — PixiJS GPU World Renderer**:
  - `WorldRenderer.ts`: Canvas setup, render layers (Sky, Canopy, Tree, Honeycomb, Lake, Surface, Soil Mask, Entities, Lighting).
  - `CameraController.ts`: WASD translation, drag pan, smooth zoom centered on cursor, world boundary clamping.
  - Layer Graphics: Procedural organic tree trunk, 3D-depth hexagonal honeycombs, animated lake with water ripples & fish, smooth carved earthen tunnels.
- [ ] **Phase C — React Game HUD**:
  - Top Scientific Telemetry Pill (Temperature, Humidity, CO2, Biome Badge).
  - Ecological Resource Counter (Honey, Wax, Mud, Food, Ants, Bees).
  - Bottom Master Toolbar (Dig, Fill, Inspect, Pheromone, Speed controls).
  - Minimap and Camera preset view buttons (Canopy, Meadow, Formicarium).
- [ ] **Phase D — Verification & Runtime Capture**:
  - Launch dev server on `http://localhost:2000`.
  - Validate interactive digging, bee foraging, ant tunneling, camera controls.
  - Record performance metrics (FPS, Frame Time, Memory).
- [ ] **Phase E — Final Deliverables**:
  - Complete `TEST_REPORT.md` and `GODOT_VS_WEB.md`.
