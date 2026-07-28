import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

export const PROTECTED_PATHS = [
  'backend/.python-version',
  'backend/pyproject.toml',
  'backend/uv.lock',
  'scripts/ensure-wan2gp.ps1',
  'scripts/ensure-wan2gp.sh',
  'scripts/install-wangp-stack.ps1',
  'scripts/update-wangp.ps1',
  'scripts/wangp-source.json',
  'scripts/wangp-stacks.json',
];

export const PROTECTED_PREFIXES = ['Wan2GP/'];

export const FOREIGN_LOCKFILES = [
  'bun.lock',
  'bun.lockb',
  'package-lock.json',
  'yarn.lock',
];

export function normalizeRepoPath(path) {
  return path.trim().replaceAll('\\', '/').replace(/^\.\/+/, '');
}

export function findProtectedPaths(paths) {
  return paths
    .map(normalizeRepoPath)
    .filter(
      (path) =>
        PROTECTED_PATHS.includes(path) ||
        PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix)),
    );
}

export function findForeignLockfiles(paths) {
  return paths
    .map(normalizeRepoPath)
    .filter((path) => FOREIGN_LOCKFILES.includes(path));
}

export function validatePackageManagerMetadata(
  packageJson,
  nodeVersion,
  nvmVersion,
) {
  const errors = [];

  if (packageJson.packageManager !== 'pnpm@10.30.3') {
    errors.push('package.json packageManager must be pnpm@10.30.3');
  }
  if (packageJson.engines?.pnpm !== '10.30.3') {
    errors.push('package.json engines.pnpm must be 10.30.3');
  }
  if (packageJson.engines?.node !== '>=24 <25') {
    errors.push('package.json engines.node must be >=24 <25');
  }
  if (nodeVersion.trim() !== '24' || nvmVersion.trim() !== '24') {
    errors.push('.node-version and .nvmrc must both select Node 24');
  }

  return errors;
}

function gitLines(args) {
  return execFileSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf8',
  })
    .split(/\r?\n/)
    .filter(Boolean);
}

function fail(errors) {
  for (const error of errors) {
    console.error(`Dependency policy violation: ${error}`);
  }
  process.exitCode = 1;
}

function checkPackageManager() {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  );
  const metadataErrors = validatePackageManagerMetadata(
    packageJson,
    readFileSync(new URL('../.node-version', import.meta.url), 'utf8'),
    readFileSync(new URL('../.nvmrc', import.meta.url), 'utf8'),
  );
  const foreignLockfiles = findForeignLockfiles(gitLines(['ls-files']));

  if (foreignLockfiles.length > 0) {
    metadataErrors.push(
      `foreign lockfiles are not allowed: ${foreignLockfiles.join(', ')}`,
    );
  }

  if (metadataErrors.length > 0) {
    fail(metadataErrors);
    return;
  }

  console.log('Package-manager policy passed: Node 24, pnpm 10.30.3, pnpm lockfile only.');
}

function checkChangedFiles(baseRef) {
  const changedFiles = gitLines(['diff', '--name-only', `${baseRef}...HEAD`]);
  const errors = [];
  const protectedPaths = findProtectedPaths(changedFiles);
  const foreignLockfiles = findForeignLockfiles(changedFiles);

  if (protectedPaths.length > 0) {
    errors.push(
      `generic dependency updates cannot change protected runtime paths: ${protectedPaths.join(', ')}`,
    );
  }
  if (foreignLockfiles.length > 0) {
    errors.push(
      `foreign lockfiles are not allowed: ${foreignLockfiles.join(', ')}`,
    );
  }

  if (errors.length > 0) {
    fail(errors);
    return;
  }

  console.log(`Dependency boundary check passed against ${baseRef}.`);
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);

  if (args.length === 1 && args[0] === '--package-manager') {
    checkPackageManager();
  } else if (args.length === 2 && args[0] === '--base') {
    checkChangedFiles(args[1]);
  } else {
    console.error(
      'Usage: node scripts/check-dependency-boundaries.mjs --package-manager | --base <git-ref>',
    );
    process.exitCode = 2;
  }
}
