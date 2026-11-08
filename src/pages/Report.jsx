import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useAsync from '../lib/useAsync';
import { endpoints, loadPortfolio } from '../lib/data';
import { errorMessage } from '../lib/api';
import { assessProject, taskSignals, riskLevel, riskScore, levelStyles, STATUSES } from '../lib/risk';
import { money, pct, dueLabel, shortDate } from '../lib/format';
import { cx } from '../lib/cx';
import { forecastSummary, fmtRate } from '../lib/forecast';
import { Button, LevelBadge, Skeleton, ErrorState, ProgressBar } from '../components/ui';
import { Logo } from '../components/Layout';
import { IconChevron, IconDownload, IconPrint } from '../components/icons';

const toIso = (d) => (Array.isArray(d) ? `${d[0]}-${String(d[1]).padStart(2, '0')}-${String(d[2]).padStart(2, '0')}` : d);

async function loadReport(id) {
  const rows = await loadPortfolio();
  const row = rows.find((r) => String(r.project.id) === String(id)) ?? rows[0];
  if (!row) return { rows, row: null };
  const [milestones, recommendations] = await Promise.all([
    endpoints.milestones(row.project.id).catch(() => []),
    endpoints.recommendations(row.project.id).catch(() => []),
  ]);
  return { rows, row, milestones, recommendations };
}

// Builds a CSV the person can open in Excel or Google Sheets.
function downloadCsv(project, tasks, risk) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    ['ProSight project report'], ['Project', project.name], ['Generated', new Date().toLocaleString()],
    ['Risk score', `${risk.score}/100 (${risk.label})`], ['Budget', project.budget], ['Committed', risk.stats.committed],
    ['Progress', pct(risk.stats.progress)], ['Forecast', forecastSummary(risk.forecast)], [],
    ['Task', 'Status', 'Priority', 'Role', 'Assigned to', 'Deadline', 'Cost', 'Flag'],
    ...tasks.map((t) => {
      const s = taskSignals(t);
      return [t.title, t.status, t.priority, t.role, t.assignee ?? '', t.deadline, t.cost, s.overdue ? 'Overdue' : s.dueSoon ? 'Due soon' : ''];
    }),
  ];
  const blob = new Blob(['﻿' + lines.map((l) => l.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${project.name.replace(/[^\w-]+/g, '-').toLowerCase()}-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function Section({ title, children, note }) {
  return (
    <section className="mt-8 break-inside-avoid">
      <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2 mb-3">
        <h2 className="text-[15px] font-bold text-ink">{title}</h2>
        {note && <span className="text-xs text-muted">{note}</span>}
      </div>
      {children}
    </section>
  );
}

const th = 'text-left text-xs font-semibold text-muted py-2 pr-3';
const td = 'py-2 pr-3 align-top text-sm text-ink';

export default function Report() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const { data, error, loading, reload } = useAsync(() => loadReport(id), [id]);

  const risk = useMemo(() => data?.row && assessProject(data.row.project, data.row.tasks, data.row.warnings, data.row.risks), [data]);

  if (loading) return <div className="mx-auto max-w-[860px] p-6 space-y-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-28" /><Skeleton className="h-64" /></div>;
  if (error) return <div className="mx-auto max-w-[860px] p-6"><ErrorState message={errorMessage(error)} onRetry={reload} /></div>;
  if (!data.row) return <div className="mx-auto max-w-[860px] p-6 text-muted">No project to report on yet. <Link to="/projects" className="text-brand font-semibold">Create one</Link>.</div>;

  const { project, tasks, warnings, risks = [] } = data.row;
  const { milestones = [], recommendations = [] } = data;
  const s = risk.stats;
  const budgetTone = s.budgetUse > 100 ? 'risk' : s.budgetUse >= 85 ? 'watch' : 'ok';
  const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

  return (
    <div className="min-h-screen bg-canvas print:bg-white">
      {/* Toolbar (not printed) */}
      <div className="print:hidden sticky top-0 z-10 bg-surface/90 backdrop-blur border-b border-line">
        <div className="mx-auto max-w-[860px] px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link to={`/projects?id=${project.id}`} className="flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
            <IconChevron size={16} className="rotate-180" /> Back to project
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => downloadCsv(project, tasks, risk)}><IconDownload size={15} /> CSV</Button>
            <Button size="sm" onClick={() => window.print()}><IconPrint size={15} /> Save as PDF</Button>
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-[860px] px-4 sm:px-6 py-8 print:py-0 print:px-0">
        <div className="bg-surface border border-line rounded-xl shadow-card p-6 sm:p-10 print:border-0 print:shadow-none print:p-0">
          <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <Logo />
              <h1 className="mt-5 text-[28px] leading-tight font-extrabold tracking-[-0.02em] text-ink">{project.name}</h1>
              <p className="text-muted mt-1">Project status report, {new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="sm:text-right">
              <LevelBadge level={risk.level}>{risk.label}</LevelBadge>
              <p className="text-sm text-muted mt-1.5">Risk score <span className="font-bold text-ink">{risk.score}/100</span></p>
            </div>
          </header>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            {[
              ['Progress', pct(s.progress), `${s.done} of ${s.total} tasks done`],
              ['Budget committed', pct(s.budgetUse), `${money(s.committed)} of ${money(s.budget)}`, budgetTone],
              ['Overdue tasks', s.overdue, s.overdue ? 'Need follow-up' : 'None', s.overdue ? 'risk' : undefined],
              ['Open risks', risks.length, `${risks.filter((r) => riskLevel(r) === 'risk').length} severe`],
            ].map(([label, value, note, tone]) => (
              <div key={label} className="rounded-lg border border-line p-3.5">
                <p className="text-xs text-muted">{label}</p>
                <p className={cx('text-2xl font-extrabold mt-0.5 tabular-nums', tone ? levelStyles[tone].text : 'text-ink')}>{value}</p>
                <p className="text-xs text-muted">{note}</p>
              </div>
            ))}
          </div>
          <div className="mt-4"><ProgressBar value={s.progress} /></div>
          <p className={cx('mt-3 text-sm font-semibold', risk.forecast?.status === 'ok' ? levelStyles[risk.forecast.level].text : 'text-muted')}>
            Forecast: {forecastSummary(risk.forecast)}
            {risk.forecast?.status === 'ok' && <span className="font-normal text-muted"> (at {fmtRate(risk.forecast.perWeek)} tasks a week)</span>}
          </p>

          <Section title="Early warning signals">
            {risk.signals.length ? (
              <ul className="space-y-1.5">
                {risk.signals.map((sg) => (
                  <li key={sg.text} className="flex items-center gap-2.5 text-sm">
                    <span className={cx('h-2 w-2 rounded-full shrink-0', levelStyles[sg.level].bg)} />
                    <span className="text-ink">{sg.text}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">No warning signs. Deadlines, budget and risks look healthy.</p>}
          </Section>

          {recommendations.length > 0 && (
            <Section title="Suggested actions" note="Generated by Gemini from high-impact risks">
              <ul className="space-y-2">
                {recommendations.map((r, i) => (
                  <li key={r.id ?? i} className="text-sm text-ink border-l-2 border-brand pl-3 whitespace-pre-line">
                    {r.suggestedAction}
                    {r.triggerEvent && <span className="block text-xs text-muted mt-0.5">For: {r.triggerEvent}</span>}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Tasks" note={`${tasks.length} total`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead><tr className="border-b border-line"><th className={th}>Task</th><th className={th}>Role</th><th className={th}>Owner</th><th className={th}>Priority</th><th className={th}>Deadline</th><th className={cx(th, 'text-right pr-0')}>Cost</th></tr></thead>
                {STATUSES.map((status) => {
                  const list = tasks.filter((t) => t.status === status).sort((a, b) => (order[a.priority] ?? 9) - (order[b.priority] ?? 9));
                  if (!list.length) return null;
                  return (
                    <tbody key={status} className="break-inside-avoid">
                      <tr><td colSpan={6} className="pt-4 pb-1 text-xs font-bold text-muted">{status} ({list.length})</td></tr>
                      {list.map((t) => {
                        const sg = taskSignals(t);
                        return (
                          <tr key={t.id} className="border-b border-line last:border-0">
                            <td className={td}>{t.title}</td>
                            <td className={cx(td, 'text-muted')}>{t.role}</td>
                            <td className={cx(td, 'text-muted')}>{t.assignee ?? 'Unassigned'}</td>
                            <td className={cx(td, 'capitalize')}>{t.priority?.toLowerCase()}</td>
                            <td className={cx(td, sg.overdue ? 'text-risk font-semibold' : sg.dueSoon ? 'text-watch font-semibold' : 'text-muted')}>
                              {status === 'Completed' ? shortDate(t.deadline) : dueLabel(t.deadline)}
                            </td>
                            <td className={cx(td, 'text-right pr-0 tabular-nums')}>{money(t.cost)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  );
                })}
              </table>
            </div>
          </Section>

          {risks.length > 0 && (
            <Section title="Risk register" note={`${risks.length} logged`}>
              <table className="w-full">
                <thead><tr className="border-b border-line"><th className={th}>Risk</th><th className={th}>Likelihood</th><th className={th}>Impact</th><th className={th}>Severity</th></tr></thead>
                <tbody>
                  {[...risks].sort((a, b) => riskScore(b) - riskScore(a)).map((r) => (
                    <tr key={r.id} className="border-b border-line last:border-0">
                      <td className={td}>{r.title}{r.description && <span className="block text-xs text-muted">{r.description}</span>}</td>
                      <td className={cx(td, 'text-muted')}>{r.likelihood}</td>
                      <td className={cx(td, 'text-muted')}>{r.impact}</td>
                      <td className={td}><LevelBadge level={riskLevel(r)}>{{ risk: 'Severe', watch: 'Moderate', ok: 'Minor' }[riskLevel(r)]}</LevelBadge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {milestones.length > 0 && (
            <Section title="Milestones">
              <ul className="space-y-1.5">
                {milestones.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-4 text-sm">
                    <span className={cx('text-ink', (m.completed ?? m.isCompleted) && 'line-through text-muted')}>{m.name}</span>
                    <span className="text-muted">{shortDate(toIso(m.dueDate))}{(m.completed ?? m.isCompleted) ? ', done' : ''}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {warnings.length > 0 && (
            <Section title="Warnings logged by the team">
              <ul className="space-y-1.5">
                {warnings.map((w) => (
                  <li key={w.id} className="flex items-start gap-2.5 text-sm">
                    <LevelBadge level={{ High: 'risk', Medium: 'watch', Low: 'ok' }[w.severity] ?? 'watch'}>{w.severity}</LevelBadge>
                    <span className="text-ink">{w.message}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <p className="mt-10 pt-4 border-t border-line text-xs text-faint">Generated by ProSight on {new Date().toLocaleString()}.</p>
        </div>
      </article>
    </div>
  );
}
