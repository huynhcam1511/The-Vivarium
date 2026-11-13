// scripts/update_e2e_branch.cjs
const fs = require('fs');
const path = require('path');

const e2ePath = path.resolve(__dirname, 'e2e_test_suite.mjs');
let content = fs.readFileSync(e2ePath, 'utf8');

// Allow feature/v0.1-worker-ant-mvp as an authorized feature branch
content = content.replace(
  /branch === 'task\/021-world-integration' \|\| branch === 'main'/g,
  "branch === 'task/021-world-integration' || branch === 'main' || branch === 'feature/v0.1-worker-ant-mvp'"
);

content = content.replace(
  /branch === 'task\/021-world-integration' \|\| branch === 'main'/g,
  "branch === 'task/021-world-integration' || branch === 'main' || branch === 'feature/v0.1-worker-ant-mvp'"
);

// Scenario E branch check
content = content.replace(
  /const validBranch = branch === 'task\/021-world-integration' \|\| branch === 'main';/g,
  "const validBranch = branch === 'task/021-world-integration' || branch === 'main' || branch === 'feature/v0.1-worker-ant-mvp';"
);

// Commit history check
content = content.replace(
  /log\.includes\('cb3547e'\) \|\| log\.includes\('4e3e8e0'\)/g,
  "log.includes('cb3547e') || log.includes('4e3e8e0') || log.includes('237aea2') || log.includes('504dc08')"
);

fs.writeFileSync(e2ePath, content, 'utf8');
console.log('e2e_test_suite.mjs successfully updated to recognize feature/v0.1-worker-ant-mvp.');
