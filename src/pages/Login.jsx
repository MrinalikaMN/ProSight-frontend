import { useState } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import api, { errorMessage } from '../lib/api';
import AuthShell from '../components/AuthShell';
import PasswordInput from '../components/PasswordInput';
import { Button, Field, Input } from '../components/ui';

export default function Login({ setIsAuthenticated }) {
  const location = useLocation();
  const [params] = useSearchParams();
  const [username, setUsername] = useState(location.state?.username ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const notice = location.state?.registered
    ? 'Account created. Sign in to continue.'
    : params.get('expired') ? 'Your session expired. Sign in again.' : '';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username ?? username);
      localStorage.setItem('userRole', String(res.data.role ?? 'MEMBER').replace(/^ROLE_/, ''));
      localStorage.setItem('userId', res.data.id ?? '');
      setIsAuthenticated?.(true);
      navigate('/', { replace: true });
    } catch (err) {
      const status = err.response?.status;
      setError(status === 401 || status === 403 || status === 400
        ? 'That username and password don\'t match. Check them and try again.'
        : errorMessage(err, "Couldn't sign in."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back. Pick up where your projects left off."
      footer={<>New to ProSight? <Link to="/register" className="font-semibold text-brand hover:underline">Create an account</Link></>}
    >
      {notice && !error && (
        <div className="mb-5 rounded-lg border border-ok/40 bg-ok-soft px-3.5 py-2.5 text-sm font-medium text-ok">{notice}</div>
      )}
      {error && (
        <div role="alert" className="mb-5 rounded-lg border border-risk/40 bg-risk-soft px-3.5 py-2.5 text-sm font-medium text-risk">{error}</div>
      )}
      <form onSubmit={handleLogin} className="space-y-4">
        <Field label="Username">
          <Input required autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your username" />
        </Field>
        <Field label="Password">
          <PasswordInput required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
        </Field>
        <Button type="submit" loading={loading} className="w-full justify-center h-11 mt-2">
          {loading ? 'Signing in' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  );
}
