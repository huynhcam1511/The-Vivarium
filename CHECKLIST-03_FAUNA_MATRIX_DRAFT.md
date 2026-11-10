# THE VIVARIUM — CHECKLIST 03 FAUNA MATRIX DRAFT
## Vertical Slice First Multi-Tier Fauna Pipeline: 5 Lifecycle Stages, 5 Castes & Standardized Action Sprite Sheet Specifications
**Document ID:** `CHECKLIST-03_FAUNA_MATRIX_DRAFT.md`  
**Milestone:** Gate 1 — Source Integrity Audit & Technical Blueprints  
**Date:** 2026-11-10T20:45:00Z  
**Author:** worker_gate1_1 (Gate 1 Specifications & Blueprints Author)  
**Parent System:** Checklist 03 (Ant Colony & Fauna Lifecycle Systems)  
**Checklist 03 Status:** **PENDING (0% COMPLETE) — STRICTLY UNOPENED**  
**Strict Directive Constraint:** **DOCUMENTATION ONLY.** Do NOT produce fauna implementation code or animations in this task. Checklist 03 must NOT be marked open.  
**Working Directory:** `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\GAME-20261110T141646Z-1-001\GAME`

---

## 1. Governance Boundary & Checklist Protocol

In accordance with the sequential gate rules established in `GAME/AGENTS.md` (Section 2) and `PROJECT.md`:
- **Checklist 01 (Art Direction & Visual Bible):** 100% COMPLETE & CLOSED.
- **Checklist 02 (Environment & Biomes):** IN PROGRESS (~25%) — STRICTLY OPEN.
- **Checklist 03 (Ant Colony & Fauna System):** **PENDING (0%) — STRICTLY UNOPENED.**

Per user directives, Checklist 03 will **only** be officially opened after Checklist 02 is completed, verified, and approved by the Game Director. This document functions exclusively as an **advance technical specification and production standard draft** to align future asset authoring with engine architectural requirements, without producing any executable code, simulation scripts, or art files.

---

## 2. The 3D Fauna Asset Production Matrix

To eliminate static, lifeless placeholder graphics and achieve true biological simulation depth, fauna assets are governed by the **3D Matrix Equation**:

$$\text{Total Fauna Asset Deliverables} = \text{Species} \times \left( \text{Lifecycle Stages} + \text{Adult Castes} \right) \times \text{Standard Action States}$$

For the primary colony species, the Black Carpenter Ant (*Camponotus Formicarium*):
$$\text{Asset Portfolio} = 1\text{ Species} \times (4\text{ Immature Stages} + 5\text{ Adult Castes}) \times 12\text{ Action States} = 108\text{ Sprite Sheets}$$

---

## 3. The 5 Standardized Lifecycle Stages (Vòng Đời Non)

```
                            ANT COLONY LIFECYCLE PROGRESSION
                            
      Stage 1                  Stage 2                  Stage 3                 Stage 4
   ┌───────────┐            ┌───────────┐            ┌───────────┐           ┌───────────┐
   │    EGG    │ ─────────► │   LARVA   │ ─────────► │   PUPA    │ ────────► │   CALLOW  │
   │ (Brood)   │  Hatching  │  (Grub)   │ Pupation   │ (Cocoon)  │ Eclosion  │  (Tender) │
   └───────────┘            └───────────┘            └───────────┘           └─────┬─────┘
                                                                                   │ Hardening &
                                                                                   │ Pigmentation
                                                                                   ▼
                                                                             ┌───────────┐
                                                                             │  Stage 5  │
                                                                             │   ADULT   │
                                                                             │(5 Castes) │
                                                                             └───────────┘
```

### Stage 1: Trứng (Egg)
- **Biological Description:** Pearlescent, translucent, oblong spherical brood clusters. Delicate egg envelopes coated in antibacterial saliva by nurse ants.
- **Canvas Dimensions:** $16 \times 16\text{ px}$ per single egg; $32 \times 32\text{ px}$ for stacked brood cluster.
- **Pivot:** `(0.50, 0.50)`.
- **Palette:** `#f4f1de` (translucent milk white) with faint amber yolk core (`#e0b15b`, alpha $0.4$).
- **Interaction Rules:** Immobile. Highly vulnerable to desiccation and fungal spores. Must be continually gathered into nursery chambers and groomed by nurse workers.

### Stage 2: Ấu trùng (Larva)
- **Biological Description:** Segmented, legless, translucent off-white grub curled in an organic "C" shape. Exhibits mouthpart feeding reflexes and peristaltic squirming.
- **Canvas Dimensions:** $24 \times 20\text{ px}$ (Early instar); $36 \times 24\text{ px}$ (Late instar).
- **Pivot:** `(0.50, 0.60)`.
- **Palette:** Translucent cream `#ede0d4`, digestive tract visible as an internal amber streak (`#b07d62`).
- **Interaction Rules:** Fed via mouth-to-mouth trophallaxis by nurses. Emits digestive enzymes converting solid insect protein into liquid amino acids.

### Stage 3: Nhộng (Pupa)
- **Biological Description:** Spun silk cocoon or naked pupa. Immobile and dormant, exhibiting progressive limb, eye, and mandibular pigmentation.
- **Canvas Dimensions:** $28 \times 18\text{ px}$ (Worker pupa); $48 \times 26\text{ px}$ (Queen/Soldier pupa).
- **Pivot:** `(0.50, 0.50)`.
- **Palette:** Spun silk ecru `#d6ccc2`, maturing into amber-brown `#7f4f24`.
- **Interaction Rules:** Immobile. Relocated between chambers by nurses to optimize temperature and humidity gradients.

### Stage 4: Kiến non mới nở (Callow)
- **Biological Description:** Freshly eclosed adult ant. The exoskeleton is soft, delicate, and pale beige/honey-toned, lacking full melanin hardening.
- **Canvas Dimensions:** $32 \times 18\text{ px}$.
- **Pivot:** `(0.50, 0.80)`.
- **Palette:** Soft pale beige `#ddb892`, faint brown eyes `#4a3525`.
- **Interaction Rules:** Slow-moving ($30\%\text{ normal speed}$). Retained in deep chambers for 2–3 simulation days performing gentle brood care while chitin hardens.

### Stage 5: Kiến trưởng thành (Adult)
- **Biological Description:** Fully sclerotized, dark brown/black chitinous exoskeleton with caste-differentiated morphology. Fully functional behavioral AI.

---

## 4. The 5 Adult Castes (Giai Cấp Kiến Trưởng Thành)

```
                                 ADULT CASTE SPECIALIZATION MATRIX
                                 
   ┌────────────────────────────────────────────────────────────────────────────────────────┐
   │                                   QUEEN (Kiến Chúa)                                    │
   │  - Scale: 60x32px in-engine (120px source) | Physogastric pulsing abdomen              │
   │  - Behavior: Egg laying, colony pheromone broadcast, biological breathing             │
   └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                               │
         ┌───────────────────┬─────────────────┴─────────────────┬──────────────────┐
         ▼                   ▼                                   ▼                  ▼
┌──────────────────┐┌──────────────────┐               ┌──────────────────┐┌──────────────────┐
│  MAJOR SOLDIER   ││ EXCAVATOR WORKER │               │   NURSE WORKER   ││      SCOUT       │
│   (Kiến Lính)    ││ (Kiến Thợ Đào)   │               │   (Kiến Y Tá)    ││ (Kiến Trinh Sát) │
│ - Heart head     ││ - Serrated jaw   │               │ - Compact agile  ││ - Slender legs   │
│ - Scissor mand.  ││ - Spined tarsi   │               │ - Brood hauling  ││ - Sprint speed   │
│ - Acid defense   ││ - 90° wall climb │               │ - Trophallaxis   ││ - Canopy foraging│
└──────────────────┘└──────────────────┘               └──────────────────┘└──────────────────┘
```

### Caste 1: Kiến Chúa (Queen / *Gynomorph*)
- **Dimensions:** $120 \times 64\text{ px}$ source canvas; $60 \times 32\text{ px}$ in-engine render size.
- **Morphology:** Colossal thorax with wing scars; massive physogastric gaster exhibiting rhythmic biological breathing contractions.
- **Palette:** Deep regal obsidian `#160c07`, burnished mahogany highlights `#3d1a10`.
- **Locomotion:** Slow, majestic stride ($12\text{ px/s}$). Anchored in royal chamber.

### Caste 2: Kiến Lính (Major Soldier / *Dinarte*)
- **Dimensions:** $48 \times 28\text{ px}$ in-engine render size.
- **Morphology:** Disproportionately massive heart-shaped head capsule; oversized scissor-blade mandibles powered by enormous muscular adductors.
- **Palette:** Dark chitin `#1f110a`, head plate `#2e150b`, amber mandibular teeth `#8b3a0f`.
- **Locomotion:** Steady patrol ($45\text{ px/s}$). Stationed at nest entrances and choke points.

### Caste 3: Kiến Thợ Đào (Excavator Worker / *Media*)
- **Dimensions:** $36.8 \times 20\text{ px}$ in-engine render size (Master benchmark: `char_ant_worker_idle_v2.png`).
- **Morphology:** Chiseled serrated mandibles designed for clay extraction; spined tarsal claws adhering to vertical earthen walls.
- **Palette:** Umber-brown `#2a1810`, warm terracotta leg segments `#4a2d1d`.
- **Locomotion:** Robust working gait ($55-75\text{ px/s}$). Operates across excavation fronts and mud stockpiles.

### Caste 4: Kiến Y Tá (Nurse Worker / *Minor*)
- **Dimensions:** $28 \times 16\text{ px}$ in-engine render size.
- **Morphology:** Agile, compact, slender body; highly flexible mandibles shaped for holding eggs and larvae without crushing them.
- **Palette:** Warm chestnut `#382015`, amber antennae `#663d26`.
- **Locomotion:** Nimble, delicate cadence ($60\text{ px/s}$). Confined to underground nurseries and royal chambers.

### Caste 5: Kiến Trinh Sát (Scout / *Minima/Forager*)
- **Dimensions:** $32 \times 18\text{ px}$ in-engine render size.
- **Morphology:** Elongated femoral and tibial segments; exceptionally sensitive multi-segmented antennae with high sensory hair density.
- **Palette:** Matte charcoal `#1a1a1a`, golden abdominal bands `#735738`.
- **Locomotion:** Rapid, erratic sprinting ($95\text{ px/s}$). Climbs tree trunk, navigates canopy boughs, and charts meadow foraging paths.

---

## 5. Standardized 8–12 Action States & Sprite Sheet Specifications

Every adult caste and active callow must feature dedicated sprite sheets adhering to standard frame specifications:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SPRITE SHEET GRID PACKING SPECIFICATION                         │
│                                                                                        │
│     ◄───────────────────────── Sheet Width (W * Frames) ────────────────────────►      │
│    ┌──────────────┬──┬──────────────┬──┬──────────────┬──┬──────────────┬──┐   ▲       │
│    │              │  │              │  │              │  │              │  │   │       │
│    │   FRAME 1    │  │   FRAME 2    │  │   FRAME 3    │  │   FRAME 4    │  │ Height (H)│
│    │              │  │              │  │              │  │              │  │   │       │
│    └──────────────┴──┴──────────────┴──┴──────────────┴──┴──────────────┴──┘   ▼       │
│      Padding: 2px      Padding: 2px      Padding: 2px      Padding: 2px                │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

| # | Action State ID | Frame Count | Target Frame Rate | Description, Mechanics & Keyframe Cues |
| :-: | :--- | :---: | :---: | :--- |
| **01** | `idle` | 8 frames | $8\text{ fps}$ | Natural abdominal respiration, subtle body weight shifts, and twitching antennae sensing pheromones. |
| **02** | `walk_horizontal` | 8 frames | $12\text{ fps}$ | Classical insect alternating tripod gait: Legs (L1, R2, L3) swing forward while (R1, L2, R3) push backward. |
| **03** | `climb_vertical_up` | 8 frames | $10\text{ fps}$ | Tarsal claw adhesion on vertical $90^\circ$ earthen contours. Antennae sweep upward; body stays pressed to wall. |
| **04** | `climb_vertical_down` | 8 frames | $10\text{ fps}$ | Controlled downward descent adhering to vertical surface; gaster tucked slightly upward. |
| **05** | `crawl_ceiling` | 8 frames | $10\text{ fps}$ | Inverted crawl along chamber ceilings and subterranean tunnel roofs; gravity pull subtly drops gaster. |
| **06** | `dig_excavate` | 10 frames | $12\text{ fps}$ | Mandibles clamp into soil, rhythmic backward head pull dislodging clay granule, backward kick clearing debris. |
| **07** | `carry_heavy` | 8 frames | $10\text{ fps}$ | Hauling mud ball, pebble, or seed clamped in mandibles angled $35^\circ$ upward; lowered body center of mass. |
| **08** | `feed_trophallaxis` | 6 frames | $8\text{ fps}$ | Mouth-to-mouth social feeding: Rapid antennae tapping, mouthpart contact, droplet transfer. |
| **09** | `attack_bite` | 6 frames | $14\text{ fps}$ | Threat stance: Mandibles flare wide ($60^\circ$), rapid explosive snap forward, gaster curls under for acid spray. |
| **10** | `death_curl` | 8 frames | $8\text{ fps}$ (One-shot) | Loss of hemolymph pressure: Legs flex and curl tightly beneath thorax, body topples sideways. |
| **11** | `groom_antennae` | 8 frames | $8\text{ fps}$ | Foreleg tibia comb clamps antenna, drawing it through in a smooth cleaning motion; head tilts inward. |
| **12** | `nurse_brood` | 6 frames | $8\text{ fps}$ | Delicate mandibular positioning and grooming of egg/larva clusters with antiseptic salivary secretions. |

---

## 6. Technical Sprite Sheet Delivery Standards

When Checklist 03 is officially opened and art production commences, all sprite sheets must strictly adhere to the following intake rules:
1. **Format:** PNG-24 with premultiplied alpha (clean edges, zero alpha fringing or chroma key artifacts).
2. **Padding:** Exact $2\text{px}$ transparent gutter surrounding each frame to prevent texture bleeding during WebGL mipmapping and zoom scaling.
3. **Normalized Pivot Coordinates:**
   - Adult Workers: `(0.50, 0.85)` (centered horizontally, anchored at tarsal foot contact plane).
   - Queen: `(0.50, 0.65)` (mass center of thorax).
   - Immature Brood: `(0.50, 0.50)` (geometric center).
4. **LOD Multi-Scale Assets:** Prepared at $4.0\times$ master source resolution ($147.2 \times 80\text{px}$ for worker) and cleanly downsampled to $1.0\times$ ($36.8 \times 20\text{px}$) to ensure sharpness across geometric camera zooms ($0.5\times$ to $4.0\times$).

---

## 7. Strict Governance Sign-Off

- **Checklist 03 is NOT opened.** It remains **PENDING (0%)**.
- **No fauna code, scripts, or animations have been authored.**
- This draft specification establishes the complete technical framework ready for activation only when Checklist 02 receives formal Game Director approval.

*Draft specification registered and certified by worker_gate1_1.*
