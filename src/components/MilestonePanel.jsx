import { useState } from 'react';
import useAsync from '../lib/useAsync';
import { endpoints } from '../lib/data';
import { errorMessage } from '../lib/api';
import { daysUntil, parseDate, shortDate } from '../lib/format';
import { taskSignals, levelStyles } from '../lib/risk';
import { cx } from '../lib/cx';
import { useToast } from '../lib/toast';
import { Card, CardHeader, Button, Input, Field, LevelBadge, ConfirmDelete, EmptyState, Skeleton, ErrorState } from './ui';
import { IconCalendar, IconCheck, IconPlus } from './icons';

// The backend may send a date as "2026-11-01" or as [2026, 11, 1].
const toIso = (d) => (Array.isArray(d) ? `${d[0]}-${String(d[1]).padStart(2, '0')}-${String(d[2]).padStart(2, '0')}` : d);
const isDone = (m) => m.completed ?? m.isCompleted ?? false;

// Works out each milestone's state from the tasks that have to finish before it.
function assessMilestone(m, tasks) {
  const due = toIso(m.dueDate);
  const days = daysUntil(due);
  const before = tasks.filter((t) => t.status !== 'Completed' && parseDate(t.deadline) && parseDate(t.deadline) <= parseDate(due));
  const lateBefore = before.filter((t) => taskSignals(t).overdue);
  if (isDone(m)) return { level: 'ok', label: 'Done', note: `Completed, due ${shortDate(due)}` };
  if (days !== null && days < 0) return { level: 'risk', label: 'Missed', note: `${-days} ${days === -1 ? 'day' : 'days'} past due`, before };
  if (lateBefore.length) return { level: 'risk', label: 'At risk', note: `${lateBefore.length} overdue ${lateBefore.length === 1 ? 'task' : 'tasks'} must finish first`, before };
  if (before.length && days !== null && days <= 7) return { level: 'watch', label: 'Tight', note: `${before.length} open ${before.length === 1 ? 'task' : 'tasks'} due before it, ${days === 0 ? 'due today' : `${days} days left`}`, before };
  return { level: 'brand', label: days === null ? 'No date' : days === 0 ? 'Today' : `In ${days} days`, note: before.length ? `${before.length} open ${before.length === 1 ? 'task' : 'tasks'} due before it` : 'No open tasks due before it', before };
}

export default function MilestonePanel({ projectId, tasks }) {
  const toast = useToast();
  const { data, error, loading, reload, setData } = useAsync(() => endpoints.milestones(projectId), [projectId]);
  const [form, setForm] = useState({ name: '', dueDate: '' });
  const [saving, setSaving] = useState(false);

  const milestones = [...(data ?? [])].sort((a, b) => (parseDate(toIso(a.dueDate)) ?? 0) - (parseDate(toIso(b.dueDate)) ?? 0));

  const needsBackend = (err) => [404, 405].includes(err.response?.status) || err.serverRefused;
  const backendMsg = 'Install the updated MilestoneController.java in your backend to enable this.';

  const add = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await endpoints.createMilestone(projectId, { ...form, completed: false });
      setData((ms) => [...(ms ?? []), saved ?? { ...form, id: Date.now() }]);
      setForm({ name: '', dueDate: '' });
      toast('Milestone added');
    } catch (err) {
      toast(errorMessage(err, "Couldn't add the milestone."), 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (m) => {
    const next = !isDone(m);
    setData((ms) => ms.map((x) => (x.id === m.id ? { ...x, completed: next } : x)));
    try {
      await endpoints.updateMilestone(m.id, { completed: next });
      toast(next ? `Completed "${m.name}"` : 'Marked as not done');
    } catch (err) {
      setData((ms) => ms.map((x) => (x.id === m.id ? m : x)));
      toast(needsBackend(err) ? backendMsg : errorMessage(err, "Couldn't update the milestone."), 'error');
    }
  };

  const remove = async (m) => {
    setData((ms) => ms.filter((x) => x.id !== m.id));
    try {
      await endpoints.deleteMilestone(m.id);
      toast('Milestone deleted');
    } catch (err) {
      setData((ms) => [...ms, m]);
      toast(needsBackend(err) ? backendMsg : errorMessage(err, "Couldn't delete the milestone."), 'error');
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-5 items-start">
      <Card className="lg:col-span-3">
        <CardHeader title="Milestones" description="Key dates, checked against the tasks that need to finish before each one." />
        <div className="px-5 pb-5">
          {loading ? (
            <div className="space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
          ) : error ? (
            <ErrorState message={errorMessage(error)} onRetry={reload} />
          ) : milestones.length === 0 ? (
            <EmptyState icon={IconCalendar} title="No milestones yet">
              Add the dates that matter, like a beta release or client demo. ProSight flags a milestone when overdue tasks stand in its way.
            </EmptyState>
          ) : (
            <ol className="relative">
              {milestones.map((m, i) => {
                const a = assessMilestone(m, tasks);
                const done = isDone(m);
                const dot = a.level === 'brand' ? 'bg-brand' : levelStyles[a.level].bg;
                return (
                  <li key={m.id} className="group relative flex gap-4 pb-5 last:pb-0">
                    {i < milestones.length - 1 && <span className="absolute left-[13px] top-7 bottom-0 w-px bg-line" aria-hidden />}
                    <button
                      onClick={() => toggle(m)}
                      className={cx(
                        'relative z-10 mt-0.5 h-7 w-7 shrink-0 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors',
                        done ? 'bg-ok border-ok text-white' : 'bg-surface border-line-strong hover:border-ok'
                      )}
                      aria-label={done ? `Mark ${m.name} as not done` : `Mark ${m.name} as done`}
                    >
                      {done ? <IconCheck size={14} /> : <span className={cx('h-2 w-2 rounded-full', dot)} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cx('font-semibold', done ? 'text-muted line-through decoration-faint' : 'text-ink')}>{m.name}</p>
                        {a.level === 'brand'
                          ? <span className="text-xs font-semibold text-brand">{a.label}</span>
                          : <LevelBadge level={a.level}>{a.label}</LevelBadge>}
                      </div>
                      <p className="text-[13px] text-muted mt-0.5">{shortDate(toIso(m.dueDate))}. {a.note}.</p>
                      {!done && a.before?.length > 0 && (
                        <p className="text-xs text-faint mt-1 truncate">Depends on: {a.before.slice(0, 3).map((t) => t.title).join(', ')}{a.before.length > 3 ? ` and ${a.before.length - 3} more` : ''}</p>
                      )}
                    </div>
                    <div className="sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <ConfirmDelete onConfirm={() => remove(m)} label="Delete milestone" />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader title="Add a milestone" />
        <form onSubmit={add} className="px-5 pb-5 space-y-3">
          <Field label="Name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Beta release" /></Field>
          <Field label="Due date"><Input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
          <div className="flex justify-end pt-1">
            <Button type="submit" size="sm" loading={saving}>{!saving && <IconPlus size={14} />} Add milestone</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
