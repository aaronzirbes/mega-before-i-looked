import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { DigestRow } from '../src/digest/types.js';

const GOOD = '2026-10-28';
const EMPTY = '2026-10-27';
const BAD = '2026-10-26';
const NONE = '2026-01-01';

const line = (job: string, status: string, at: string) =>
  JSON.stringify({ at, job, status, owner: 'ana' });

let dir: string;
let app: ReturnType<typeof createApp>;

beforeAll(() => {
  process.env.LANE_MARKER = 'TEST-MARKER';
  dir = mkdtempSync(join(tmpdir(), 'rig-digest-'));
  writeFileSync(
    join(dir, `${GOOD}.jsonl`),
    [
      line('zeta/job', 'ok', '2026-10-28T02:00:00+01:00'),
      line('alpha/job', 'retry', '2026-10-28T02:01:00+01:00'),
      line('alpha/job', 'ok', '2026-10-28T02:02:00+01:00'),
      line('mid/job', 'fail', '2026-10-28T02:03:00+01:00'),
    ].join('\n') + '\n',
  );
  writeFileSync(join(dir, `${EMPTY}.jsonl`), '');
  writeFileSync(
    join(dir, `${BAD}.jsonl`),
    [line('a/job', 'ok', '2026-10-26T02:00:00+01:00'), '{not json'].join('\n') + '\n',
  );
  app = createApp({
    adapter: 'shim',
    installed: '2026-10-29T14:06:00+01:00',
    beatEverySeconds: 60,
    runsDir: dir,
  });
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const page = (n: string) => app.request(`/digest/${n}`);
const api = (n: string) => app.request(`/api/digest/${n}`);

describe('digest routes', () => {
  it('200 for a normal night on both routes', async () => {
    expect((await page(GOOD)).status).toBe(200);
    const res = await api(GOOD);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { night: string; rows: DigestRow[]; badLines: number };
    expect(body.night).toBe(GOOD);
    expect(body.badLines).toBe(0);
    expect(body.rows).toHaveLength(3);
  });

  it('404 for a night with no file', async () => {
    expect((await page(NONE)).status).toBe(404);
    expect((await api(NONE)).status).toBe(404);
  });

  it.each(['nope', '..%2Fx', '2026-1-1'])('404 for a bad night string %s', async (n) => {
    expect((await page(n)).status).toBe(404);
    expect((await api(n)).status).toBe(404);
  });

  it('empty night: nothing ran, empty rows', async () => {
    const res = await page(EMPTY);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
    const json = await api(EMPTY);
    expect(json.status).toBe(200);
    expect(await json.json()).toEqual({ night: EMPTY, rows: [], badLines: 0 });
  });

  it('night with a bad line: 1 line skipped, badLines 1', async () => {
    const html = await (await page(BAD)).text();
    expect(html).toContain('1 line skipped');
    const body = (await (await api(BAD)).json()) as { rows: DigestRow[]; badLines: number };
    expect(body.badLines).toBe(1);
    expect(body.rows).toHaveLength(1);
  });

  it('page and JSON give the same job order', async () => {
    const html = await (await page(GOOD)).text();
    const body = (await (await api(GOOD)).json()) as { rows: DigestRow[] };
    const jobs = body.rows.map((r) => r.job);
    expect(jobs).toEqual(['alpha/job', 'mid/job', 'zeta/job']);
    const inPage = [...html.matchAll(/<td>(?:! )?([a-z]+\/job)<\/td>/g)].map((m) => m[1]);
    expect(inPage).toEqual(jobs);
  });
});
