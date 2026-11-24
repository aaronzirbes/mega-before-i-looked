import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read.js';

describe('readNight', () => {
  it('reads runs/2026-10-28.jsonl: 5 jobs, 1 bad line', () => {
    const night = readNight('runs', '2026-10-28');
    if (night.kind !== 'night') throw new Error('expected a night');
    expect(night.badLines).toBe(1);
    expect(night.rows).toEqual([
      { job: 'digest/render', owner: null, runs: 1, retries: 0, lastStatus: 'ok', lastError: null,
        first: '2026-10-29T05:41:09+01:00', last: '2026-10-29T05:41:09+01:00' },
      { job: 'fixtures/refresh', owner: 'rook', runs: 4, retries: 3, lastStatus: 'ok', lastError: 'upstream 503',
        first: '2026-10-29T01:30:00+01:00', last: '2026-10-29T01:37:00+01:00' },
      { job: 'lane/sync', owner: 'rook', runs: 8, retries: 1, lastStatus: 'ok', lastError: 'lock held',
        first: '2026-10-28T23:00:06+01:00', last: '2026-10-29T05:00:04+01:00' },
      { job: 'notes/backup', owner: 'lane-07', runs: 1, retries: 0, lastStatus: 'fail', lastError: 'quota exceeded',
        first: '2026-10-29T04:00:01+01:00', last: '2026-10-29T04:00:01+01:00' },
      { job: 'rig/rotate-logs', owner: 'lane-07', runs: 1, retries: 0, lastStatus: 'ok', lastError: null,
        first: '2026-10-28T23:00:02+01:00', last: '2026-10-28T23:00:02+01:00' },
    ]);
  });

  it('tells a missing night from an empty one', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
    writeFileSync(join(dir, '2026-01-02.jsonl'), '');
    expect(readNight(dir, '2026-01-01')).toEqual({ kind: 'missing', night: '2026-01-01' });
    expect(readNight(dir, '2026-01-02')).toEqual({ kind: 'night', night: '2026-01-02', rows: [], badLines: 0 });
  });

  it('counts a bad line and never throws', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
    writeFileSync(join(dir, '2026-01-03.jsonl'), '{"at":"x","job":"a","status":"ok","owner":null}\n{nope\n{"job":"b"}\n');
    const night = readNight(dir, '2026-01-03');
    if (night.kind !== 'night') throw new Error('expected a night');
    expect(night.badLines).toBe(2);
    expect(night.rows.map((r) => r.job)).toEqual(['a']);
  });
});
