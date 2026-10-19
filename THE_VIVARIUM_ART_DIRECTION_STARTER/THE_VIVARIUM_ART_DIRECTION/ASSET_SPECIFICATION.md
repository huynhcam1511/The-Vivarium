# ASSET SPECIFICATION v0.1 — PROVISIONAL

## Delivery
- Game-ready raster assets: transparent RGBA PNG, cropped to content with safe margins, no baked UI/text/shadows unless specified.
- Working source: layered editable file (e.g. PSD, Krita .kra, Aseprite .aseprite) when available; export PNG/atlas plus metadata.
- Animations: numbered PNG frames or sprite atlas + JSON frame metadata; consistent frame canvas, pivot, orientation and scale.
- Recommended color: sRGB; avoid unnecessary upscaling and lossy JPG for sprites.

## Folder conventions
assets/characters/ants/worker/; assets/characters/bees/worker/; assets/environment/trees/; assets/environment/water/; assets/terrain/; assets/colonies/bee/; assets/colonies/ant/; assets/ui/

## Naming convention
{category}_{subject}_{state}_{direction}_{frame:03}.png
Examples: ant_worker_walk_right_001.png, bee_worker_fly_left_001.png, tree_ancient_trunk_idle_001.png

## Metadata required per asset
asset_id, asset_type, source_file, dimensions_px, pivot_normalized_xy, pixels_per_world_unit, animation_fps, frame_count, intended_zoom, license, status, reviewer.

## Pending decisions (do not invent or silently lock)
- Pixels-per-world-unit and sprite baseline sizes.
- Character relative scale to chambers and flowers.
- Animation frame rates, pivot coordinates, atlas packing limits.
- Which details use sprite sheets vs skeletal rigging.
- LOD and close-up art variants.

## Quality gates
1. Alpha edges clean; no text or concept HUD embedded.
2. Consistent silhouettes, lighting direction, style, proportions.
3. Sprite test in engine at normal zoom and 2x/4x close-up.
4. Animation motion coherent, no jitter or accidental position shifts.
5. Owner approval before import into main scene.
