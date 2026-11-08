import { daysUntil, money, pct } from './format';
import { forecastProject } from './forecast';

// ProSight early-warning engine (runs in the browser on real task, budget and warning data).
// Every signal says what it is and why it matters, so the score is never a black box.

export const STATUSES = ['To Do', 'In Progress', 'Completed'];
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const ROLES = ['Frontend Dev', 'Backend Developer', 'Security Engineer', 'DevOps Engineer'];

const isOpen = (t) => t.status !== 'Completed';

export function taskSignals(task) {
  const d = daysUntil(task.deadline);
  return {
    overdue: isOpen(task) && d !== null && d < 0,
    dueSoon: isOpen(task) && d !== null && d >= 0 && d <= 3,
    urgent: isOpen(task) && (task.priority === 'HIGH' || task.priority === 'CRITICAL'),
  };
}

// Returns { score 0-100, level, label, signals[] } for one project.
export function assessProject(project, tasks = [], warnings = [], risks = []) {
  const open = tasks.filter(isOpen);
  const overdue = open.filter((t) => taskSignals(t).overdue);
  const dueSoon = open.filter((t) => taskSignals(t).dueSoon);
  const critical = open.filter((t) => t.priority === 'CRITICAL');
  const inProgress = tasks.filter((t) => t.status === 'In Progress');
  const committed = tasks.reduce((s, t) => s + (Number(t.cost) || 0), 0);
  const budget = Number(project.budget) || 0;
  const budgetUse = budget > 0 ? (committed / budget) * 100 : 0;
  const highWarnings = warnings.filter((w) => w.severity === 'High');
  const medWarnings = warnings.filter((w) => w.severity === 'Medium');

  const signals = [];
  let score = 0;

  if (overdue.length) {
    score += Math.min(45, overdue.length * 20);
    signals.push({ level: 'risk', text: `${overdue.length} overdue ${overdue.length === 1 ? 'task' : 'tasks'}` });
  }
  if (budget > 0 && budgetUse > 100) {
    score += 30;
    signals.push({ level: 'risk', text: `Over budget by ${money(committed - budget)}` });
  } else if (budget > 0 && budgetUse >= 85) {
    score += 20;
    signals.push({ level: 'watch', text: `${pct(budgetUse)} of budget committed` });
  }
  if (highWarnings.length) {
    score += Math.min(30, highWarnings.length * 12);
    signals.push({ level: 'risk', text: `${highWarnings.length} high-severity ${highWarnings.length === 1 ? 'warning' : 'warnings'}` });
  }
  if (critical.length) {
    score += Math.min(15, critical.length * 6);
    signals.push({ level: 'watch', text: `${critical.length} critical ${critical.length === 1 ? 'task' : 'tasks'} open` });
  }
  if (dueSoon.length) {
    score += Math.min(15, dueSoon.length * 5);
    signals.push({ level: 'watch', text: `${dueSoon.length} due in the next 3 days` });
  }
  if (medWarnings.length) {
    score += Math.min(10, medWarnings.length * 4);
    signals.push({ level: 'watch', text: `${medWarnings.length} medium ${medWarnings.length === 1 ? 'warning' : 'warnings'}` });
  }
  const severe = risks.filter((r) => riskLevel(r) === 'risk');
  if (severe.length) {
    score += Math.min(24, severe.length * 12);
    signals.push({ level: 'risk', text: `${severe.length} severe ${severe.length === 1 ? 'risk' : 'risks'} in the register` });
  }
  // Forecast: at the current pace, will the remaining work finish after the last deadline?
  const forecast = forecastProject(tasks);
  if (forecast.status === 'ok' && forecast.slipDays > 3) {
    score += Math.min(20, 8 + forecast.slipDays);
    signals.push({ level: 'risk', text: `Forecast: finishes ${forecast.slipDays} days late` });
  } else if (forecast.status === 'ok' && forecast.slipDays > 0) {
    score += 8;
    signals.push({ level: 'watch', text: `Forecast: finishes ${forecast.slipDays} ${forecast.slipDays === 1 ? 'day' : 'days'} late` });
  }
  // Too much work started at once is a classic bottleneck.
  if (inProgress.length >= 5 && inProgress.length > open.length * 0.6) {
    score += 8;
    signals.push({ level: 'watch', text: `${inProgress.length} tasks in progress at once` });
  }

  score = Math.min(100, score);
  const level = score >= 55 ? 'risk' : score >= 20 ? 'watch' : 'ok';
  const label = { risk: 'At risk', watch: 'Watch', ok: 'On track' }[level];
  const done = tasks.length - open.length;

  return {
    score, level, label, signals, forecast,
    stats: {
      total: tasks.length, open: open.length, done,
      progress: tasks.length ? (done / tasks.length) * 100 : 0,
      overdue: overdue.length, dueSoon: dueSoon.length,
      committed, budget, budgetUse,
    },
  };
}

// Where is work piling up? Groups open tasks by role and flags overloaded roles.
export function roleBottlenecks(tasks = []) {
  const open = tasks.filter(isOpen);
  const byRole = {};
  for (const t of open) {
    const role = t.role || 'Unassigned';
    byRole[role] ??= { role, open: 0, overdue: 0, urgent: 0 };
    const s = taskSignals(t);
    byRole[role].open += 1;
    if (s.overdue) byRole[role].overdue += 1;
    if (s.urgent) byRole[role].urgent += 1;
  }
  const rows = Object.values(byRole);
  const avg = rows.length ? open.length / rows.length : 0;
  for (const r of rows) {
    r.level = r.overdue >= 2 || (r.open >= 3 && r.open >= avg * 1.5) ? 'risk'
      : r.overdue >= 1 || r.open > avg * 1.2 ? 'watch' : 'ok';
  }
  return rows.sort((a, b) => b.open - a.open || b.overdue - a.overdue);
}

export const levelStyles = {
  ok: { text: 'text-ok', bg: 'bg-ok', soft: 'bg-ok-soft' },
  watch: { text: 'text-watch', bg: 'bg-watch', soft: 'bg-watch-soft' },
  risk: { text: 'text-risk', bg: 'bg-risk', soft: 'bg-risk-soft' },
};

/* ---------- Risk register (likelihood x impact) ---------- */
export const RISK_SCALE = ['Low', 'Medium', 'High'];
const scaleValue = (v) => {
  const i = RISK_SCALE.findIndex((x) => x.toLowerCase() === String(v ?? '').toLowerCase());
  return i === -1 ? 2 : i + 1; // unknown values count as Medium
};
// 1-9 score: likelihood (1-3) x impact (1-3)
export const riskScore = (r) => scaleValue(r.likelihood) * scaleValue(r.impact);
export const riskLevel = (r) => {
  const s = riskScore(r);
  return s >= 6 ? 'risk' : s >= 3 ? 'watch' : 'ok';
};

/* ---------- People (assignees) ---------- */
// Open-task load per person. Flags people carrying far more than the team average.
export function personWorkload(tasks = [], users = []) {
  const open = tasks.filter(isOpen);
  const byPerson = {};
  for (const u of users) byPerson[u.username] = { name: u.username, open: 0, overdue: 0, urgent: 0 };
  for (const t of open) {
    if (!t.assignee) continue;
    byPerson[t.assignee] ??= { name: t.assignee, open: 0, overdue: 0, urgent: 0 };
    const s = taskSignals(t);
    byPerson[t.assignee].open += 1;
    if (s.overdue) byPerson[t.assignee].overdue += 1;
    if (s.urgent) byPerson[t.assignee].urgent += 1;
  }
  const rows = Object.values(byPerson);
  const assigned = open.filter((t) => t.assignee).length;
  const avg = rows.length ? assigned / rows.length : 0;
  for (const r of rows) {
    r.level = r.overdue >= 2 || (r.open >= 3 && r.open >= avg * 1.5) ? 'risk'
      : r.overdue >= 1 || (r.open >= 2 && r.open > avg * 1.2) ? 'watch' : 'ok';
  }
  return {
    rows: rows.sort((a, b) => b.open - a.open || b.overdue - a.overdue || a.name.localeCompare(b.name)),
    unassigned: open.filter((t) => !t.assignee).length,
    anyAssigned: assigned > 0,
  };
}
