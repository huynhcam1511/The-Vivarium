# THE VIVARIUM — VISUAL BIBLE v0.1 (DRAFT)

## Status
Visual direction established from concept references. **NOT approved as final production specifications.** Do not mark Art Direction checklist complete until the owner reviews scale, palette, zoom and asset tests.

## Core identity
- Premium hand-painted stylized 2D/2.5D nature simulation; warm honey amber against lush forest greens, rich soil browns and turquoise water.
- Side-view, continuous above-ground and underground cross-section; broad explorable world, not a fixed poster.
- Bee colonies inside ancient tree trunks with readable hexagonal queen/brood/honey/pollen/wax chambers; multiple hives and trees can coexist.
- Ant colonies form organic connected tunnels and functional rooms in editable soil.
- Wildlife includes fish, ducks, insects; environmental seasons, weather and day/night.
- High visual readability at normal play zoom; rich details at close zoom. UI clean and subordinate to scene.

## Art rules
1. References are visual targets, not source sprites. NEVER use whole reference images as gameplay backgrounds or extract arbitrary cropped chambers to fake interactivity.
2. Separate assets for objects; animation assets and terrain render logic must be production-ready and editable.
3. No checkerboard seams, rectangular black tunnel holes, stretched textures, mismatched scales or UI baked into game world.
4. Runtime screenshot acceptance must show real layered world, dynamic terrain and independently moving entities.
5. Bee/ant scale should be consistent with gameplay readability, not literal biological scale.

## Camera and zoom (PROPOSAL — test before approval)
- Reference viewport: 1920×1080; responsive at 1280×720.
- Zoom modes: overview 0.25–0.5x, region 1x, chamber 2x, close-up 4x (illustrative, not fixed implementation limits).
- Assets must use appropriate source detail/LOD; zooming a small raster PNG to 4x is not sufficient.

## Palette (NOT YET LOCKED)
- Forest greens; honey amber/gold; warm earth browns; lake cyan/teal; cool nighttime blues; high-contrast neutral HUD.
- Exact HEX palette requires owner review against runtime scenes and final asset examples.

## Composition and rendering
- Parallax distant forest/mountains, independently rendered midground/foreground vegetation.
- Terrain geometry from editable occupancy/shape data, masked continuous textures and organic boundaries.
- Bee comb built from repeatable hex cells with stateful storage/brood data.
- Water, light and particles separate from still artwork.

## Acceptance gate
Create and review: (a) one worker ant sprite + idle/walk; (b) one bee + flight; (c) one tunnel/chamber Dig/Fill; (d) one hex comb room; (e) screenshots at 1x, 2x, 4x. No claim of final art direction until approved.
