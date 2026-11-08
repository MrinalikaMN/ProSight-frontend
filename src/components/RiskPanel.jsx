import { useState } from 'react';
import useAsync from '../lib/useAsync';
import { endpoints } from '../lib/data';
import { errorMessage } from '../lib/api';
import { RISK_SCALE, riskLevel, riskScore, levelStyles } from '../lib/risk';
import { cx } from '../lib/cx';
import { useToast } from '../lib/toast';
import { Card, CardHeader, Button, Input, Select, Field, Textarea, LevelBadge, ConfirmDelete, EmptyState, Skeleton } from './ui';
import { IconPlus, IconPulse, IconRefresh } from './icons';

const LEVEL_LABEL = { risk: 'Severe', watch: 'Moderate', ok: 'Minor' };
const norm = (v) => RISK_SCALE.find((x) => x.toLowerCase() === String(v ?? '').toLowerCase()) ?? 'Medium';

/* 3x3 likelihood x impact grid. Click a cell to filter the list. */
function HeatMap({ risks, active, onPick }) {
  const cell = (likelihood, impact) => risks.filter((r) => norm(r.likelihood) === likelihood && norm(r.impact) === impact);
  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-between py-1 text-[11px] font-semibold text-muted [writing-mode:vertical-rl] rotate-180 text-center">
        Impact
      </div>
      <div className="flex-1">
        <div className="grid grid-cols-[52px_repeat(3,1fr)] gap-1.5">
          {[...RISK_SCALE].reverse().map((impact) => (
            <div key={impact} className="contents">
              <div className="flex items-center text-xs font-semibold text-muted">{impact}</div>
              {RISK_SCALE.map((likelihood) => {
                const items = cell(likelihood, impact);
                const level = riskLevel({ likelihood, impact });
                const key = `${likelihood}|${impact}`;
                const on = active === key;
                return (
                  <button
                    key={key}
                    onClick={() => onPick(on ? null : key)}
                    aria-pressed={on}
                    aria-label={`${items.length} risks with ${likelihood.toLowerCase()} likelihood and ${impact.toLowerCase()} impact`}
                    className={cx(
                      'h-14 rounded-lg flex items-center justify-center text-lg font-extrabold transition-[box-shadow,opacity] cursor-pointer',
                      levelStyles[level].soft, levelStyles[level].text,
                      items.length === 0 && 'opacity-45',
                      on && 'ring-2 ring-offset-2 ring-offset-surface ring-current'
                    )}
                  >
                    {items.length || ''}
                  </button>
                );
              })}
            </div>
          ))}
          <div />
          {RISK_SCALE.map((l) => <div key={l} className="text-center text-xs font-semibold text-muted pt-1">{l}</div>)}
        </div>
        <p className="text-center text-[11px] font-semibold text-muted mt-1">Likelihood</p>
      </div>
    </div>
  );
}

function AddRiskForm({ projectId, onAdded }) {
  const toast = useToast();
  const [form, setForm] = useState({ title: '', description: '', likelihood: 'Medium', impact: 'Medium' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await endpoints.createRisk(projectId, { ...form, status: 'Open' });
      onAdded(saved ?? { ...form, id: Date.now() }, form.impact === 'High');
      setForm({ title: '', description: '', likelihood: 'Medium', impact: 'Medium' });
      toast(form.impact === 'High' ? 'Risk added. An AI-suggested action was generated.' : 'Risk added');
    } catch (err) {
      toast(errorMessage(err, "Couldn't add the risk."), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Risk">
        <Input required value={form.title} onChange={set('title')} placeholder="e.g. Key supplier may miss delivery" />
      </Field>
      <Field label="What could happen">
        <Textarea rows={2} value={form.description} onChange={set('description')} placeholder="Describe the impact on the project if this happens" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Likelihood">
          <Select value={form.likelihood} onChange={set('likelihood')}>{RISK_SCALE.map((v) => <option key={v}>{v}</option>)}</Select>
        </Field>
        <Field label="Impact">
          <Select value={form.impact} onChange={set('impact')}>{RISK_SCALE.map((v) => <option key={v}>{v}</option>)}</Select>
        </Field>
      </div>
      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-xs text-muted">High-impact risks get an AI-suggested action.</p>
        <Button type="submit" size="sm" loading={saving} className="shrink-0">
          {!saving && <IconPlus size={14} />} {saving && form.impact === 'High' ? 'Asking AI' : 'Add risk'}
        </Button>
      </div>
    </form>
  );
}

function Suggestions({ projectId, refreshKey }) {
  const { data, error, loading, reload } = useAsync(() => endpoints.recommendations(projectId), [projectId, refreshKey]);
  const items = [...(data ?? [])].reverse();
  return (
    <Card>
      <CardHeader
        title="Suggested actions"
        description="Mitigation steps generated by Gemini when a high-impact risk is logged."
        action={<button onClick={() => reload()} className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-surface-2 cursor-pointer" aria-label="Refresh suggestions"><IconRefresh size={16} /></button>}
      />
      <div className="px-5 pb-5">
        {loading ? (
          <div className="space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
        ) : error ? (
          <p className="text-sm text-risk">{errorMessage(error, "Couldn't load suggestions.")}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted py-2">No suggestions yet. Log a risk with high impact and ProSight will propose a way to contain it.</p>
        ) : (
          <ul className="space-y-2.5">
            {items.map((rec, i) => (
              <li key={rec.id ?? i} className="rounded-lg border border-line bg-surface-2 p-3.5">
                <p className="text-sm text-ink leading-relaxed whitespace-pre-line">{rec.suggestedAction}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs">
                  {rec.triggerEvent && <span className="text-muted">For: <span className="text-ink font-medium">{rec.triggerEvent}</span></span>}
                  {rec.expectedImpactPercentage > 0 && (
                    <span className="font-semibold text-ok">Could cut the impact by {rec.expectedImpactPercentage}%</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

export default function RiskPanel({ projectId, risks, onChange }) {
  const toast = useToast();
  const [filter, setFilter] = useState(null);
  const [aiKey, setAiKey] = useState(0);

  const sorted = [...risks].sort((a, b) => riskScore(b) - riskScore(a));
  const shown = filter ? sorted.filter((r) => `${norm(r.likelihood)}|${norm(r.impact)}` === filter) : sorted;

  const remove = async (r) => {
    onChange(risks.filter((x) => x.id !== r.id));
    try {
      await endpoints.deleteRisk(r.id);
      toast('Risk removed');
    } catch (err) {
      onChange(risks);
      toast(errorMessage(err, "Couldn't remove the risk."), 'error');
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-5 items-start">
      <div className="lg:col-span-3 space-y-5">
        <Card>
          <CardHeader title="Risk heat map" description="Each risk placed by how likely it is and how much damage it would do. Top right needs action first." />
          <div className="px-5 pb-5"><HeatMap risks={risks} active={filter} onPick={setFilter} /></div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Risk register"
            description={filter ? `Showing ${filter.split('|')[0].toLowerCase()} likelihood, ${filter.split('|')[1].toLowerCase()} impact.` : `${risks.length} ${risks.length === 1 ? 'risk' : 'risks'}, most serious first.`}
            action={filter && <Button variant="ghost" size="sm" onClick={() => setFilter(null)}>Show all</Button>}
          />
          {shown.length === 0 ? (
            <EmptyState icon={IconPulse} title={filter ? 'No risks in this square' : 'No risks logged yet'}>
              {filter ? 'Pick another square or show all.' : 'Think about what could derail this project, then add it with the form.'}
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {shown.map((r) => {
                const level = riskLevel(r);
                return (
                  <li key={r.id} className="group flex items-start gap-3 px-5 py-3.5">
                    <LevelBadge level={level}>{LEVEL_LABEL[level]}</LevelBadge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink">{r.title}</p>
                      {r.description && <p className="text-[13px] text-muted mt-0.5">{r.description}</p>}
                      <p className="text-xs text-faint mt-1">{norm(r.likelihood)} likelihood, {norm(r.impact).toLowerCase()} impact</p>
                    </div>
                    <div className="sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <ConfirmDelete onConfirm={() => remove(r)} label="Remove risk" />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-5">
        <Card>
          <CardHeader title="Log a risk" />
          <div className="px-5 pb-5">
            <AddRiskForm
              projectId={projectId}
              onAdded={(r, askedAi) => { onChange([...risks, r]); if (askedAi) setAiKey((k) => k + 1); }}
            />
          </div>
        </Card>
        <Suggestions projectId={projectId} refreshKey={aiKey} />
      </div>
    </div>
  );
}

