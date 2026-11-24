import type { DigestRow, Night } from '../digest/types.js';

const dash = <span class="mute">—</span>;

function Cell({ value }: { value: string | null }) {
  return value === null || value === '' ? dash : <>{value}</>;
}

function marked(row: DigestRow): boolean {
  return row.retries >= 3 || row.lastStatus === 'fail';
}

export function DigestPage({ night }: { night: Extract<Night, { kind: 'night' }> }) {
  const { rows, badLines } = night;
  return (
    <>
      <h1>digest · {night.night}</h1>
      {badLines > 0 && (
        <p class="warn">{badLines === 1 ? '1 line skipped' : `${badLines} lines skipped`}</p>
      )}
      {rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first</th>
              <th>last</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr class={marked(r) ? 'warn' : undefined} data-marked={marked(r) ? 'true' : undefined}>
                <td>{marked(r) ? `! ${r.job}` : r.job}</td>
                <td><Cell value={r.owner} /></td>
                <td>{r.runs}</td>
                <td>{r.retries}</td>
                <td>{r.lastStatus}</td>
                <td><Cell value={r.lastError} /></td>
                <td><Cell value={r.first} /></td>
                <td><Cell value={r.last} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
