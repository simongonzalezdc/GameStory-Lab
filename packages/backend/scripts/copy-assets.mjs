/**
 * Copy runtime-read assets (JSON/Markdown) into dist/.
 *
 * tsc does not emit non-TS files, but TemplateService and
 * DocumentGenerator read their templates from disk relative to
 * the compiled file's location (dist/...). Without this step,
 * `npm run build && npm start` boots with zero genre templates
 * and the architect cannot generate documents.
 */
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const assets = [
  ['src/services/templates/genres', 'dist/services/templates/genres'],
  ['src/services/architect/templates', 'dist/services/architect/templates'],
];

for (const [src, dest] of assets) {
  const srcPath = join(backendRoot, src);
  const destPath = join(backendRoot, dest);
  mkdirSync(dirname(destPath), { recursive: true });
  cpSync(srcPath, destPath, { recursive: true });
  console.log(`copied ${src} -> ${dest}`);
}
