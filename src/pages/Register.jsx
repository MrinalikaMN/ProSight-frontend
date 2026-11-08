import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { errorMessage } from '../lib/api';
import AuthShell from '../components/AuthShell';
import PasswordInput from '../components/PasswordInput';
import { Button, Field, Input } from '../components/ui';
import { cx } from '../lib/cx';

const ROLES = [
  { value: 'MEMBER', label: 'Member', note: 'Work on projects and tasks' },
  { value: 'ADMIN', label: 'Administrator', note: 'Manage projects and people' },
];

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError('Use at least 6 characters for your password.'); return; }
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setError("That email address doesn't look right."); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/register', { username, password, role, email: email.trim() || null });
      navigate('/login', { state: { registered: true, username } });
    } catch (err) {
      setError(err.response ? errorMessage(err, 'That username may already be taken.') : errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join your team's workspace in under a minute."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-brand hover:underline">Sign in</Link></>}
    >
      {error && (
        <div role="alert" className="mb-5 rounded-lg border border-risk/40 bg-risk-soft px-3.5 py-2.5 text-sm font-medium text-risk">{error}</div>
      )}
      <form onSubmit={handleRegister} className="space-y-4">
        <Field label="Username">
          <Input required autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Pick a username" />
        </Field>
        <Field label="Email (optional)" hint="We'll email you when a task is assigned to you or a deadline is close.">
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </Field>
        <Field label="Password" hint="At least 6 characters.">
          <PasswordInput required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" />
        </Field>
        <fieldset>
          <legend className="block text-[13px] font-semibold text-ink mb-1.5">Role</legend>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={cx(
                  'cursor-pointer rounded-lg border px-3 py-2.5 transition-colors',
                  role === r.value ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:border-line-strong'
                )}
              >
                <input type="radio" name="role" value={r.value} checked={role === r.value} onChange={() => setRole(r.value)} className="sr-only" />
                <span className={cx('block text-sm font-semibold', role === r.value ? 'text-brand' : 'text-ink')}>{r.label}</span>
                <span className="block text-xs text-muted mt-0.5">{r.note}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <Button type="submit" loading={loading} className="w-full justify-center h-11 mt-2">
          {loading ? 'Creating account' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  );
}
