import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useAsync from '../lib/useAsync';
import { loadPortfolio, endpoints } from '../lib/data';
import { errorMessage } from '../lib/api';
import { assessProject, taskSignals, levelStyles } from '../lib/risk';
import { dueLabel, money } from '../lib/format';
import {
  Button, Card, CardHeader, PageHeader, LevelBadge, Skeleton, EmptyState, ErrorState, Input, Select, ConfirmDelete
} from '../components/ui';
import { cx } from '../lib/cx';
import { IconAlert, IconPlus, IconPulse, IconCheck } from '../components/icons';
import { useToast } from '../lib/toast';

const SEVERITY_LEVEL = { High: 'risk', Medium: 'watch', Low: 'ok' };
const FILTERS = ['All', 'High', 'Medium', 'Low'];

function formatLogged(createdAt) {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Builds the automatic early warnings for one project from its tasks and budget.
function detectedWarnings(project, tasks) {
  const out = [];
  for (const t of tasks) {
    const s = taskSignals(t);
    if (s.overdue) out.push({ key: `o${t.id}`, level: 'risk', title: t.title, detail: `${dueLabel(t.deadline)}${t.role ? `, assigned to ${t.role}` : ''}` });
    else if (s.dueSoon && s.urgent) out.push({ key: `d${t.id}`, level: 'watch', title: t.title, detail: `${dueLabel(t.deadline)}, ${t.priority.toLowerCase()} priority` });
  }
  const committed = tasks.reduce((n, t) => n + (Number(t.cost) || 0), 0);
  const budget = Number(project.budget) || 0;
  if (budget > 0 && committed > budget) {
    out.unshift({ key: 'budget', level: 'risk', title: 'Over budget', detail: `Tasks cost ${money(committed)} against a ${money(budget)} budget` });
  } else if (budget > 0 && committed / budget >= 0.85) {
    out.unshift({ key: 'budget', level: 'watch', title: 'Budget nearly used', detail: `${money(committed)} of ${money(budget)} committed` });
  }
  return out;
}

export default function Warnings() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const { data, error, loading, reload, setData } = useAsync(loadPortfolio, []);
  const [filter, setFilter] = useState('All');
  const [draft, setDraft] = useState({ message: '', severity: 'Medium' });
  const [saving, setSaving] = useState(false);

  const rows = useMemo(
    () => (data ?? []).map((r) => ({ ...r, risk: assessProject(r.project, r.tasks, r.warnings, r.risks) })).sort((a, b) => b.risk.score - a.risk.score),
    [data]
  );
  const current = rows.find((r) => String(r.project.id) === params.get('id')) ?? rows[0];

  const header = <PageHeader title="Warnings" description="Early warnings ProSight detects from deadlines and budgets, plus the risks your team logs by hand." />;

  if (loading) return <>{header}<div className="space-y-4"><Skeleton className="h-12 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div></>;
  if (error) return <>{header}<ErrorState message={errorMessage(error)} onRetry={reload} /></>;
  if (!current) {
    return <>{header}<Card><EmptyState icon={IconAlert} title="No projects to watch yet" action={<Link to="/projects?new=1"><Button><IconPlus size={16} /> New project</Button></Link>}>Warnings belong to a project. Create one first.</EmptyState></Card></>;
  }

  const pid = current.project.id;
  const patchWarnings = (fn) => setData((rs) => rs.map((r) => (r.project.id === pid ? { ...r, warnings: fn(r.warnings) } : r)));
  const detected = detectedWarnings(current.project, current.tasks);
  const logged = [...current.warnings]
    .filter((w) => filter === 'All' || w.severity === filter)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const counts = Object.fromEntries(FILTERS.map((f) => [f, f === 'All' ? current.warnings.length : current.warnings.filter((w) => w.severity === f).length]));

  const addWarning = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await endpoints.createWarning(pid, draft);
      patchWarnings((ws) => [{ createdAt: new Date().toISOString(), ...draft, ...saved }, ...ws]);
      setDraft({ message: '', severity: draft.severity });
      toast('Warning logged');
    } catch (err) {
      toast(errorMessage(err, "Couldn't log the warning."), 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeWarning = async (w) => {
    patchWarnings((ws) => ws.filter((x) => x.id !== w.id));
    try {
      await endpoints.deleteWarning(pid, w.id);
      toast('Warning resolved');
    } catch (err) {
      patchWarnings((ws) => [w, ...ws]);
      toast(errorMessage(err, "Couldn't remove the warning."), 'error');
    }
  };

  return (
    <>
      {header}

      {/* Project switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <Select
          value={pid} onChange={(e) => setParams({ id: e.target.value })}
          className="sm:max-w-md font-semibold" aria-label="Project"
        >
          {rows.map(({ project, risk }) => (
            <option key={project.id} value={project.id}>{project.name} ({risk.label.toLowerCase()})</option>
          ))}
        </Select>
        <div className="flex items-center gap-2">
          <LevelBadge level={current.risk.level}>{current.risk.label}</LevelBadge>
          <span className="text-sm text-muted">Risk score {current.risk.score}/100</span>
          <Link to={`/projects?id=${pid}`} className="text-sm font-semibold text-brand hover:underline ml-2">Open board</Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 items-start">
        {/* Detected */}
        <Card className="lg:col-span-2">
          <CardHeader title="Detected automatically" description="Overdue work, urgent deadlines and budget pressure." />
          {detected.length === 0 ? (
            <div className="flex items-center gap-3 px-5 pb-5 text-sm text-muted">
              <span className="h-8 w-8 rounded-lg bg-ok-soft text-ok flex items-center justify-center"><IconCheck size={16} /></span>
              Nothing detected. Deadlines and budget look healthy.
            </div>
          ) : (
            <ul className="px-5 pb-5 space-y-3">
              {detected.map((d) => (
                <li key={d.key} className="flex gap-3">
                  <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', levelStyles[d.level].bg)} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{d.title}</p>
                    <p className={cx('text-[13px]', levelStyles[d.level].text)}>{d.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Logged */}
        <Card className="lg:col-span-3 overflow-hidden">
          <CardHeader title="Logged by your team" description="Risks people have raised. Resolve them once they're handled." />

          <form onSubmit={addWarning} className="mx-5 mb-4 flex flex-col sm:flex-row gap-2 rounded-lg border border-line bg-surface-2 p-2">
            <Input
              required value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })}
              placeholder="Describe a risk, e.g. vendor API contract still unsigned" className="flex-1 bg-surface" aria-label="Warning message"
            />
            <div className="flex gap-2">
              <Select value={draft.severity} onChange={(e) => setDraft({ ...draft, severity: e.target.value })} className="w-32 bg-surface" aria-label="Severity">
                <option>High</option><option>Medium</option><option>Low</option>
              </Select>
              <Button type="submit" loading={saving} className="shrink-0">Log warning</Button>
            </div>
          </form>

          <div className="flex gap-1 px-5 pb-3" role="tablist" aria-label="Filter by severity">
            {FILTERS.map((f) => (
              <button
                key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
                className={cx(
                  'h-8 px-3 rounded-full text-[13px] font-semibold cursor-pointer transition-colors',
                  filter === f ? 'bg-ink text-canvas' : 'text-muted hover:text-ink hover:bg-surface-2'
                )}
              >
                {f} <span className={filter === f ? 'opacity-70' : 'text-faint'}>{counts[f]}</span>
              </button>
            ))}
          </div>

          {logged.length === 0 ? (
            <EmptyState icon={IconPulse} title={filter === 'All' ? 'No warnings logged' : `No ${filter.toLowerCase()} warnings`}>
              {filter === 'All' ? 'When someone spots a risk the numbers can\'t see, log it above so the whole team knows.' : 'Try another filter.'}
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {logged.map((w) => (
                <li key={w.id} className="group flex items-start gap-3 px-5 py-3.5">
                  <LevelBadge level={SEVERITY_LEVEL[w.severity] ?? 'watch'}>{w.severity}</LevelBadge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink break-words">{w.message}</p>
                    {w.createdAt && <p className="text-xs text-muted mt-0.5">Logged {formatLogged(w.createdAt)}</p>}
                  </div>
                  <div className="sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <ConfirmDelete onConfirm={() => removeWarning(w)} label="Resolve warning" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
