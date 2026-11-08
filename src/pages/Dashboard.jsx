import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAsync from '../lib/useAsync';
import { loadPortfolio, endpoints } from '../lib/data';
import { errorMessage } from '../lib/api';
import { assessProject, roleBottlenecks, personWorkload, levelStyles } from '../lib/risk';
import { money, pct, greeting } from '../lib/format';
import { Card, CardHeader, PageHeader, LevelBadge, SignalMeter, Skeleton, EmptyState, ErrorState, Button, ProgressBar } from '../components/ui';
import { cx } from '../lib/cx';
import { IconBoard, IconChevron, IconPlus, IconPulse, IconMail, IconX } from '../components/icons';

function Kpi({ label, value, note, tone }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[13px] font-medium text-muted">{label}</p>
      <p className={cx('text-[28px] leading-tight font-extrabold tracking-[-0.02em] mt-1 tabular-nums', tone ? levelStyles[tone].text : 'text-ink')}>{value}</p>
      {note && <p className="text-xs text-muted mt-0.5">{note}</p>}
    </div>
  );
}

const NUDGE_KEY = 'prosight-email-nudge-dismissed';

// One-time prompt for people who haven't added an email for deadline reminders.
function EmailNudge() {
  const { data: me } = useAsync(() => endpoints.me().catch(() => null), []);
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem(NUDGE_KEY) === '1'; } catch { return false; } });
  if (hidden || !me || me.email) return null;
  const dismiss = () => { setHidden(true); try { localStorage.setItem(NUDGE_KEY, '1'); } catch { /* storage blocked */ } };
  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3">
      <IconMail size={18} className="text-brand shrink-0" />
      <p className="flex-1 text-sm text-ink">
        Get an email when a task is assigned to you or a deadline is close.{' '}
        <Link to="/settings" className="font-semibold text-brand hover:underline">Add your email</Link>
      </p>
      <button onClick={dismiss} className="p-1 rounded-md text-muted hover:text-ink cursor-pointer" aria-label="Dismiss"><IconX size={15} /></button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const username = localStorage.getItem('username') || 'there';
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAsync(loadPortfolio, []);
  const [groupBy, setGroupBy] = useState('person');

  const view = useMemo(() => {
    if (!data) return null;
    const rows = data
      .map((r) => ({ ...r, risk: assessProject(r.project, r.tasks, r.warnings, r.risks) }))
      .sort((a, b) => b.risk.score - a.risk.score);
    const allTasks = data.flatMap((r) => r.tasks);
    const totals = rows.reduce(
      (t, r) => ({
        open: t.open + r.risk.stats.open,
        overdue: t.overdue + r.risk.stats.overdue,
        dueSoon: t.dueSoon + r.risk.stats.dueSoon,
        committed: t.committed + r.risk.stats.committed,
        budget: t.budget + r.risk.stats.budget,
      }),
      { open: 0, overdue: 0, dueSoon: 0, committed: 0, budget: 0 }
    );
    const status = {
      todo: allTasks.filter((t) => t.status === 'To Do').length,
      doing: allTasks.filter((t) => t.status === 'In Progress').length,
      done: allTasks.filter((t) => t.status === 'Completed').length,
    };
    return {
      rows, totals, status, total: allTasks.length,
      atRisk: rows.filter((r) => r.risk.level === 'risk').length,
      roles: roleBottlenecks(allTasks),
      people: personWorkload(allTasks, []),
    };
  }, [data]);

  const header = (
    <PageHeader
      title={`${greeting()}, ${username}`}
      description="Here's where your projects stand today, with the ones that need attention first."
      actions={<Link to="/projects"><Button variant="secondary"><IconBoard size={16} /> Open boards</Button></Link>}
    />
  );

  if (loading) return <>{header}<DashboardSkeleton /></>;
  if (error) return <>{header}<ErrorState message={errorMessage(error)} onRetry={reload} /></>;

  if (!view.rows.length) {
    return (
      <>
        {header}
        <Card>
          <EmptyState
            icon={IconPulse} title="No projects yet"
            action={<Button onClick={() => navigate('/projects?new=1')}><IconPlus size={16} /> Create your first project</Button>}
          >
            Create a project and add tasks with deadlines and costs. ProSight will start flagging risks and bottlenecks as soon as there's work to watch.
          </EmptyState>
        </Card>
      </>
    );
  }

  const { rows, totals, status, total, atRisk, roles, people } = view;
  const byPerson = groupBy === 'person' && people.anyAssigned;
  const loadRows = byPerson
    ? people.rows.map((r) => ({ key: r.name, label: r.name, ...r }))
    : roles.map((r) => ({ key: r.role, label: r.role, ...r }));
  const budgetUse = totals.budget ? (totals.committed / totals.budget) * 100 : 0;

  return (
    <>
      {header}
      <EmailNudge />

      {/* KPI strip */}
      <Card className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-line mb-6 overflow-hidden">
        <Kpi label="Projects" value={rows.length} note={atRisk ? `${atRisk} at risk` : 'None at risk'} />
        <Kpi label="Open tasks" value={totals.open} note={`${totals.dueSoon} due in the next 3 days`} />
        <Kpi label="Overdue" value={totals.overdue} tone={totals.overdue ? 'risk' : undefined} note={totals.overdue ? 'Needs follow-up' : 'All deadlines on track'} />
        <Kpi
          label="Budget committed" value={pct(budgetUse)}
          tone={budgetUse > 100 ? 'risk' : budgetUse >= 85 ? 'watch' : undefined}
          note={`${money(totals.committed)} of ${money(totals.budget)}`}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Watchlist */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader title="Project watchlist" description="Ranked by risk score, from overdue work, budget use, open warnings and upcoming deadlines." />
          <ul className="divide-y divide-line">
            {rows.map(({ project, risk }, i) => (
              <li key={project.id}>
                <Link
                  to={`/projects?id=${project.id}`}
                  className="group grid grid-cols-[1fr_auto] gap-x-4 gap-y-2.5 px-5 py-4 hover:bg-surface-2 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-bold text-ink truncate">{project.name}</span>
                    <LevelBadge level={risk.level}>{risk.label}</LevelBadge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted">
                    <span className="font-semibold text-ink">{risk.score}</span>/100
                    <IconChevron size={16} className="text-faint group-hover:text-ink transition-colors" />
                  </div>
                  <div className="col-span-2">
                    <SignalMeter score={risk.score} level={risk.level} animate delay={i * 60} />
                  </div>
                  <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
                    {risk.signals.length ? (
                      risk.signals.slice(0, 3).map((s) => (
                        <span key={s.text} className={levelStyles[s.level].text}>{s.text}</span>
                      ))
                    ) : (
                      <span className="text-muted">No warning signs</span>
                    )}
                    <span className="text-muted ml-auto">
                      {risk.stats.done} of {risk.stats.total} tasks done
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          {/* Bottlenecks */}
          <Card>
            <CardHeader
              title="Where work is piling up"
              description={byPerson ? 'Open tasks per person. People with a backlog or overdue work are flagged.' : 'Open tasks by role. Roles with a backlog or overdue work are flagged.'}
              action={people.anyAssigned && (
                <div className="flex rounded-lg border border-line p-0.5 text-xs font-semibold shrink-0" role="tablist" aria-label="Group workload">
                  {[['person', 'People'], ['role', 'Roles']].map(([k, l]) => (
                    <button key={k} role="tab" aria-selected={groupBy === k} onClick={() => setGroupBy(k)}
                      className={cx('px-2.5 py-1 rounded-md cursor-pointer', groupBy === k ? 'bg-brand-soft text-brand' : 'text-muted hover:text-ink')}>{l}</button>
                  ))}
                </div>
              )}
            />
            <div className="px-5 pb-5 space-y-3.5">
              {loadRows.length === 0 && <p className="text-sm text-muted py-4">No open tasks right now.</p>}
              {loadRows.map((r) => {
                const max = Math.max(1, ...loadRows.map((x) => x.open));
                return (
                  <div key={r.key}>
                    <div className="flex items-baseline justify-between gap-2 text-sm mb-1.5">
                      <span className="font-semibold text-ink truncate">{r.label}</span>
                      <span className="text-muted whitespace-nowrap">
                        {r.open} open
                        {r.overdue > 0 && <span className="text-risk font-semibold">, {r.overdue} overdue</span>}
                      </span>
                    </div>
                    <ProgressBar value={(r.open / max) * 100} tone={r.level === 'ok' ? 'brand' : r.level} />
                  </div>
                );
              })}
              {byPerson && people.unassigned > 0 && (
                <p className="text-xs text-muted">{people.unassigned} open {people.unassigned === 1 ? 'task has' : 'tasks have'} nobody assigned.</p>
              )}
            </div>
          </Card>

          {/* Status breakdown */}
          <Card>
            <CardHeader title="Task status" description={`${total} tasks across all projects`} />
            <div className="px-5 pb-5">
              {total === 0 ? (
                <p className="text-sm text-muted py-4">No tasks yet.</p>
              ) : (
                <>
                  <div className="flex h-3 w-full overflow-hidden rounded-full gap-[2px]">
                    {status.done > 0 && <div className="bg-ok" style={{ width: `${(status.done / total) * 100}%` }} />}
                    {status.doing > 0 && <div className="bg-watch" style={{ width: `${(status.doing / total) * 100}%` }} />}
                    {status.todo > 0 && <div className="bg-line-strong" style={{ width: `${(status.todo / total) * 100}%` }} />}
                  </div>
                  <dl className="grid grid-cols-3 gap-2 mt-4">
                    {[
                      ['Completed', status.done, 'bg-ok'],
                      ['In progress', status.doing, 'bg-watch'],
                      ['To do', status.todo, 'bg-line-strong'],
                    ].map(([label, n, dot]) => (
                      <div key={label}>
                        <dt className="flex items-center gap-1.5 text-xs text-muted"><span className={cx('h-2 w-2 rounded-full', dot)} />{label}</dt>
                        <dd className="text-lg font-bold text-ink mt-0.5">{n} <span className="text-xs font-medium text-muted">{pct((n / total) * 100)}</span></dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
