#!/usr/bin/env node
/**
 * update-agents-md.mjs
 * Updates AUTO-GENERATED sections in AI_CONTEXT.md.
 * Run manually:  node scripts/update-agents-md.mjs
 * Run via hook:  .git/hooks/pre-push calls this automatically before every push.
 *
 * Only content between <!-- AUTO:name --> and <!-- /AUTO:name --> is replaced.
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const AGENTS_MD = join(ROOT, 'AI_CONTEXT.md');

function genLastUpdated() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const SECTIONS = {
  'last-updated': genLastUpdated,
};

if (!existsSync(AGENTS_MD)) {
  console.error('❌ AI_CONTEXT.md not found');
  process.exit(1);
}

const original = readFileSync(AGENTS_MD, 'utf8');
let updated = original;

for (const [name, fn] of Object.entries(SECTIONS)) {
  const open  = `<!-- AUTO:${name} -->`;
  const close = `<!-- /AUTO:${name} -->`;
  const start = updated.indexOf(open);
  const end   = updated.indexOf(close);
  if (start === -1 || end === -1) continue;
  const content = fn();
  updated = updated.slice(0, start + open.length) + content + updated.slice(end);
}

if (updated !== original) {
  writeFileSync(AGENTS_MD, updated, 'utf8');
  console.log('✅ AI_CONTEXT.md updated');
} else {
  console.log('✔  AI_CONTEXT.md already up to date');
}
