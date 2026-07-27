import assert from 'node:assert/strict';
import test from 'node:test';

import {
  findForeignLockfiles,
  findProtectedPaths,
  normalizeRepoPath,
  validatePackageManagerMetadata,
} from './check-dependency-boundaries.mjs';

test('normalizes Windows and POSIX repository paths', () => {
  assert.equal(normalizeRepoPath('.\\Wan2GP\\wgp.py'), 'Wan2GP/wgp.py');
  assert.equal(normalizeRepoPath('./frontend/App.tsx'), 'frontend/App.tsx');
});

test('detects protected runtime paths with either separator style', () => {
  assert.deepEqual(
    findProtectedPaths([
      'frontend/App.tsx',
      'backend\\uv.lock',
      'Wan2GP/shared/utils.py',
      'scripts/ensure-wan2gp.sh',
      'scripts\\update-wangp.ps1',
      'scripts\\wangp-stacks.json',
    ]),
    [
      'backend/uv.lock',
      'Wan2GP/shared/utils.py',
      'scripts/ensure-wan2gp.sh',
      'scripts/update-wangp.ps1',
      'scripts/wangp-stacks.json',
    ],
  );
});

test('detects foreign package-manager lockfiles', () => {
  assert.deepEqual(
    findForeignLockfiles([
      'pnpm-lock.yaml',
      'package-lock.json',
      '.\\yarn.lock',
      'Wan2GP\\vendored\\package-lock.json',
      'bun.lockb',
    ]),
    ['package-lock.json', 'yarn.lock', 'bun.lockb'],
  );
});

test('accepts exact supported Node and pnpm metadata', () => {
  assert.deepEqual(
    validatePackageManagerMetadata(
      {
        packageManager: 'pnpm@10.30.3',
        engines: { node: '>=24 <25', pnpm: '10.30.3' },
      },
      '24\n',
      '24\n',
    ),
    [],
  );
});

test('reports package-manager metadata drift', () => {
  assert.deepEqual(
    validatePackageManagerMetadata(
      {
        packageManager: 'pnpm@11.0.0',
        engines: { node: '>=25', pnpm: '11.0.0' },
      },
      '25',
      '24',
    ),
    [
      'package.json packageManager must be pnpm@10.30.3',
      'package.json engines.pnpm must be 10.30.3',
      'package.json engines.node must be >=24 <25',
      '.node-version and .nvmrc must both select Node 24',
    ],
  );
});
