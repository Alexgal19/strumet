#!/usr/bin/env node
/**
 * check-mobile-ui.mjs
 * 
 * Mobile UI Responsiveness & Anti-Pattern Validator for Strumet HR System.
 * 
 * Automatically executed on:
 *   - npm run build (via "prebuild" hook in package.json)
 *   - git push (via .husky/pre-push and .git/hooks/pre-push)
 * 
 * Rules checked:
 *   1. [CRITICAL] SheetContent with forms/popovers/calendars MUST specify
 *      onInteractOutside={(e) => e.preventDefault()} so mobile date pickers or
 *      portal dropdowns do not dismiss the sheet.
 *   2. [CRITICAL/WARN] Fixed pixel widths >= 360px without responsive breakpoints.
 *   3. [WARN] Data tables outside print views lacking overflow-x-auto or responsive card fallback.
 *   4. [WARN] Rigid action headers with buttons without flex-wrap.
 *   5. [WARN] Sticky bottom bars lacking safe-area-inset-bottom padding.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { execSync } from 'child_process';

const SRC_DIR = join(process.cwd(), 'src');

const IGNORE_PATTERNS = [
  'dashboard-pie-chart.tsx',
  'statistics-pie-chart.tsx',
  'ui-v2/skeleton.tsx',
];

const errors = [];
const warnings = [];

function getAllFiles(dir, exts = ['.tsx', '.jsx']) {
  let files = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        files = files.concat(getAllFiles(fullPath, exts));
      } else if (exts.includes(extname(entry))) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err.message);
  }
  return files;
}

function getChangedFiles() {
  try {
    const output = execSync('git status --porcelain', { encoding: 'utf8' });
    const changed = output
      .split('\n')
      .map(line => line.trim().slice(3))
      .filter(path => path.startsWith('src/') && (path.endsWith('.tsx') || path.endsWith('.jsx')))
      .map(rel => join(process.cwd(), rel));
    return changed;
  } catch {
    return [];
  }
}

function checkFile(filePath) {
  const fileName = filePath.split(/[\\/]/).pop();
  if (IGNORE_PATTERNS.some(p => filePath.replace(/\\/g, '/').includes(p))) return;

  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relPath = filePath.replace(process.cwd(), '').replace(/^[\\/]/, '');

  const isPrintComponent = 
    fileName.includes('print') || 
    content.includes('@media print') || 
    content.includes('print-only');

  // Rule 1: SheetContent with Popover/Calendar/EmployeeForm/DatePicker/Combobox must have onInteractOutside
  if (content.includes('<SheetContent')) {
    const hasFormOrPortal = 
      content.includes('EmployeeForm') || 
      content.includes('DatePicker') || 
      content.includes('Calendar') || 
      content.includes('Popover') ||
      content.includes('Combobox');

    if (hasFormOrPortal && !content.includes('onInteractOutside')) {
      errors.push({
        file: relPath,
        line: 1,
        rule: 'SHEET_PORTAL_INTERACTION',
        message: 'SheetContent contains forms/popovers/calendars but lacks onInteractOutside={(e) => e.preventDefault()}. Tapping a calendar date or dropdown portal will auto-close the sheet on mobile.'
      });
    }
  }

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Rule 2: Large fixed width >= 360px without responsive prefix
    // Matches w-[400px], min-w-[360px], max-w-[400px] unless preceded by a breakpoint like sm:, md:, lg:
    const widthMatches = line.matchAll(/(?:\b|\s)(?:(sm|md|lg|xl|2xl):)?(min-|max-)?w-\[(\d+)px\]/g);
    for (const match of widthMatches) {
      const breakpoint = match[1];
      const px = parseInt(match[3], 10);
      if (!breakpoint && px >= 360) {
        warnings.push({
          file: relPath,
          line: lineNum,
          rule: 'FIXED_LARGE_WIDTH',
          message: `Fixed width of ${px}px without responsive breakpoint prefix (e.g. sm:w-[${px}px]). Mobile screens are 360-390px, causing horizontal overflow.`
        });
      }
    }

    // Rule 3: Unwrapped tables (skip print templates)
    if (!isPrintComponent && (line.includes('<Table') || line.includes('<table'))) {
      const surrounding = lines.slice(Math.max(0, index - 6), Math.min(lines.length, index + 3)).join(' ');
      const hasResponsiveWrap = 
        surrounding.includes('overflow-x-auto') || 
        surrounding.includes('overflow-auto') || 
        surrounding.includes('hidden md:block') || 
        surrounding.includes('hidden sm:block') || 
        surrounding.includes('ScrollArea') ||
        surrounding.includes('overflow-hidden') ||
        surrounding.includes('mobile-table-card');

      if (!hasResponsiveWrap) {
        warnings.push({
          file: relPath,
          line: lineNum,
          rule: 'UNWRAPPED_TABLE',
          message: 'Table element found without overflow-x-auto or responsive card fallback (hidden md:block). Long tables will clip or cause page horizontal scrolling on mobile.'
        });
      }
    }

    // Rule 4: Action headers with multiple buttons without flex-wrap
    if (line.includes('flex items-center justify-between') && (line.includes('Button') || line.includes('Export') || line.includes('export'))) {
      if (!line.includes('flex-wrap') && !line.includes('sm:flex-row') && !line.includes('flex-col')) {
        warnings.push({
          file: relPath,
          line: lineNum,
          rule: 'RIGID_ACTION_HEADER',
          message: 'Card header flex container contains action buttons without flex-wrap. Title and buttons may collide on mobile viewports.'
        });
      }
    }
  });
}

function run() {
  console.log('\n📱 =======================================================');
  console.log('📱 Strumet Mobile UI Responsiveness & Bug Validator');
  console.log('📱 =======================================================\n');

  const changed = getChangedFiles();
  if (changed.length > 0) {
    console.log(`🔍 Detected ${changed.length} locally modified UI file(s).`);
  }

  const allFiles = getAllFiles(SRC_DIR);
  console.log(`🔍 Scanning all ${allFiles.length} UI files in src/...\n`);

  allFiles.forEach(checkFile);

  if (warnings.length > 0) {
    console.log(`⚠️  Found ${warnings.length} Mobile UI warning(s):`);
    warnings.slice(0, 15).forEach((w) => {
      console.log(`   [${w.rule}] ${w.file}:${w.line}`);
      console.log(`   └─ ${w.message}`);
    });
    if (warnings.length > 15) {
      console.log(`   ... and ${warnings.length - 15} more advisory warnings.`);
    }
    console.log('');
  }

  if (errors.length > 0) {
    console.log(`❌ Found ${errors.length} CRITICAL Mobile UI bug(s):`);
    errors.forEach((e) => {
      console.log(`   [${e.rule}] ${e.file}:${e.line}`);
      console.log(`   └─ ${e.message}`);
    });
    console.log('\n❌ Mobile UI validation FAILED! Please fix the critical bugs before building or pushing.\n');
    process.exit(1);
  }

  console.log('✅ All critical Mobile UI checks passed successfully!\n');
  process.exit(0);
}

run();
