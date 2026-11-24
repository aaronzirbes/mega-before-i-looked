export type RunStatus = 'ok' | 'retry' | 'fail';

// One line of runs/<night>.jsonl, after parsing.
export type RunLine = {
  at: string;
  job: string;
  status: RunStatus;
  owner: string | null;
  error?: string;
};

// One row per job for one night.
export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number; // every line that parses, retries included
  retries: number; // lines with status "retry"
  lastStatus: RunStatus;
  lastError: string | null; // most recent error seen, even if the last status is "ok"
  first: string; // `at` as logged, offset kept
  last: string;
};

// A night with no file is "missing"; an empty file is a night with no rows.
export type Night =
  | { kind: 'missing'; night: string }
  | { kind: 'night'; night: string; rows: DigestRow[]; badLines: number };

// Rows are sorted by job. The only sort: page and JSON use this order (ADR 0001).
export type ReadNight = (runsDir: string, night: string) => Night;

export const NIGHT = /^\d{4}-\d{2}-\d{2}$/;
