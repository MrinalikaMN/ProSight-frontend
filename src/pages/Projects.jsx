import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import useAsync from '../lib/useAsync';
import { loadPortfolio, endpoints, cleanTask, cleanProject } from '../lib/data';
import { errorMessage } from '../lib/api';
import { assessProject, taskSignals, STATUSES, PRIORITIES, ROLES, levelStyles } from '../lib/risk';
import { money, pct, dueLabel } from '../lib/format';
import { forecastProject, forecastSummary, fmtRate } from '../lib/forecast';
import {
  Button, Card, LevelBadge, Tag, Skeleton, EmptyState, ErrorState, Modal, Field, Input, Select, Textarea,
  ConfirmDelete, ProgressBar, Avatar,
} from '../components/ui';
import { cx } from '../lib/cx';
import { IconPlus, IconSearch, IconPencil, IconBoard, IconCalendar, IconAlert, IconPulse } from '../components/icons';
import RiskPanel from '../components/RiskPanel';
import MilestonePanel from '../components/MilestonePanel';

const TABS = [
  { id: 'board', label: 'Board', icon: IconBoard },
  { id: 'risks', label: 'Risks', icon: IconAlert },
  { id: 'milestones', label: 'Milestones', icon: IconCalendar },
];
import { useToast } from '../lib/toast';

const COLUMN_META = {
  'To Do': { label: 'To do', dot: 'bg-line-strong' },
  'In Progress': { label: 'In progress', dot: 'bg-watch' },
  Completed: { label: 'Completed', dot: 'bg-ok' },
};
const PRIORITY_STYLE = {
  LOW: 'text-muted',
  MEDIUM: 'text-brand',
  HIGH: 'text-watch',
  CRITICAL: 'text-risk',
};
const PROJECT_STATUSES = [
  ['planning', 'Planning'],
  ['in progress', 'In progress'],
  ['completed', 'Completed'],
];

/* ---------- Modals ---------- */
const emptyTask = { title: '', description: '', cost: '', priority: 'MEDIUM', deadline: '', role: ROLES[0], status: 'To Do', assignee: '' };

// Tells the person whether the assignee will get an email about this task.
function assigneeHint(name, users, previous) {
  if (!name) return 'Pick someone to track their workload and email them about the deadline.';
  if (name === previous) return 'ProSight uses this to spot people who are overloaded.';
  const user = users.find((u) => u.username === name);
  if (name === localStorage.getItem('username')) return 'Assigned to you.';
  if (user && user.hasEmail === false) return `${name} hasn't added an email, so they won't be notified.`;
  if (user?.hasEmail) return `${name} will get an email about this task.`;
  return 'ProSight uses this to spot people who are overloaded.';
}

function TaskModal({ initial, users = [], onClose, onSave }) {
  const [form, setForm] = useState(() => ({ ...emptyTask, ...initial }));
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const editing = !!initial?.id;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const ok = await onSave({ ...form, cost: Number(form.cost) || 0, assignee: form.assignee ?? '' });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Modal
      open onClose={onClose}
      title={editing ? 'Edit task' : 'New task'}
      description={editing ? undefined : `Goes in the ${COLUMN_META[form.status]?.label ?? 'To do'} column.`}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" form="task-form" loading={saving}>{editing ? 'Save changes' : 'Add task'}</Button>
      </>}
    >
      <form id="task-form" onSubmit={submit} className="space-y-4">
        <Field label="Title">
          <Input required value={form.title} onChange={set('title')} placeholder="e.g. Set up the payments database" />
        </Field>
        <Field label="Description">
          <Textarea value={form.description ?? ''} onChange={set('description')} placeholder="What needs to happen, and what done looks like" rows={2} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Deadline">
            <Input type="date" required value={form.deadline ?? ''} onChange={set('deadline')} />
          </Field>
          <Field label="Cost">
            <Input type="number" min="0" step="any" required value={form.cost} onChange={set('cost')} placeholder="500" />
          </Field>
          <Field label="Role">
            <Select value={form.role ?? ROLES[0]} onChange={set('role')}>
              {[...new Set([...ROLES, form.role].filter(Boolean))].map((r) => <option key={r}>{r}</option>)}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Assigned to" hint={assigneeHint(form.assignee, users, initial?.assignee)}>
          <Select value={form.assignee ?? ''} onChange={set('assignee')}>
            <option value="">Unassigned</option>
            {[...new Set([...users.map((u) => u.username), form.assignee].filter(Boolean))].map((name) => <option key={name} value={name}>{name}</option>)}
          </Select>
        </Field>
        {editing && (
          <Field label="Status">
            <Select value={form.status} onChange={set('status')}>
              {STATUSES.map((s) => <option key={s} value={s}>{COLUMN_META[s].label}</option>)}
            </Select>
          </Field>
        )}
      </form>
    </Modal>
  );
}

function ProjectModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(() => ({ name: initial?.name ?? '', budget: initial?.budget ?? '', status: (initial?.status ?? 'planning').toLowerCase() }));
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const ok = await onSave({ ...form, budget: Number(form.budget) || 0 });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Modal
      open onClose={onClose} size="sm"
      title={initial ? 'Edit project' : 'New project'}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" form="project-form" loading={saving}>{initial ? 'Save changes' : 'Create project'}</Button>
      </>}
    >
      <form id="project-form" onSubmit={submit} className="space-y-4">
        <Field label="Project name">
          <Input required value={form.name} onChange={set('name')} placeholder="e.g. Checkout redesign" />
        </Field>
        <Field label="Budget" hint="ProSight warns you when task costs reach 85% of this.">
          <Input type="number" min="0" step="any" required value={form.budget} onChange={set('budget')} placeholder="10000" />
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={set('status')}>
            {PROJECT_STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
      </form>
    </Modal>
  );
}

/* ---------- Board pieces ---------- */
function TaskCard({ task, index, onOpen, onDelete }) {
  const s = taskSignals(task);
  const due = dueLabel(task.deadline);
  const dueTone = s.overdue ? 'text-risk font-semibold' : s.dueSoon ? 'text-watch font-semibold' : 'text-muted';
  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(p, snap) => (
        <div
          ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}
          onClick={() => onOpen(task)}
          onKeyDown={(e) => { if (e.key === 'Enter') onOpen(task); }}
          className={cx(
            'group relative rounded-lg border bg-surface p-3.5 cursor-pointer transition-[box-shadow,border-color]',
            s.overdue ? 'border-risk/50' : 'border-line hover:border-line-strong',
            snap.isDragging ? 'shadow-2xl ring-2 ring-brand/30 rotate-[1deg]' : 'shadow-sm'
          )}
        >
          {s.overdue && <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r bg-risk" aria-hidden />}
          <div className="flex items-start gap-2">
            <h4 className={cx('flex-1 text-sm font-semibold text-ink leading-snug', task.status === 'Completed' && 'line-through decoration-faint text-muted')}>
              {task.title || task.name}
            </h4>
            <div className="sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity -mr-1 -mt-0.5">
              <ConfirmDelete onConfirm={() => onDelete(task)} label="Delete task" size={14} />
            </div>
          </div>
          {task.description && <p className="text-xs text-muted line-clamp-2 mt-1">{task.description}</p>}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <Tag className={PRIORITY_STYLE[task.priority]}>{task.priority?.charAt(0) + task.priority?.slice(1).toLowerCase()}</Tag>
            {task.role && <Tag>{task.role}</Tag>}
          </div>
          <div className="flex items-center justify-between gap-2 mt-2.5 text-xs">
            {due && task.status !== 'Completed' ? (
              <span className={cx('inline-flex items-center gap-1', dueTone)}><IconCalendar size={13} />{due}</span>
            ) : <span />}
            <span className="flex items-center gap-2">
              {task.assignee && <Avatar name={task.assignee} size="xs" />}
              <span className="font-semibold text-ink">{money(task.cost)}</span>
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
}

function Column({ status, tasks, onAdd, onOpen, onDelete }) {
  const meta = COLUMN_META[status];
  return (
    <div className="flex flex-col min-w-[272px] lg:min-w-0 rounded-xl bg-surface-2 border border-line">
      <div className="flex items-center justify-between px-3.5 h-11">
        <span className="flex items-center gap-2 text-sm font-bold text-ink">
          <span className={cx('h-2 w-2 rounded-full', meta.dot)} />
          {meta.label}
          <span className="text-muted font-semibold">{tasks.length}</span>
        </span>
        <button
          onClick={() => onAdd(status)}
          className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-surface cursor-pointer" aria-label={`Add task to ${meta.label}`}
        >
          <IconPlus size={16} />
        </button>
      </div>
      <Droppable droppableId={status}>
        {(p, snap) => (
          <div
            ref={p.innerRef} {...p.droppableProps}
            className={cx('flex-1 px-2.5 pb-2.5 space-y-2.5 min-h-[120px] rounded-b-xl transition-colors', snap.isDraggingOver && 'bg-brand-soft/60')}
          >
            {tasks.map((t, i) => <TaskCard key={t.id} task={t} index={i} onOpen={onOpen} onDelete={onDelete} />)}
            {p.placeholder}
            {tasks.length === 0 && !snap.isDraggingOver && (
              <button
                onClick={() => onAdd(status)}
                className="w-full rounded-lg border border-dashed border-line-strong py-6 text-xs font-semibold text-muted hover:text-ink hover:border-faint cursor-pointer"
              >
                Drop a task here or add one
              </button>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

/* ---------- Page ---------- */
export default function Projects() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const { data, error, loading, reload, setData } = useAsync(loadPortfolio, []);
  const { data: users } = useAsync(endpoints.users, []);
  const me = localStorage.getItem('username');
  const [who, setWho] = useState('all');
  const [query, setQuery] = useState('');
  const [taskModal, setTaskModal] = useState({ open: false, initial: null });
  const [projectModal, setProjectModal] = useState({ open: params.get('new') === '1', initial: null });

  const rows = data ?? [];
  const selectedId = params.get('id') ?? (rows[0] ? String(rows[0].project.id) : null);
  const current = rows.find((r) => String(r.project.id) === String(selectedId)) ?? rows[0];
  const risk = useMemo(() => current && assessProject(current.project, current.tasks, current.warnings, current.risks), [current]);
  const filtered = rows.filter((r) => r.project.name?.toLowerCase().includes(query.toLowerCase()));

  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'board';
  const setTab = (t) => setParams({ id: String(current.project.id), tab: t });
  const selectProject = (id) => setParams({ id: String(id), tab });
  const patchCurrent = (fn) => setData((rs) => rs.map((r) => (r.project.id === current.project.id ? fn(r) : r)));

  /* Task actions */
  const saveTask = async (form) => {
    try {
      if (form.id) {
        const { id, ...body } = form;
        delete body.createdAt; // timestamps are managed by the server
        delete body.completedAt;
        const saved = await endpoints.updateTask(current.project.id, id, body);
        patchCurrent((r) => ({ ...r, tasks: r.tasks.map((t) => (t.id === id ? { ...t, ...cleanTask(saved ?? form) } : t)) }));
        toast('Task updated');
      } else {
        const saved = await endpoints.createTask(current.project.id, form);
        patchCurrent((r) => ({ ...r, tasks: [...r.tasks, cleanTask(saved ?? { ...form, id: Date.now() })] }));
        toast('Task added');
      }
      return true;
    } catch (e) {
      toast(errorMessage(e, "Couldn't save the task."), 'error');
      return false;
    }
  };

  const deleteTask = async (task) => {
    const before = current.tasks;
    patchCurrent((r) => ({ ...r, tasks: r.tasks.filter((t) => t.id !== task.id) }));
    try {
      await endpoints.deleteTask(current.project.id, task.id);
      toast('Task deleted');
    } catch (e) {
      patchCurrent((r) => ({ ...r, tasks: before }));
      toast(errorMessage(e, "Couldn't delete the task."), 'error');
    }
  };

  // Drag and drop: move the card instantly, then save. Undo if the save fails.
  const onDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const id = Number(draggableId);
    const task = current.tasks.find((t) => t.id === id);
    const newStatus = destination.droppableId;
    const before = current.tasks;

    const others = before.filter((t) => t.id !== id);
    const destList = others.filter((t) => t.status === newStatus);
    const anchor = destList[destination.index];
    const moved = { ...task, status: newStatus, completedAt: newStatus === 'Completed' ? (task.status === 'Completed' ? task.completedAt : new Date().toISOString()) : null };
    const next = [...others];
    next.splice(anchor ? next.indexOf(anchor) : next.length, 0, moved);
    patchCurrent((r) => ({ ...r, tasks: next }));

    if (task.status === newStatus) return; // reordering inside a column is visual only
    try {
      await endpoints.updateTask(current.project.id, id, { status: newStatus });
      if (newStatus === 'Completed') toast(`Completed "${task.title}"`);
    } catch (e) {
      patchCurrent((r) => ({ ...r, tasks: before }));
      toast(errorMessage(e, "Couldn't move the task."), 'error');
    }
  };

  /* Project actions */
  const saveProject = async (form) => {
    try {
      if (projectModal.initial) {
        const body = { ...cleanProject(current.project), ...form };
        const saved = await endpoints.updateProject(current.project.id, body);
        patchCurrent((r) => ({ ...r, project: { ...r.project, ...cleanProject(saved ?? body) } }));
        toast('Project updated');
      } else {
        const saved = await endpoints.createProject(form);
        setData((rs) => [...(rs ?? []), { project: cleanProject(saved), tasks: [], warnings: [], risks: [], alerts: [] }]);
        selectProject(saved.id);
        toast('Project created');
      }
      return true;
    } catch (e) {
      toast(errorMessage(e, "Couldn't save the project."), 'error');
      return false;
    }
  };

  const deleteProject = async () => {
    const id = current.project.id;
    try {
      await endpoints.deleteProject(id);
      const remaining = rows.filter((r) => r.project.id !== id);
      setData(remaining);
      setParams(remaining[0] ? { id: String(remaining[0].project.id) } : {});
      toast('Project deleted');
    } catch (e) {
      toast(errorMessage(e, "Couldn't delete the project. It may still have risks, alerts or recommendations attached."), 'error');
    }
  };

  const openNewProject = () => setProjectModal({ open: true, initial: null });
  const closeProjectModal = () => {
    setProjectModal((m) => ({ ...m, open: false }));
    if (params.get('new')) { params.delete('new'); setParams(params); }
  };

  /* ---------- Render ---------- */
  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Skeleton className="h-[420px] rounded-xl hidden lg:block" />
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-xl" />
          <div className="grid gap-4 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-xl" />)}</div>
        </div>
      </div>
    );
  }
  if (error) return <ErrorState message={errorMessage(error)} onRetry={reload} />;

  const modals = (
    <>
      {projectModal.open && <ProjectModal initial={projectModal.initial} onClose={closeProjectModal} onSave={saveProject} />}
      {taskModal.open && <TaskModal initial={taskModal.initial} users={users ?? []} onClose={() => setTaskModal({ open: false, initial: null })} onSave={saveTask} />}
    </>
  );

  if (!rows.length) {
    return (
      <>
        <Card>
          <EmptyState
            icon={IconBoard} title="No projects yet"
            action={<Button onClick={openNewProject}><IconPlus size={16} /> New project</Button>}
          >
            A project holds a budget and a board of tasks. Create one to start tracking deadlines, costs and risks.
          </EmptyState>
        </Card>
        {modals}
      </>
    );
  }

  const matchesWho = (t) => who === 'all' || (who === 'none' ? !t.assignee : t.assignee === who);
  const byStatus = (s) => current.tasks.filter((t) => t.status === s && matchesWho(t));
  const forecast = risk.forecast ?? forecastProject(current.tasks);
  const { stats } = risk;
  const budgetTone = stats.budgetUse > 100 ? 'risk' : stats.budgetUse >= 85 ? 'watch' : 'ok';

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] items-start">
      {/* Project list (desktop) */}
      <Card className="hidden lg:flex flex-col sticky top-8 max-h-[calc(100vh-4rem)] overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <h2 className="text-[15px] font-bold text-ink">Projects</h2>
          <Button size="sm" onClick={openNewProject}><IconPlus size={14} /> New</Button>
        </div>
        <div className="px-3 pb-2">
          <div className="relative">
            <IconSearch size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects" className="h-9 pl-8" aria-label="Search projects" />
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto scroll-thin px-2 pb-2 space-y-0.5">
          {filtered.map(({ project, tasks, warnings, risks }) => {
            const r = assessProject(project, tasks, warnings, risks);
            const active = project.id === current.project.id;
            return (
              <li key={project.id}>
                <button
                  onClick={() => selectProject(project.id)}
                  className={cx(
                    'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left cursor-pointer transition-colors',
                    active ? 'bg-brand-soft' : 'hover:bg-surface-2'
                  )}
                >
                  <span className={cx('h-2 w-2 shrink-0 rounded-full', levelStyles[r.level].bg)} title={r.label} />
                  <span className={cx('flex-1 truncate text-sm', active ? 'font-bold text-brand' : 'font-medium text-ink')}>{project.name}</span>
                  <span className="text-xs text-muted">{tasks.length}</span>
                </button>
              </li>
            );
          })}
          {!filtered.length && <li className="px-3 py-6 text-center text-sm text-muted">No projects match "{query}"</li>}
        </ul>
      </Card>

      <div className="min-w-0 space-y-5">
        {/* Project picker (mobile) */}
        <div className="flex gap-2 lg:hidden">
          <Select value={current.project.id} onChange={(e) => selectProject(e.target.value)} aria-label="Choose project">
            {rows.map(({ project }) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </Select>
          <Button onClick={openNewProject} size="icon" aria-label="New project"><IconPlus size={16} /></Button>
        </div>

        {/* Project header */}
        <Card className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[24px] leading-tight font-extrabold tracking-[-0.02em] text-ink">{current.project.name}</h1>
                <LevelBadge level={risk.level}>{risk.label}</LevelBadge>
                {current.project.status && <Tag className="capitalize">{current.project.status}</Tag>}
              </div>
              {risk.signals.length > 0 && (
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                  {risk.signals.map((s) => <span key={s.text} className={levelStyles[s.level].text}>{s.text}</span>)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="secondary" size="sm" onClick={() => setProjectModal({ open: true, initial: current.project })}>
                <IconPencil size={14} /> Edit
              </Button>
              <Link to={`/report?id=${current.project.id}`}>
                <Button variant="secondary" size="sm"><IconPulse size={14} /> Report</Button>
              </Link>
              <ConfirmDelete onConfirm={deleteProject} label="Delete project" className="h-8 px-2" />
              <Button size="sm" onClick={() => setTaskModal({ open: true, initial: { status: 'To Do' } })}>
                <IconPlus size={14} /> New task
              </Button>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-5">
            <div>
              <div className="flex items-baseline justify-between text-sm mb-1.5">
                <span className="text-muted">Budget committed</span>
                <span><span className={cx('font-bold', levelStyles[budgetTone].text)}>{money(stats.committed)}</span> <span className="text-muted">of {money(stats.budget)}</span></span>
              </div>
              <ProgressBar value={stats.budgetUse} tone={budgetTone} />
            </div>
            <div>
              <div className="flex items-baseline justify-between text-sm mb-1.5">
                <span className="text-muted">Progress</span>
                <span><span className="font-bold text-ink">{pct(stats.progress)}</span> <span className="text-muted">{stats.done} of {stats.total} tasks</span></span>
              </div>
              <ProgressBar value={stats.progress} tone="brand" />
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-baseline justify-between text-sm mb-1">
                <span className="text-muted">Forecast</span>
                {forecast.status === 'ok' && <span className="text-muted">{fmtRate(forecast.perWeek)} tasks a week</span>}
              </div>
              <p className={cx('text-sm font-semibold', forecast.status === 'ok' ? levelStyles[forecast.level].text : 'text-muted')}>
                {forecastSummary(forecast)}
              </p>
              {forecast.status === 'ok' && forecast.slipDays > 0 && forecast.neededPerWeek && (
                <p className="text-xs text-muted mt-0.5">Needs about {fmtRate(forecast.neededPerWeek)} a week to finish on time.</p>
              )}
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-line" role="tablist" aria-label="Project views">
          {TABS.map(({ id, label, icon: Icon }) => {
            const count = id === 'risks' ? (current.risks?.length ?? 0) : null;
            return (
              <button
                key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                className={cx(
                  'relative flex items-center gap-2 px-3.5 h-10 text-sm font-semibold cursor-pointer transition-colors',
                  tab === id ? 'text-brand' : 'text-muted hover:text-ink'
                )}
              >
                <Icon size={16} /> {label}
                {count > 0 && <span className="text-xs text-faint">{count}</span>}
                {tab === id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
              </button>
            );
          })}
        </div>

        {tab === 'risks' && (
          <RiskPanel
            key={current.project.id}
            projectId={current.project.id}
            risks={current.risks ?? []}
            onChange={(risks) => patchCurrent((r) => ({ ...r, risks }))}
          />
        )}
        {tab === 'milestones' && <MilestonePanel key={current.project.id} projectId={current.project.id} tasks={current.tasks} />}

        {/* Board */}
        {tab === 'board' && <>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">Showing</span>
          <div className="w-52">
          <Select value={who} onChange={(e) => setWho(e.target.value)} className="h-9" aria-label="Filter tasks by person">
            <option value="all">Everyone's tasks</option>
            {me && <option value={me}>My tasks</option>}
            <option value="none">Unassigned</option>
            {(users ?? []).filter((u) => u.username !== me).map((u) => <option key={u.id} value={u.username}>{u.username}</option>)}
          </Select>
          </div>
        </div>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto scroll-thin pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-3 lg:overflow-visible">
            {STATUSES.map((s) => (
              <Column
                key={s} status={s} tasks={byStatus(s)}
                onAdd={(status) => setTaskModal({ open: true, initial: { status } })}
                onOpen={(task) => setTaskModal({ open: true, initial: task })}
                onDelete={deleteTask}
              />
            ))}
          </div>
        </DragDropContext>
        <p className="text-xs text-faint">Drag cards between columns to change their status. Click a card to edit it.</p>
        </>}
      </div>

      {modals}
    </div>
  );
}
