import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, User, Info } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiError } from '../api/client';
import { BackgroundFX } from '../components/layout/BackgroundFX';
import { Logo } from '../components/ui/primitives';
import { Spinner } from '../components/ui/feedback';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setBusy(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(apiError(err, 'Unable to create account'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <BackgroundFX />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="card3d relative z-10 w-full max-w-md !p-8 shadow-glass-lg"
      >
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <Logo size={52} />
          <div>
            <h1 className="font-display text-xl font-extrabold tracking-wide brand-gradient-text">TEAM TASK MANAGER</h1>
            <p className="mt-1 font-display text-lg font-bold">Create Your Account</p>
            <p className="text-xs text-muted">Join your team — Smart Teamwork. Clear Tasks. Better Results.</p>
          </div>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3.5 py-2.5 text-sm font-medium text-rose-300"
          >
            {error}
          </motion.p>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Full name</span>
            <span className="relative block">
              <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input required minLength={2} className="input pl-9" placeholder="Alex Kumar" value={name} onChange={(e) => setName(e.target.value)} />
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Email</span>
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input required type="email" className="input pl-9" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Password</span>
            <span className="relative block">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                required
                minLength={8}
                type={showPw ? 'text' : 'password'}
                className="input pl-9 pr-10"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white" aria-label="Toggle password visibility">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Confirm password</span>
            <span className="relative block">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input required minLength={8} type={showPw ? 'text' : 'password'} className="input pl-9" placeholder="Repeat password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </span>
          </label>

          <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
            {busy ? <Spinner /> : null}
            {busy ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 flex items-start gap-2 rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-[11px] leading-relaxed text-muted">
          <Info size={14} className="mt-0.5 shrink-0 text-indigo-300" />
          New accounts join as Regular Members. Admin and Team Lead roles are assigned by your administrator.
        </p>

        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-indigo-300 transition hover:text-indigo-200">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
