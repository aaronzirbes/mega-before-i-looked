import { Hono } from 'hono';
import { loadConfig, type RigConfig } from './config.js';
import { NIGHT } from './digest/types.js';
import { readNight } from './digest/read.js';
import { lane } from './lane.js';
import { readStatus } from './status.js';
import { Layout } from './views/layout.js';
import { StatusBoard } from './views/status.js';

export function createApp(config: RigConfig = loadConfig()) {
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true, lane: lane().id }));

  app.get('/', (c) =>
    c.html(
      <Layout title="status" lane={lane()}>
        <StatusBoard status={readStatus(config)} />
      </Layout>,
    ),
  );

  app.get('/digest/:night/json', (c) => {
    const night = c.req.param('night');
    if (!NIGHT.test(night)) return c.json({ error: 'not found' }, 404);
    const result = readNight(config.runsDir, night);
    if (result.kind === 'missing') return c.json({ error: 'not found' }, 404);
    return c.json({ night: result.night, rows: result.rows, badLines: result.badLines });
  });

  return app;
}
