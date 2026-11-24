// Save one rig page as one self-contained HTML file for review (plan § 3, ADR 0003).
// Usage: pnpm preview [path] [out]   defaults: /digest/2026-10-28  var/preview/index.html
// The banner shows LANE_MARKER from the environment, or "no marker set" when it is unset.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createApp } from '../src/app.js';

const path = process.argv[2] ?? '/digest/2026-10-28';
const out = process.argv[3] ?? 'var/preview/index.html';

const res = await createApp().request(path);
if (res.status !== 200) {
  console.error(`preview: ${path} returned ${res.status}`);
  process.exit(1);
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, await res.text());
console.log(`preview: saved ${path} to ${out}`);
