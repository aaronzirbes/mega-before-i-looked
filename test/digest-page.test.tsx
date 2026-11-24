import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DigestRow, Night } from '../src/digest/types.js';

vi.mock('../src/digest/read.js', () => ({ readNight: vi.fn() }));

import { createApp } from '../src/app.js';
import { readNight } from '../src/digest/read.js';

const config = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: 'runs' };

const row = (o: Partial<DigestRow> & { job: string }): DigestRow => ({
  owner: 'ana', runs: 1, retries: 0, lastStatus: 'ok', lastError: null,
  first: '2026-10-28T02:00:00+01:00', last: '2026-10-28T02:01:00+01:00', ...o,
});

const fixture: Night = {
  kind: 'night', night: '2026-10-28', badLines: 1,
  rows: [
    row({ job: 'digest/render', owner: null }),
    row({ job: 'fixtures/refresh', runs: 4, retries: 3 }),
    row({ job: 'index/build' }),
    row({ job: 'notes/backup', lastStatus: 'fail', lastError: 'disk full' }),
    row({ job: 'ping/lane' }),
  ],
};

describe('digest page', () => {
  beforeEach(() => vi.mocked(readNight).mockReset());

  it('renders rows, marks, dashes and skipped lines', async () => {
    vi.mocked(readNight).mockReturnValue(fixture);
    const res = await createApp(config).request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(readNight).toHaveBeenCalledWith('runs', '2026-10-28');
    expect(html.match(/<tr[ >]/g)?.length).toBe(6);
    expect(html.match(/data-marked="true"/g)?.length).toBe(2);
    expect(html).toContain('! fixtures/refresh');
    expect(html).toContain('! notes/backup');
    expect(html).toContain('1 line skipped');
    expect(html).toMatch(/digest\/render<\/td><td><span class="mute">—<\/span>/);
  });

  it('404 on bad night and missing file', async () => {
    const res = await createApp(config).request('/digest/abc');
    expect(res.status).toBe(404);
    vi.mocked(readNight).mockReturnValue({ kind: 'missing', night: '2026-01-01' });
    expect((await createApp(config).request('/digest/2026-01-01')).status).toBe(404);
  });

  it('empty night says nothing ran', async () => {
    vi.mocked(readNight).mockReturnValue({ kind: 'night', night: '2026-10-27', rows: [], badLines: 0 });
    const html = await (await createApp(config).request('/digest/2026-10-27')).text();
    expect(html).toContain('nothing ran');
  });
});
