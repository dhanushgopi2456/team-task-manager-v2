import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { api, apiError } from '../api/client';
import { BackgroundFX } from '../components/layout/BackgroundFX';
import { Logo } from '../components/ui/primitives';
import { Spinner } from '../components/ui/feedback';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setBusy(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <BackgroundFX />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="card3d relative z-10 w-full max-w-md !p-8 shadow-glass-lg">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo size={48} />
          <h1 className="font-display text-xl font-extrabold brand-gradient-text">TEAM TASK MANAGER</h1>
          <h2 className="font-display text-lg font-bold">Set a new password</h2>
        </div>

        {!token && (
          <p className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-300">
            This link is missing its security token. Please request a new reset link.
          </p>
        )}
        {error && <p className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-300">{error}</p>}

        <form onSubmit={onSubmit} className="space-y-4">
          <span className="relative block">
            <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input required minLength={8} type="password" className="input pl-9" placeholder="New password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} />
          </span>
          <span className="relative block">
            <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input required minLength={8} type="password" className="input pl-9" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </span>
          <button disabled={busy || !token} className="btn-primary w-full">
            {busy ? <Spinner /> : busy ? 'Updating…' : 'Update Password'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          <Link to="/login" className="font-bold text-indigo-300 hover:text-indigo-200">← Back to sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
