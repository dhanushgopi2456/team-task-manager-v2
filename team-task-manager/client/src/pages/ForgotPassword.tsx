import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, KeyRound } from 'lucide-react';
import { api, apiError } from '../api/client';
import { DitherPrismBackground } from '../components/ui/DitherPrismHero';
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
      <DitherPrismBackground
        color1="#05070f"
        color2="#6366f1"
        color3="#06b6d4"
        speed={0.8}
        ditherIntensity={0.14}
        prismIntensity={0.45}
        particleCount={45}
        showParticles={true}
        particleColor="#a5b4fc"
      />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mx-auto w-full max-w-md rounded-2xl border border-white/20 bg-[#090d22]/95 p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] backdrop-blur-2xl"
      >
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Link to="/landing" className="group flex flex-col items-center gap-2 transition hover:opacity-90" title="Go to Team Task Manager landing page">
            <Logo size={48} />
            <h1 className="font-display text-xl font-extrabold brand-gradient-text">TEAM TASK MANAGER</h1>
          </Link>
        </div>

        {!sent ? (
          <>
            <h2 className="font-display text-xl font-bold text-white">Forgot your password?</h2>
            <p className="mt-1 text-sm text-slate-300">Enter your email and we'll generate a secure reset link.</p>
            {error && <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3.5 py-2.5 text-sm font-medium text-rose-300">{error}</p>}
            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300" size={16} />
                <input required type="email" className="input pl-9" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </span>
              <button disabled={busy} className="btn-primary w-full !py-3 text-base">{busy ? <Spinner /> : 'Send Reset Link'}</button>
            </form>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mx-auto w-fit rounded-2xl bg-gradient-to-br from-emerald-500/25 to-emerald-500/5 p-3.5 text-emerald-300">
              <KeyRound size={28} />
            </div>
            <h2 className="mt-4 text-center font-display text-xl font-bold text-white">Check your inbox</h2>
            <p className="mt-1 text-center text-sm text-slate-300">
              If an account exists for {email}, a password reset link has been generated.
            </p>
            {devLink && (
              <div className="mt-4 rounded-xl border border-indigo-400/25 bg-[#060919]/90 p-3.5 text-xs leading-relaxed text-slate-300">
                <span className="font-bold text-indigo-300">Demo mode:</span> no SMTP configured —{' '}
                <Link to={devLink} className="font-bold text-indigo-300 underline underline-offset-2 hover:text-indigo-100">
                  open reset link
                </Link>
              </div>
            )}
          </motion.div>
        )}

        <p className="mt-6 text-center text-sm text-slate-300">
          <Link to="/login" className="font-bold text-indigo-300 transition hover:text-indigo-100 underline underline-offset-4">← Back to sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
