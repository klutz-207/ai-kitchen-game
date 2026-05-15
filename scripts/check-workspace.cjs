const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

const requiredPaths = [
  'AGENTS.md',
  'README.md',
  '.env.example',
  'package.json',
  'api/_lib/ai-pipeline.js',
  'api/_lib/llm-client.js',
  'api/_lib/mock-service.js',
  'api/_lib/prompt-skill.js',
  'api/_lib/sd-client.js',
  'api/_lib/session-store.js',
  'api/_lib/style-context.js',
  'api/v1/sessions.js',
  'demo/package.json',
  'docs/产品需求文档.md',
  'docs/game-flow.md',
  'docs/工作环境指南.md',
  'docs/协作看板.md',
  'assets/art-library/manifest.json',
  'tests/mock-service.test.js',
];

const optionalIgnoredPaths = [
  'node_modules',
  'demo/node_modules',
];

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

let failed = false;

console.log('AI Kitchen workspace check\n');

for (const relativePath of requiredPaths) {
  if (exists(relativePath)) {
    console.log(`OK   ${relativePath}`);
  } else {
    failed = true;
    console.log(`MISS ${relativePath}`);
  }
}

console.log('');

for (const relativePath of optionalIgnoredPaths) {
  console.log(`${exists(relativePath) ? 'OK  ' : 'INFO'} ${relativePath}${exists(relativePath) ? '' : ' not installed yet'}`);
}

try {
  const pkg = readJson('package.json');
  const demoPkg = readJson('demo/package.json');
  const scripts = ['check', 'dev', 'dev:api', 'dev:demo', 'test', 'build:demo'];
  const missingScripts = scripts.filter((name) => !pkg.scripts || !pkg.scripts[name]);

  if (missingScripts.length) {
    failed = true;
    console.log(`\nMISS package scripts: ${missingScripts.join(', ')}`);
  } else {
    console.log('\nOK   root package scripts are ready');
  }

  if (!demoPkg.scripts || !demoPkg.scripts.dev || !demoPkg.scripts.build) {
    failed = true;
    console.log('MISS demo package dev/build scripts');
  } else {
    console.log('OK   demo package scripts are ready');
  }
} catch (error) {
  failed = true;
  console.log(`FAIL package metadata check: ${error.message}`);
}

console.log('');

if (failed) {
  console.log('Workspace check failed. Fix the missing items above.');
  process.exitCode = 1;
} else {
  console.log('Workspace check passed. Ready to cook.');
}
