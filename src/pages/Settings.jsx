import { useState } from 'react';
import useAsync from '../lib/useAsync';
import { endpoints } from '../lib/data';
import { errorMessage } from '../lib/api';
import { useToast } from '../lib/toast';
import { cx } from '../lib/cx';
import { Card, CardHeader, PageHeader, Button, Field, Input, Skeleton, ErrorState } from '../components/ui';
import { IconMail, IconCheck } from '../components/icons';

const looksLikeEmail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim());

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer">
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="block text-[13px] text-muted mt-0.5">{description}</span>}
      </span>
      <span className="relative shrink-0 mt-0.5">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="block h-6 w-11 rounded-full bg-line-strong transition-colors peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface" />
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function SettingsForm({ me, onSaved }) {
  const toast = useToast();
  const [email, setEmail] = useState(me.email ?? '');
  const [notify, setNotify] = useState(me.notifyByEmail ?? true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(null); // 'test' | 'digest'
  const [result, setResult] = useState(null); // { ok, message }

  const dirty = email.trim() !== (me.email ?? '') || notify !== (me.notifyByEmail ?? true);
  const invalid = email.trim() !== '' && !looksLikeEmail(email);
  const savedEmail = (me.email ?? '').trim();

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setResult(null);
    try {
      const updated = await endpoints.updateMe({ email: email.trim(), notifyByEmail: notify });
      onSaved(updated);
      toast(updated.email ? 'Notification settings saved' : 'Email removed');
    } catch (err) {
      toast(errorMessage(err, "Couldn't save your settings."), 'error');
    } finally {
      setSaving(false);
    }
  };

  const run = async (kind) => {
    setBusy(kind);
    setResult(null);
    try {
      const res = kind === 'test' ? await endpoints.sendTestEmail() : await endpoints.sendDigestNow();
      setResult({ ok: true, message: res?.message ?? 'Sent.' });
    } catch (err) {
      setResult({ ok: false, message: errorMessage(err, "Couldn't send the email.") });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5 items-start">
      <Card className="lg:col-span-3">
        <CardHeader title="Deadline emails" description="Get an email when a task is assigned to you, and a morning summary when your tasks are overdue or due in the next 3 days." />
        <form onSubmit={save} className="px-5 pb-5 space-y-5">
          <Field label="Your email address" hint={invalid ? undefined : 'Only used for ProSight notifications. Other people can see that you have one, but not what it is.'}>
            <Input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com"
              aria-invalid={invalid} className={cx(invalid && 'border-risk focus:border-risk focus:ring-risk/20')}
            />
            {invalid && <span className="block text-xs text-risk mt-1">That doesn't look like an email address yet.</span>}
          </Field>
          <Toggle
            checked={notify} onChange={setNotify}
            label="Email me about my deadlines"
            description={notify ? 'On: assignment emails and a 9 am summary when something needs attention.' : 'Off: you will not get any ProSight emails.'}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={saving} disabled={!dirty || invalid}>Save changes</Button>
          </div>
        </form>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader title="Check it works" description={savedEmail ? `Emails go to ${savedEmail}.` : 'Save an email address first.'} />
        <div className="px-5 pb-5 space-y-3">
          <Button variant="secondary" className="w-full justify-center" disabled={!savedEmail || dirty} loading={busy === 'test'} onClick={() => run('test')}>
            {busy !== 'test' && <IconMail size={16} />} Send a test email
          </Button>
          <Button variant="secondary" className="w-full justify-center" disabled={!savedEmail || dirty || !me.notifyByEmail} loading={busy === 'digest'} onClick={() => run('digest')}>
            Send my deadline summary now
          </Button>
          {dirty && savedEmail && <p className="text-xs text-muted">Save your changes before testing.</p>}
          {result && (
            <div role="status" className={cx('flex gap-2 rounded-lg border px-3 py-2.5 text-sm', result.ok ? 'border-ok/40 bg-ok-soft text-ok' : 'border-risk/40 bg-risk-soft text-risk')}>
              {result.ok && <IconCheck size={16} className="mt-0.5 shrink-0" />}
              <span className="break-words min-w-0">{result.message}</span>
            </div>
          )}
          {result && !result.ok && (
            <p className="text-xs text-muted">
              If the mail server refused it, check <code className="text-ink">spring.mail.username</code> and <code className="text-ink">spring.mail.password</code> in
              your backend. Gmail needs an app password, not your normal one.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function Settings() {
  const { data, error, loading, reload, setData } = useAsync(endpoints.me, []);
  const header = <PageHeader title="Notifications" description="Choose how ProSight tells you about your deadlines." />;
  if (loading) return <>{header}<Skeleton className="h-64 rounded-xl" /></>;
  if (error) {
    const missing = [404, 405].includes(error.response?.status) || error.serverRefused;
    return <>{header}<ErrorState message={missing ? 'Your backend is missing the notifications update. Install the latest backend files and restart it.' : errorMessage(error)} onRetry={reload} /></>;
  }
  return <>{header}<SettingsForm key={`${data.email}|${data.notifyByEmail}`} me={data} onSaved={setData} /></>;
}
