import { parseDate, shortDate } from './format';

// Backend timestamps arrive as "2026-10-28T21:15:00" or [2026,10,28,21,15,0].
export function parseTimestamp(v) {
  if (!v) return null;
  if (Array.isArray(v)) return new Date(v[0], (v[1] ?? 1) - 1, v[2] ?? 1, v[3] ?? 0, v[4] ?? 0, v[5] ?? 0);
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

const DAY = 86400000;
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

/**
 * Forecasts when a project's open tasks will be finished, based on how many tasks
 * were completed recently (last 21 days). Returns:
 *  { status: 'done' }                          nothing left to do
 *  { status: 'insufficient', remaining, need } not enough completion history yet
 *  { status: 'ok', remaining, perWeek, finish, target, slipDays, neededPerWeek, level }
 */
export function forecastProject(tasks = []) {
  const open = tasks.filter((t) => t.status !== 'Completed');
  if (!tasks.length) return { status: 'empty' };
  if (!open.length) return { status: 'done' };

  const today = startOfToday();
  const windowStart = new Date(today.getTime() - 21 * DAY);
  const recent = tasks
    .map((t) => (t.status === 'Completed' ? parseTimestamp(t.completedAt) : null))
    .filter((d) => d && d >= windowStart);

  // Target: the latest deadline among the open tasks.
  const deadlines = open.map((t) => parseDate(t.deadline)).filter(Boolean);
  const target = deadlines.length ? new Date(Math.max(...deadlines)) : null;
  const daysToTarget = target ? Math.max(1, Math.round((target - today) / DAY)) : null;
  const neededPerWeek = target ? (open.length / daysToTarget) * 7 : null;

  if (recent.length < 2) {
    return { status: 'insufficient', remaining: open.length, need: 2 - recent.length, target, neededPerWeek };
  }

  // Pace over the period that actually has history (at least a week, at most 21 days).
  const earliest = new Date(Math.min(...recent));
  const spanDays = Math.min(21, Math.max(7, Math.ceil((today - earliest) / DAY) + 1));
  const perDay = recent.length / spanDays;
  const daysNeeded = Math.ceil(open.length / perDay);
  const finish = new Date(today.getTime() + daysNeeded * DAY);
  const slipDays = target ? Math.round((finish - target) / DAY) : 0;
  const level = slipDays > 3 ? 'risk' : slipDays > 0 ? 'watch' : 'ok';

  return { status: 'ok', remaining: open.length, perWeek: perDay * 7, finish, target, slipDays, neededPerWeek, level };
}

// One-line human summary, e.g. "Finishes around Nov 20, 5 days after the last deadline".
export function forecastSummary(f) {
  if (!f) return '';
  if (f.status === 'empty') return 'No tasks yet';
  if (f.status === 'done') return 'All tasks are done';
  if (f.status === 'insufficient') {
    return `Forecast starts after ${f.need} more ${f.need === 1 ? 'task is' : 'tasks are'} completed`;
  }
  const when = `Finishes around ${shortDate(f.finish.toISOString().slice(0, 10))}`;
  if (!f.target) return when;
  if (f.slipDays > 0) return `${when}, ${f.slipDays} ${f.slipDays === 1 ? 'day' : 'days'} after the last deadline`;
  if (f.slipDays < 0) return `${when}, ${-f.slipDays} ${f.slipDays === -1 ? 'day' : 'days'} ahead of the last deadline`;
  return `${when}, right on the last deadline`;
}

export const fmtRate = (n) => (n >= 10 ? Math.round(n) : Math.round(n * 10) / 10).toString();
