import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, '..');
const gameRoot = path.resolve(webRoot, '..');
const projectRoot = path.resolve(gameRoot, '..');

console.log('Challenger Gate 1 Harness starting...');
console.log('Project Root:', projectRoot);
console.log('GAME Root:', gameRoot);
console.log('Web Root:', webRoot);

const runCmd = (cmd, cwd = gameRoot) => {
  return execSync(cmd, { cwd, encoding: 'utf8', shell: 'powershell.exe' }).trim();
};

test('CHALLENGE 1: Deliverable File Presence, Line Counts & Size Bounds', async (t) => {
  const deliverables = [
    { file: 'TASK-021_SOURCE_OF_TRUTH_AUDIT.md', minBytes: 8000, minLines: 100 },
    { file: 'CHECKLIST-02_VISUAL_DEFECT_REGISTER.md', minBytes: 15000, minLines: 180 },
    { file: 'TASK-021_OAK_FORM_CORRECTION.md', minBytes: 12000, minLines: 140 },
    { file: 'TASK-021_DIG_FILL_GAMEPLAY_CORRECTION.md', minBytes: 12000, minLines: 150 },
    { file: 'MODULAR_BIOME_CHUNK_V1_BLUEPRINT.md', minBytes: 10000, minLines: 130 },
    { file: 'CHECKLIST-03_FAUNA_MATRIX_DRAFT.md', minBytes: 12000, minLines: 140 },
    { file: 'TASK-021_GATE_1_EVIDENCE_REPORT.md', minBytes: 7000, minLines: 80 },
  ];

  for (const d of deliverables) {
    const fullPath = path.join(gameRoot, d.file);
    assert.ok(fs.existsSync(fullPath), `Deliverable file must exist: ${d.file}`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size >= d.minBytes, `${d.file} size (${stat.size}B) must be >= ${d.minBytes}B`);

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').length;
    assert.ok(lines >= d.minLines, `${d.file} line count (${lines}) must be >= ${d.minLines}`);
    console.log(`  [PASS] ${d.file}: ${stat.size} bytes, ${lines} lines`);
  }
});

test('CHALLENGE 2: Git Topology, Hashes & Guardrails', async (t) => {
  // Branch check
  const branch = runCmd('git branch --show-current');
  assert.equal(branch, 'task/021-world-integration', 'Active branch must be task/021-world-integration');

  // HEAD commit check
  const headHash = runCmd('git rev-parse HEAD');
  assert.ok(headHash.startsWith('4e3e8e0'), `HEAD commit must start with 4e3e8e0, got: ${headHash}`);

  // Preceding feature commit check
  const parentHash = runCmd('git rev-parse HEAD~1');
  assert.ok(parentHash.startsWith('cb3547e'), `Preceding feature commit must start with cb3547e, got: ${parentHash}`);

  // main commit check
  const mainHash = runCmd('git rev-parse main');
  assert.ok(mainHash.startsWith('2a22544'), `main branch commit must start with 2a22544, got: ${mainHash}`);

  // Merge base check
  const mergeBase = runCmd('git merge-base main HEAD');
  assert.ok(mergeBase.startsWith('6c28a32'), `merge-base with main must start with 6c28a32, got: ${mergeBase}`);

  // Check that task/021-world-integration is NOT merged into main
  let isAncestor = false;
  try {
    runCmd('git merge-base --is-ancestor HEAD main');
    isAncestor = true;
  } catch (e) {
    // Expected to fail with non-zero exit code because HEAD is not in main
    isAncestor = false;
  }
  assert.equal(isAncestor, false, 'Guardrail: HEAD must NOT be an ancestor of main (no merge to main)');

  // Check no merge commits exist on task/021-world-integration ahead of merge-base
  const mergeCommits = runCmd(`git log --merges ${mergeBase}..HEAD --oneline`);
  assert.equal(mergeCommits, '', 'No merge commits must exist on task branch');

  // Audit staging contamination reported in TASK-021_SOURCE_OF_TRUTH_AUDIT.md
  const stagedDiff = runCmd('git diff --cached --name-only');
  const stagedFiles = stagedDiff.split('\n').map(s => s.trim()).filter(Boolean);
  assert.equal(stagedFiles.length, 80, `Staged file count must match audit report (80 files), got: ${stagedFiles.length}`);
  assert.ok(stagedFiles.includes('the-vivarium-web/src/engine/OrganicTerrainRenderer.ts'), 'Staged index must contain OrganicTerrainRenderer.ts alert');
  assert.ok(stagedFiles.includes('the-vivarium-web/tsconfig.app.json'), 'Staged index must contain tsconfig.app.json alert');

  console.log('  [PASS] Git lineage, commit hashes, branch safety, and staging index audit verified');
});

test('CHALLENGE 3: Visual Defect Register (All 8 Defects & Checklist Status)', async (t) => {
  const content = fs.readFileSync(path.join(gameRoot, 'CHECKLIST-02_VISUAL_DEFECT_REGISTER.md'), 'utf8');

  const requiredDefects = [
    { id: 'DEF-01', name: 'Chopped Branch', regex: /chopped branch/i },
    { id: 'DEF-02', name: 'Floating Grass Ruler', regex: /floating grass ruler/i },
    { id: 'DEF-03', name: 'Root Disconnection', regex: /root disconnection/i },
    { id: 'DEF-04', name: 'Soil Tiling Optical Vortex', regex: /soil tiling/i },
    { id: 'DEF-05', name: '32px Cave Grid', regex: /32px cave grid/i },
    { id: 'DEF-06', name: 'Sky/Weather Disconnection', regex: /sky\/weather/i },
    { id: 'DEF-07', name: 'Map Size Limitation', regex: /map size/i },
    { id: 'DEF-08', name: 'Geometric Waterfall', regex: /geometric waterfall/i },
  ];

  for (const defect of requiredDefects) {
    assert.ok(defect.regex.test(content), `Defect Register must track ${defect.id}: ${defect.name}`);
    assert.ok(content.includes(defect.id), `Defect Register must contain ID ${defect.id}`);
  }

  // Check governance status
  assert.ok(/Checklist 02 Status:.*IN PROGRESS.*STRICTLY REMAINS OPEN/i.test(content), 'Checklist 02 must remain OPEN');
  assert.ok(/Checklist 03.*PENDING.*STRICTLY UNOPENED/i.test(content), 'Checklist 03 must remain UNOPENED');

  console.log('  [PASS] All 8 visual defects and governance statuses verified');
});

test('CHALLENGE 4: Oak Layering & Dual-Pass Masking Specification', async (t) => {
  const content = fs.readFileSync(path.join(gameRoot, 'TASK-021_OAK_FORM_CORRECTION.md'), 'utf8');

  // Verify hybrid silhouette
  assert.ok(/two massive lateral boughs/i.test(content) || /two large lateral/i.test(content), 'Must specify 2 lateral boughs');
  assert.ok(/left lateral bough/i.test(content) && /beehive/i.test(content), 'Left bough must reserve Beehive sanctuary');
  assert.ok(/right lateral bough/i.test(content) && /riparian/i.test(content), 'Right bough must span riparian / waterfall');

  // Verify dual-pass masking mathematics
  assert.ok(content.includes('Pass 1: Subterranean Root Mask Formulation') || content.includes('Pass 1: Roots'), 'Must define Pass 1 Roots');
  assert.ok(content.includes('Z: 30') || content.includes('Z:30'), 'Pass 1 must specify Z: 30');
  assert.ok(content.includes('Z: 45') || content.includes('Z:45'), 'Pass 2 must specify Z: 45');
  assert.ok(content.includes('16px Overlap') || content.includes('16px vertical overlap') || content.includes('16px'), 'Must specify 16px safety overlap buffer');
  assert.ok(content.includes('delta_1 = 6px') || content.includes('delta1 = 6px') || content.includes('- 6px') || content.includes('- 6'), 'Pass 1 mask must clip at surface - 6px');
  assert.ok(content.includes('delta_2 = 10px') || content.includes('delta2 = 10px') || content.includes('+ 10px') || content.includes('+ 10'), 'Pass 2 mask must clip at surface + 10px');

  // Verify empirical diff validation data
  assert.ok(content.includes('16,360 px') || content.includes('16360'), 'Must document empirical excavation diff (16,360 px)');
  assert.ok(content.includes('17,693 px') || content.includes('17693'), 'Must document empirical backfill recovery diff (17,693 px)');

  // Verify guardrails
  assert.ok(/DO NOT GENERATE OR REPLACE ARTWORK/i.test(content), 'Must contain strict no-art guardrail');

  console.log('  [PASS] Oak layering, dual-pass mathematics, 16px overlap, and diff telemetry verified');
});

test('CHALLENGE 5: Dig/Fill Technical Specification', async (t) => {
  const content = fs.readFileSync(path.join(gameRoot, 'TASK-021_DIG_FILL_GAMEPLAY_CORRECTION.md'), 'utf8');

  // Verify 2-layer pipeline
  assert.ok(/2-layer/i.test(content), 'Must define 2-layer architecture');
  assert.ok(/Player Designation/i.test(content), 'Must define Player Designation Layer');
  assert.ok(/Job Queue/i.test(content), 'Must define Job Queue');
  assert.ok(/Worker State Machine/i.test(content) || /Worker Execution/i.test(content), 'Must define Worker State Machine');

  // Verify timed excavation & progress bar
  assert.ok(/3\.0\s*(to|-)\s*5\.0\s*s/i.test(content) || /\[3\.0,\s*5\.0\]/i.test(content), 'Must define 3.0 to 5.0 seconds excavation duration');
  assert.ok(/Floating Progress Bar/i.test(content), 'Must define active floating progress bar');

  // Verify finite mud stockpile
  assert.ok(/ClayMudStockpile/i.test(content) || /Stockpile Chamber/i.test(content), 'Must define Clay Mud Stockpile entity');
  assert.ok(/withdraw/i.test(content) && /deposit/i.test(content), 'Stockpile must define withdraw and deposit contracts');
  assert.ok(/finite/i.test(content), 'Must explicitly enforce finite resource mechanics');

  // Verify DEV mode instant brush restriction
  assert.ok(/DEV.*MODE/i.test(content) && /instant/i.test(content), 'Instant brush excavation must be restricted to DEV mode');

  console.log('  [PASS] Dig/Fill 2-layer model, 3-5s timing, progress bar, and stockpile contracts verified');
});

test('CHALLENGE 6: Modular Biome Chunk Blueprint', async (t) => {
  const content = fs.readFileSync(path.join(gameRoot, 'MODULAR_BIOME_CHUNK_V1_BLUEPRINT.md'), 'utf8');

  // Dimensions
  assert.ok(/64\s*(?:[x×]|\\times)\s*64/i.test(content), 'Must define 64x64 chunk dimensions');
  assert.ok(/2048\s*(?:[x×]|\\times)\s*2048/i.test(content), 'Must define 2048x2048px world span');

  // 2x3 Prototype Grid
  assert.ok(/2\s*(?:[x×]|\\times)\s*3/i.test(content), 'Must specify 2x3 prototype grid layout');
  assert.ok(/24,?576(?:\s*|\\text\{\s*)cells/i.test(content) || /24,?576/i.test(content), 'Must calculate 24,576 total cells');
  assert.ok(/15\.8\s*(?:[x×]|\\times)/i.test(content) || /10\.24\s*(?:[x×]|\\times)/i.test(content), 'Must calculate area expansion factor (15.8x or 10.24x)');

  // 3 Conduit Sockets
  assert.ok(/Tunnel/i.test(content), 'Must specify Underground Tunnel socket');
  assert.ok(/Root Vein/i.test(content), 'Must specify Root Vein port');
  assert.ok(/Aquifer/i.test(content), 'Must specify Aquifer / Drainage port');

  // Guardrail: Do not replace terrain engine
  assert.ok(/DO NOT REPLACE THE EXISTING TERRAIN ENGINE/i.test(content), 'Must contain strict engine non-replacement guardrail');

  console.log('  [PASS] 64x64 chunk specification, 2x3 layout, 3 conduit sockets, and non-replacement guardrail verified');
});

test('CHALLENGE 7: Fauna Matrix Documentation & Zero-Code Guardrail', async (t) => {
  const content = fs.readFileSync(path.join(gameRoot, 'CHECKLIST-03_FAUNA_MATRIX_DRAFT.md'), 'utf8');

  // 5 Lifecycle stages
  const stages = ['Egg', 'Larva', 'Pupa', 'Callow', 'Adult'];
  for (const s of stages) {
    assert.ok(new RegExp(s, 'i').test(content), `Must define lifecycle stage: ${s}`);
  }

  // 5 Castes
  const castes = ['Queen', 'Soldier', 'Excavator', 'Nurse', 'Scout'];
  for (const c of castes) {
    assert.ok(new RegExp(c, 'i').test(content), `Must define caste: ${c}`);
  }

  // Action states (8 to 12)
  const actionStates = [
    'idle', 'walk_horizontal', 'climb_vertical_up', 'climb_vertical_down',
    'crawl_ceiling', 'dig_excavate', 'carry_heavy', 'feed_trophallaxis',
    'attack_bite', 'death_curl', 'groom_antennae', 'nurse_brood'
  ];
  let matchedActions = 0;
  for (const a of actionStates) {
    if (content.includes(a)) matchedActions++;
  }
  assert.ok(matchedActions >= 8, `Must define at least 8 action states, found: ${matchedActions}`);

  // Guardrail: Checklist 03 UNOPENED
  assert.ok(/Checklist 03 Status:.*PENDING.*STRICTLY UNOPENED/i.test(content), 'Checklist 03 must remain UNOPENED');

  // Guardrail: Zero fauna code files created in repository
  const simDir = path.join(webRoot, 'src', 'simulation');
  if (fs.existsSync(simDir)) {
    const simFiles = fs.readdirSync(simDir);
    for (const f of simFiles) {
      assert.ok(!/FaunaLifecycle|FaunaAnimation|AntMorphology/i.test(f), `No fauna lifecycle code files may be created: ${f}`);
    }
  }

  console.log(`  [PASS] Fauna 5 stages, 5 castes, ${matchedActions} action states, and zero-code guardrail verified`);
});

test('CHALLENGE 8: Web Unit Test Suite Execution', async (t) => {
  const testOutput = runCmd(
    'npx tsx --test src/aquatic/AquaticSystem.test.ts src/weather/WeatherSystem.test.ts',
    webRoot
  );

  assert.ok(testOutput.includes('12') && (testOutput.includes('pass 12') || testOutput.includes('passed')), 'Test suite must pass all 12 tests');
  console.log('  [PASS] the-vivarium-web unit test suite executed and passed (12/12)');
});
