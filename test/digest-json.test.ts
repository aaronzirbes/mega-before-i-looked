import { describe, expect, it, vi } from 'vitest';
import type { Night } from '../src/digest/types.js';

const readNight = vi.hoisted(() => vi.fn());
vi.mock('../src/digest/read.js', () => ({ readNight }));

import { createApp } from '../src/app.js';

const config = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: 'runs' };

describe('digest json', () => {
  it('returns rows and badLines', async () => {
    const night: Night = { kind: 'night', night: '2026-10-28', rows: [], badLines: 1 };
    readNight.mockReturnValue(night);
    const res = await createApp(config).request('/api/digest/2026-10-28');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ night: '2026-10-28', rows: [], badLines: 1 });
    expect(readNight).toHaveBeenCalledWith('runs', '2026-10-28');
  });

  it('404 for a missing night', async () => {
    readNight.mockReturnValue({ kind: 'missing', night: '2026-01-01' });
    expect((await createApp(config).request('/api/digest/2026-01-01')).status).toBe(404);
  });

  it('404 for a bad night param', async () => {
    expect((await createApp(config).request('/api/digest/nope')).status).toBe(404);
  });
});
