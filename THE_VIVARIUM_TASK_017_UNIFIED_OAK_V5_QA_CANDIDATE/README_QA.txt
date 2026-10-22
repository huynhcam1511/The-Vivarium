THE VIVARIUM — TASK-017 | UNIFIED ANCIENT OAK V5
STATUS: ART CANDIDATE — PIXEL QA PASS, IN-ENGINE QA PENDING

ASSET
env_tree_ancient_unified_v5.png
1200 x 1680 px, PNG RGBA (true transparency), source image 1060 x 1484 px.
A SINGLE continuous trunk-to-buttress-to-root silhouette. Not a collage of split trunk/root art.
Initial display scale: 0.5 (logical size 600 x 840 world units), without anisotropic stretching.
Recommended initial pivot: (0.5, 0.5); anchor with configurable scene position. Place the soil surface across the root flare near 55% of sprite height, then refine in engine.

QA FILES
QA_PREVIEW_CHECKERBOARD.png: verify genuine alpha, no baked checkerboard.
QA_PREVIEW_DARK.png: cross-section reference with surface line — preview illustration, not a working terrain mask.
QA_PREVIEW_WHITE.png: edge review.
QA_DETAIL_CROPS.png: crops for bark, buttress and roots.
QA_REPORT.json: measured pixel metadata and limitations.

IMPORTANT
1. This asset is ART CANDIDATE only, not Production Approved.
2. Previous V2/V4 assets must be retained for rollback. Never overwrite them.
3. On load, verify root visibility/occlusion near organic cave tiles and Dig/Fill changes.
4. Branches and canopy remain separable later for independent sway animations.
5. Zoom 4x may soften fine details because source is upscaled to 1200 x 1680.
6. The tree crosses the soil-surface cutaway. In engine, use masks and layers to hide roots correctly where required.
7. Technical preview is not evidence of collision, navigation, or simulation integrity.
8. For the moment TEST only in isolated preview scene. Do not integrate into main until Game Director approves.

FILE QA: width/height, PNG alpha, empty outer frame, low-alpha red-fringe cleanup all inspected.
