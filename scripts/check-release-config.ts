/**
 * Refuses a store build that would ship without its real AdMob and RevenueCat identifiers.
 *
 * A missing identifier does not crash anything: the app falls back to Google's test ad units,
 * works perfectly, and earns nothing. That is invisible in QA and only shows up as a flat
 * revenue line weeks later, after the UA spend has already gone out. Hence a hard stop.
 *
 * Run: npm run check:release
 */
import { missingReleaseConfigFrom, RELEASE_ENV_KEYS } from '../src/config/releaseConfig';

/**
 * Refuses a second place that decides what an identifier is called.
 *
 * `src/config/env.ts` is the only file allowed to read `process.env` for a release identifier.
 * When `purchases.ts` read `EXPO_PUBLIC_RC_*` directly while CI injected the canonical
 * `EXPO_PUBLIC_REVENUECAT_*`, RevenueCat was configured with `undefined` in every CI build --
 * every gate stayed green and no purchase could ever complete. One reader, checked here.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const ALLOWED = ['src/config/env.ts', 'src/config/releaseConfig.ts'];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (name === 'node_modules' || name.startsWith('.')) return [];
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(name) ? [full] : [];
  });
}

const strays = sourceFiles(join(ROOT, 'src'))
  .concat(sourceFiles(join(ROOT, 'app')))
  .map((f) => relative(ROOT, f))
  .filter((f) => !ALLOWED.includes(f))
  .filter((f) => /process\.env\.EXPO_PUBLIC_(ADMOB|REVENUECAT|RC)_/.test(readFileSync(join(ROOT, f), 'utf8')));

if (strays.length > 0) {
  console.error('\n\u2717 A release identifier is read outside src/config/env.ts:\n');
  strays.forEach((f) => console.error(`    ${f}`));
  console.error('\nImport it from src/config/env.ts instead, so one file names every key.\n');
  process.exit(1);
}

const missing = missingReleaseConfigFrom(process.env);

if (missing.length === 0) {
  console.log(`✓ All ${RELEASE_ENV_KEYS.length} release identifiers are set.`);
  process.exit(0);
}

console.error('\n✗ This build is not ready for the stores.\n');
console.error('Missing, blank, or still a Google test unit:\n');
missing.forEach((key) => console.error(`    ${key}`));
console.error(
  [
    '',
    'Without these the app silently serves Google test ads and earns nothing.',
    'Set them as EAS environment variables for the production environment:',
    '',
    '    eas env:create --environment production --name <KEY> --value <value>',
    '',

    '',
  ].join('\n'),
);
process.exit(1);
