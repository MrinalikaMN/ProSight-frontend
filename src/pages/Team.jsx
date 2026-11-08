import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAsync from '../lib/useAsync';
import { endpoints, loadPortfolio } from '../lib/data';
import { errorMessage } from '../lib/api';
import { roleBottlenecks, personWorkload } from '../lib/risk';
import { Card, CardHeader, PageHeader, Skeleton, EmptyState, ErrorState, Input, LevelBadge, Avatar, ProgressBar } from '../components/ui';
import { IconSearch, IconTeam } from '../components/icons';

const isAdmin = (u) => String(u.role ?? '').replace(/^ROLE_/, '') === 'ADMIN';
const LOAD_LABEL = { ok: 'Has capacity', watch: 'Busy', risk: 'Bottleneck' };

async function loadTeam() {
  const [users, portfolio] = await Promise.all([endpoints.users(), loadPortfolio().catch(() => [])]);
  return { users, tasks: portfolio.flatMap((r) => r.tasks) };
}

export default function Team() {
  const { data, error, loading, reload } = useAsync(loadTeam, []);
  const [query, setQuery] = useState('');
  const roles = useMemo(() => roleBottlenecks(data?.tasks ?? []), [data]);
  const people = useMemo(() => personWorkload(data?.tasks ?? [], data?.users ?? []), [data]);

  const header = <PageHeader title="Team" description="Who's carrying the most open work, by person and by role. Bottlenecks are flagged so you can rebalance early." />;
  if (loading) return <>{header}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div></>;
  if (error) return <>{header}<ErrorState message={errorMessage(error)} onRetry={reload} /></>;

  const byName = Object.fromEntries(people.rows.map((r) => [r.name, r]));
  const maxOpen = Math.max(1, ...people.rows.map((r) => r.open));
  const users = (data.users ?? [])
    .filter((u) => u.username?.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (byName[b.username]?.open ?? 0) - (byName[a.username]?.open ?? 0));
  const admins = data.users.filter(isAdmin).length;
  const bottlenecks = people.rows.filter((r) => r.level === 'risk').length;

  return (
    <>
      {header}

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <p className="text-sm text-muted">
              <span className="font-semibold text-ink">{data.users.length}</span> members, {admins} {admins === 1 ? 'admin' : 'admins'}
              {people.anyAssigned && <>{', '}<span className={bottlenecks ? 'text-risk font-semibold' : ''}>{bottlenecks} {bottlenecks === 1 ? 'bottleneck' : 'bottlenecks'}</span></>}
              {people.unassigned > 0 && <>, {people.unassigned} open {people.unassigned === 1 ? 'task' : 'tasks'} unassigned</>}
            </p>
            <div className="relative sm:w-64">
              <IconSearch size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people" className="h-9 pl-8" aria-label="Search people" />
            </div>
          </div>

          {!people.anyAssigned && data.users.length > 0 && (
            <Card className="mb-4 px-4 py-3 text-sm text-muted">
              Nobody has tasks assigned yet. Open a task on the <Link to="/projects" className="font-semibold text-brand hover:underline">Projects</Link> board and pick someone under "Assigned to" to see each person's workload here.
            </Card>
          )}

          {users.length === 0 ? (
            <Card><EmptyState icon={IconTeam} title={query ? `No one matches "${query}"` : 'No team members yet'}>{query ? 'Check the spelling or clear the search.' : 'People appear here once they register an account.'}</EmptyState></Card>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {users.map((m) => {
                const load = byName[m.username] ?? { open: 0, overdue: 0, urgent: 0, level: 'ok' };
                return (
                  <li key={m.id}>
                    <Card className="p-4">
                      <div className="flex items-center gap-3.5">
                        <Avatar name={m.username} size="lg" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-ink truncate">{m.username}</p>
                          <p className="text-[13px] text-muted">
                            {isAdmin(m) ? 'Administrator' : 'Member'}
                            {m.hasEmail === false && <span className="text-faint">, no email for reminders</span>}
                          </p>
                        </div>
                        {people.anyAssigned && <LevelBadge level={load.level}>{LOAD_LABEL[load.level]}</LevelBadge>}
                      </div>
                      {people.anyAssigned && (
                        <div className="mt-3.5">
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-muted">
                              {load.open} open {load.open === 1 ? 'task' : 'tasks'}
                              {load.urgent ? `, ${load.urgent} high priority` : ''}
                            </span>
                            {load.overdue > 0 && <span className="font-semibold text-risk">{load.overdue} overdue</span>}
                          </div>
                          <ProgressBar value={(load.open / maxOpen) * 100} tone={load.level === 'ok' ? 'brand' : load.level} />
                        </div>
                      )}
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <Card>
          <CardHeader title="Workload by role" description="Open tasks across every project." />
          <ul className="px-5 pb-5 divide-y divide-line">
            {roles.length === 0 && <li className="py-4 text-sm text-muted">No open tasks right now.</li>}
            {roles.map((r) => (
              <li key={r.role} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{r.role}</p>
                  <p className="text-xs text-muted">
                    {r.open} open{r.urgent ? `, ${r.urgent} high priority` : ''}{r.overdue ? `, ${r.overdue} overdue` : ''}
                  </p>
                </div>
                <LevelBadge level={r.level}>{LOAD_LABEL[r.level]}</LevelBadge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
