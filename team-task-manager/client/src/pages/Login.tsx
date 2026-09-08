import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, Users2, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiError } from '../api/client';
import { BackgroundFX } from '../components/layout/BackgroundFX';
import { Logo } from '../components/ui/primitives';
import { Spinner } from '../components/ui/feedback';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password, remember);
      navigate('/dashboard');
    } catch (err) {
      setError(apiError(err, 'Unable to sign in'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <BackgroundFX />

      <div className="relative z-10 grid w-full max-w-5xl gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        {/* Brand story */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:block"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="animate-float-y drop-shadow-[0_12px_30px_rgba(99,102,241,.55)]">
              <Logo size={56} />
            </div>
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-wide brand-gradient-text">
                TEAM TASK MANAGER
              </h1>
              <p className="text-sm font-medium tracking-wide text-muted">Smart Teamwork. Clear Tasks. Better Results.</p>
            </div>
          </div>
          <p className="mb-8 max-w-md text-base leading-relaxed text-muted">
            The Ultra-3D productivity platform for modern teams — projects, kanban, analytics and
            collaboration in one futuristic workspace.
          </p>
          <div className="space-y-3">
            {[
              { icon: Zap, title: 'Lightning-fast workflows', text: 'Kanban drag & drop, live notifications, instant search.' },
              { icon: Users2, title: 'Built for teams', text: 'Admins, team leads and members with precise RBAC.' },
              { icon: ShieldCheck, title: 'Enterprise-grade security', text: 'JWT sessions, audit logs, rate limiting.' },
            ].map((f) => (
              <motion.div key={f.title} whileHover={{ x: 6 }} className="card3d card3d-hover flex items-start gap-4 p-4">
                <span className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 text-white shadow-glow">
                  <f.icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-bold">{f.title}</span>
                  <span className="block text-xs text-muted">{f.text}</span>
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Auth panel */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="card3d mx-auto w-full max-w-md !p-8 shadow-glass-lg"
        >
          <div className="mb-7 flex flex-col items-center gap-3 text-center lg:hidden">
            <Logo size={52} />
            <div>
              <h1 className="font-display text-xl font-extrabold tracking-wide brand-gradient-text">TEAM TASK MANAGER</h1>
              <p className="text-xs font-medium tracking-wide text-muted">Smart Teamwork. Clear Tasks. Better Results.</p>
            </div>
          </div>

          <h2 className="font-display text-2xl font-bold">Welcome back</h2>
          <p className="mt-1 text-sm text-muted">Sign in to your workspace to continue.</p>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3.5 py-2.5 text-sm font-medium text-rose-300"
            >
              {error}
            </motion.p>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Email</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  className="input pl-9"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Password</span>
              <span className="relative block">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="input pl-9 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </span>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded accent-indigo-500"
                />
                <span className="text-muted">Remember me</span>
              </label>
              <Link to="/forgot-password" className="font-semibold text-indigo-300 transition hover:text-indigo-200">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={busy} className="btn-primary w-full !py-3 text-base">
              {busy ? <Spinner /> : <Sparkles size={17} />}
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs leading-relaxed text-muted">
            <span className="font-bold text-slate-300">Demo accounts:</span> admin@example.com / Admin@123 ·{' '}
            john@example.com / John@1234 (Lead) · alex@example.com / Alex@1234 (Member)
          </div>

          <p className="mt-5 text-center text-sm text-muted">
            New here?{' '}
            <Link to="/register" className="font-bold text-indigo-300 transition hover:text-indigo-200">
              Create account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
