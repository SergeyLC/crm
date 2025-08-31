#!/usr/bin/env node
/**
 * Fails fast if a legacy Next.js Pages Router entrypoint (pages/_app.* or pages/_document.*)
 * is (re)introduced, which would break App Router prerendering (previously caused React error #130).
 */

const { existsSync, readdirSync } = require('fs');
const { join } = require('path');

const root = process.cwd();
const pagesDir = join(root, 'src', 'pages');
const forbidden = ['_app.tsx', '_app.ts', '_app.jsx', '_app.js', '_document.tsx', '_document.ts', '_document.jsx', '_document.js'];

if (existsSync(pagesDir)) {
  const entries = readdirSync(pagesDir);
  const offenders = entries.filter(e => forbidden.includes(e));
  if (offenders.length) {
    console.error('\n\x1b[31m[guard] Detected legacy pages router files that must be removed:\x1b[0m');
    offenders.forEach(f => console.error('  - ' + f));
    console.error('\nDelete these files to avoid hybrid routing conflicts (React invariant #130) and re-run.');
    process.exit(1);
  }
}
