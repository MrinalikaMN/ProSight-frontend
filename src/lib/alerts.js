import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { loadPortfolio } from './data';
import { taskSignals, riskLevel } from './risk';
import { dueLabel, money } from './format';

const READ_KEY = 'prosight-read-alerts';
const readSet = () => {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); } catch { return new Set(); }
};
const saveRead = (set) => {
  try { localStorage.setItem(READ_KEY, JSON.stringify([...set].slice(-500))); } catch { /* storage blocked */ }
};

// Turns portfolio data into a list of alerts, most serious first.
export function buildAlerts(rows = []) {
  const out = [];
  for (const { project, tasks = [], warnings = [], risks = [], alerts = [] } of rows) {
    const where = (tab = 'board') => `/projects?id=${project.id}&tab=${tab}`;
    for (const t of tasks) {
      const s = taskSignals(t);
      if (s.overdue) {
        out.push({ id: `overdue-${t.id}`, level: 'risk', title: `Overdue: ${t.title}`, detail: `${project.name}, ${dueLabel(t.deadline).toLowerCase()}${t.assignee ? `, ${t.assignee}` : ''}`, to: where() });
      } else if (s.dueSoon && s.urgent) {
        out.push({ id: `soon-${t.id}-${t.deadline}`, level: 'watch', title: `${t.title} is due soon`, detail: `${project.name}, ${dueLabel(t.deadline).toLowerCase()}, ${t.priority.toLowerCase()} priority`, to: where() });
      }
    }
    const committed = tasks.reduce((n, t) => n + (Number(t.cost) || 0), 0);
    const budget = Number(project.budget) || 0;
    if (budget > 0 && committed > budget) {
      out.push({ id: `budget-over-${project.id}-${Math.round(committed)}`, level: 'risk', title: `${project.name} is over budget`, detail: `${money(committed)} committed against ${money(budget)}`, to: where() });
    } else if (budget > 0 && committed / budget >= 0.85) {
      out.push({ id: `budget-near-${project.id}`, level: 'watch', title: `${project.name} has used most of its budget`, detail: `${money(committed)} of ${money(budget)} committed`, to: where() });
    }
    for (const w of warnings) {
      if (w.severity === 'High') out.push({ id: `warning-${w.id}`, level: 'risk', title: w.message, detail: `High warning on ${project.name}`, to: `/warnings?id=${project.id}` });
    }
    for (const r of risks) {
      if (riskLevel(r) === 'risk') out.push({ id: `risk-${r.id}`, level: 'risk', title: `Severe risk: ${r.title}`, detail: project.name, to: where('risks') });
    }
    for (const a of alerts) {
      if (String(a.status).toUpperCase() === 'RESOLVED') continue;
      const sev = String(a.severity).toUpperCase();
      out.push({ id: `alert-${a.id}`, level: sev === 'HIGH' || sev === 'CRITICAL' ? 'risk' : 'watch', title: a.message, detail: project.name, to: where() });
    }
  }
  const rank = { risk: 0, watch: 1 };
  return out.sort((a, b) => rank[a.level] - rank[b.level]);
}

// Loads alerts, refreshes them every 3 minutes and when the page changes,
// and remembers which ones this person has already seen (in this browser).
export function useAlerts() {
  const location = useLocation();
  const [alerts, setAlerts] = useState([]);
  const [read, setRead] = useState(readSet);

  const refresh = useCallback(async () => {
    try { setAlerts(buildAlerts(await loadPortfolio())); } catch { /* the page itself shows connection errors */ }
  }, []);

  useEffect(() => {
    // Fetching here is syncing with an external system (the API), which is what effects are for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const t = setInterval(refresh, 180000);
    return () => clearInterval(t);
  }, [refresh, location.pathname]);

  const markRead = useCallback((ids) => {
    setRead((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      saveRead(next);
      return next;
    });
  }, []);

  const items = alerts.map((a) => ({ ...a, unread: !read.has(a.id) }));
  return { items, unread: items.filter((a) => a.unread).length, markRead, refresh };
}
