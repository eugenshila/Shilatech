import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const loaderUrl = pathToFileURL(path.join(repoRoot, 'lib/db-env.mjs')).href;
const migratePath = path.join(repoRoot, 'scripts/migrate.mjs');

function runNode(args, { cwd, env, code } = {}) {
  const childEnv = { ...process.env, ...env };
  if (!env || !Object.prototype.hasOwnProperty.call(env, 'DATABASE_URL')) delete childEnv.DATABASE_URL;
  return new Promise((resolve) => {
    const child = spawn(process.execPath, code ? ['--input-type=module', '-e', code] : args, { cwd, env: childEnv });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (status) => resolve({ status, stdout, stderr }));
  });
}

function loadInChild(dir, env = {}) {
  return runNode([], {
    cwd: dir,
    env: { NODE_ENV: 'development', ...env },
    code: `import { loadDatabaseUrl } from ${JSON.stringify(loaderUrl)};
console.log(loadDatabaseUrl(${JSON.stringify(dir)}));`,
  });
}

test('loadDatabaseUrl reads DATABASE_URL from .env.local', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'shilatech-env-'));
  try {
    await writeFile(path.join(dir, '.env.local'), 'DATABASE_URL=postgresql://postgres:secret@localhost:5432/shilatech\n');
    const result = await loadInChild(dir);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), 'postgresql://postgres:secret@localhost:5432/shilatech');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('loadDatabaseUrl does not override an existing DATABASE_URL', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'shilatech-env-'));
  try {
    await writeFile(path.join(dir, '.env.local'), 'DATABASE_URL=postgresql://from-file/db\n');
    const result = await loadInChild(dir, { DATABASE_URL: 'postgresql://already-set/db' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), 'postgresql://already-set/db');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('migrate.mjs explains how to set DATABASE_URL when it is missing', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'shilatech-migrate-'));
  try {
    const result = await runNode([migratePath], { cwd: dir, env: { NODE_ENV: 'development' } });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /Put your PostgreSQL connection string in \.env\.local/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('database CLI scripts load DATABASE_URL through the shared helper', async () => {
  const scriptsDir = path.join(repoRoot, 'scripts');
  const files = (await readdir(scriptsDir)).filter((name) =>
    /^(migrate|check-stock|clear-confirmed-sample-stock|bootstrap-local-admin)/.test(name) && name.endsWith('.mjs')
  );
  assert.ok(files.length >= 10, `expected database scripts, found ${files.join(', ')}`);
  for (const name of files) {
    const source = await readFile(path.join(scriptsDir, name), 'utf8');
    assert.match(source, /createDatabasePool|loadDatabaseUrl/, name);
    assert.doesNotMatch(source, /throw new Error\('DATABASE_URL is required'\)/, name);
  }
});
