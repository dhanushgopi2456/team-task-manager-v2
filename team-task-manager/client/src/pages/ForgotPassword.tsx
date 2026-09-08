import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, KeyRound } from 'lucide-react';
import { api, apiError } from '../api/client';
import { BackgroundFX } from '../components/layout/BackgroundFX';
import { Logo } from '../components/ui/primitives';
import { Spinner } from '../components/ui/feedback';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSent(true);
      if (res.data.devResetLink) setDevLink(res.data.devResetLink);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <BackgroundFX />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="card3d relative z-10 w-full max-w-md !p-8 shadow-glass-lg"
      >
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo size={48} />
          <h1 className="font-display text-xl font-extrabold brand-gradient-text">TEAM TASK MANAGER</h1>
        </div>

        {!sent ? (
          <>
            <h2 className="font-display text-lg font-bold">Forgot your password?</h2>
            <p className="mt-1 text-sm text-muted">Enter your email and we'll generate a secure reset link.</p>
            {error && <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-300">{error}</p>}
            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input required type="email" className="input pl-9" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </span>
              <button disabled={busy} className="btn-primary w-full">{busy ? <Spinner /> : 'Send Reset Link'}</button>
            </form>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mx-auto w-fit rounded-2xl bg-gradient-to-br from-emerald-500/25 to-emerald-500/5 p-3.5 text-emerald-300">
              <KeyRound size={28} />
            </div>
            <h2 className="mt-4 text-center font-display text-lg font-bold">Check your inbox</h2>
            <p className="mt-1 text-center text-sm text-muted">
              If an account exists for {email}, a password reset link has been generated.
            </p>
            {devLink && (
              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs leading-relaxed text-muted">
                <span className="font-bold text-slate-300">Demo mode:</span> no SMTP configured —{' '}
                <Link to={devLink} className="font-bold text-indigo-300 underline underline-offset-2 hover:text-indigo-200">
                  open reset link
                </Link>
              </div>
            )}
          </motion.div>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          <Link to="/login" className="font-bold text-indigo-300 transition hover:text-indigo-200">← Back to sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
