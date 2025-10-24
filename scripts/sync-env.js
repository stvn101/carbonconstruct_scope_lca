#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local not found at project root.');
  process.exit(1);
}

const rawEnv = fs.readFileSync(envPath, 'utf8');
const lines = rawEnv.split(/\r?\n/);

const addedKeys = [];
const skippedInvalid = [];

function runCommand(command, options = {}) {
  const result = spawnSync('sh', ['-c', command], {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    ...options,
  });
  return result;
}

function escapeForDoubleQuotes(value) {
  return value.replace(/[\\"$`]/g, '\\$&');
}

lines.forEach((line, index) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return;
  }

  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) {
    skippedInvalid.push({ line: index + 1 });
    return;
  }

  const key = trimmed.slice(0, eqIndex).trim();
  const value = trimmed.slice(eqIndex + 1);

  if (!key) {
    skippedInvalid.push({ line: index + 1 });
    return;
  }

  const escapedKey = escapeForDoubleQuotes(key);
  const checkCmd = `vercel env ls | grep -w "${escapedKey}"`;
  const check = runCommand(checkCmd);

  if (check.status === 0) {
    console.log(`ℹ️  ${key} exists remotely, skipping.`);
    return;
  }

  if (check.status !== 1) {
    console.error(`❌ Failed to check existing env for ${key}.`);
    if (check.stderr) {
      console.error(check.stderr.trim());
    }
    process.exit(check.status || 1);
  }

  const add = spawnSync('vercel', ['env', 'add', key, 'production'], {
    encoding: 'utf8',
    input: `${value}\n`,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  if (add.status !== 0) {
    console.error(`❌ Failed to add ${key}.`);
    if (add.stderr) {
      console.error(add.stderr.toString().trim());
    }
    process.exit(add.status || 1);
  }

  addedKeys.push(key);
  console.log(`✅ Added ${key} to Vercel production environment.`);
});

if (skippedInvalid.length > 0) {
  console.warn('⚠️  Skipped lines without valid key=value pairs:',
    skippedInvalid.map((item) => `line ${item.line}`).join(', '));
}

if (addedKeys.length === 0) {
  console.log('No new environment variables were added.');
} else {
  console.log(`Added ${addedKeys.length} new environment variable(s): ${addedKeys.join(', ')}.`);
}

console.log('✅ Env vars synced safely from .env.local to Vercel.');
