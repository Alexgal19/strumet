#!/usr/bin/env node
/**
 * update-claude-md.mjs
 * Scans the project and updates AUTO-GENERATED sections in CLAUDE.md.
 * Run manually:  node scripts/update-claude-md.mjs
 * Run via hook:  .git/hooks/pre-push calls this automatically before every push.
 *
 * Only sections between <!-- AUTO:name --> and <!-- /AUTO:name --> are replaced.
 * All other content (architectural notes, decisions, etc.) is preserved.
 */

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CLAUDE_MD = join(ROOT, 'CLAUDE.md');

// ─── Helpers ────────────────────────────────────────────────────────────────

function ls(dir, ext = '.tsx') {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith(ext) || f.endsWith('.ts'))
    .filter(f => !f.startsWith('_'))
    .sort();
}

function lsDirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => {
    try { return statSync(join(dir, f)).isDirectory(); } catch { return false; }
  }).sort();
}

function rel(p) {
  return relative(ROOT, p).replace(/\\/g, '/');
}

// ─── Section generators ──────────────────────────────────────────────────────

function genRoutes() {
  const appDir = join(ROOT, 'src/app/(app)');
  const lines = [];

  // Public routes
  lines.push('```');
  lines.push('src/app/');
  lines.push('├── layout.tsx                    # Root layout, PWA metadata');
  lines.push('├── global-error.tsx');
  lines.push('├── not-found.tsx');
  lines.push('├── login/page.tsx                # Public – Firebase email/password login');
  lines.push('├── register/page.tsx             # Public – user registration');
  lines.push('├── (app)/                        # Protected group (requires auth)');

  const dirs = lsDirs(appDir);
  for (const d of dirs) {
    const pageFile = join(appDir, d, 'page.tsx');
    const hasPage = existsSync(pageFile);
    if (hasPage) {
      lines.push(`│   ├── ${d}/page.tsx`);
    } else {
      // sub-folder with multiple files (e.g. employees/)
      const subFiles = ls(join(appDir, d));
      lines.push(`│   ├── ${d}/`);
      subFiles.forEach(f => lines.push(`│   │   ├── ${f}`));
    }
  }

  // API routes
  const apiBase = join(ROOT, 'src/app/api');
  if (existsSync(apiBase)) {
    lines.push('└── api/');
    lines.push('    ├── cron/');
    lines.push('    │   ├── daily-checks/route.ts');
    lines.push('    │   ├── check-contracts/route.ts');
    lines.push('    │   └── check-appointments/route.ts');
    lines.push('    └── archives/list/route.ts');
  }
  lines.push('```');
  return lines.join('\n');
}

function genComponents() {
  const dir = join(ROOT, 'src/components');
  if (!existsSync(dir)) return '';
  const files = readdirSync(dir)
    .filter(f => (f.endsWith('.tsx') || f.endsWith('.ts')) && !f.startsWith('_'))
    .sort();

  const rows = files.map(f => `| \`${f}\` | |`);
  return [
    '| File | Purpose |',
    '|------|---------|',
    ...rows,
  ].join('\n');
}

function genHooks() {
  const dir = join(ROOT, 'src/hooks');
  if (!existsSync(dir)) return '';
  const files = readdirSync(dir)
    .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
    .sort();
  return files.map(f => `- \`hooks/${f}\``).join('\n');
}

function genLib() {
  const dir = join(ROOT, 'src/lib');
  if (!existsSync(dir)) return '';
  const files = readdirSync(dir)
    .filter(f => (f.endsWith('.ts') || f.endsWith('.tsx')) && !f.startsWith('_'))
    .sort();
  // Skip subdirs
  const topLevel = files.filter(f => {
    try { return statSync(join(dir, f)).isFile(); } catch { return false; }
  });
  return topLevel.map(f => `- \`lib/${f}\``).join('\n');
}

function genAiFlows() {
  const dir = join(ROOT, 'src/ai/flows');
  if (!existsSync(dir)) return '';
  const files = readdirSync(dir)
    .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
    .sort();
  return files.map(f => `- \`ai/flows/${f}\``).join('\n');
}

function genLastUpdated() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

// ─── Section map ─────────────────────────────────────────────────────────────

const SECTIONS = {
  'routes':      genRoutes,
  'components':  genComponents,
  'hooks':       genHooks,
  'lib':         genLib,
  'ai-flows':    genAiFlows,
  'last-updated': genLastUpdated,
};

// ─── Main ────────────────────────────────────────────────────────────────────

const original = readFileSync(CLAUDE_MD, 'utf8');
let updated = original;

for (const [name, fn] of Object.entries(SECTIONS)) {
  const open  = `<!-- AUTO:${name} -->`;
  const close = `<!-- /AUTO:${name} -->`;
  const start = updated.indexOf(open);
  const end   = updated.indexOf(close);
  if (start === -1 || end === -1) continue;
  const content = fn();
  updated = updated.slice(0, start + open.length) + '\n' + content + '\n' + updated.slice(end);
}

if (updated !== original) {
  writeFileSync(CLAUDE_MD, updated, 'utf8');
  console.log('✅ CLAUDE.md updated');
} else {
  console.log('✔  CLAUDE.md already up to date');
}
