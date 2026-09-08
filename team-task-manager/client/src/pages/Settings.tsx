import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Lock, MonitorSmartphone, BellRing, Palette, LogOut, Sun, Moon } from 'lucide-react';
import { api, apiError } from '../api/client';
import { PageHeader } from '../components/ui/primitives';
import { Spinner } from '../components/ui/feedback';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

type Tab = 'security' | 'notifications' | 'appearance';

export default function Settings() {
  const { refreshUser } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('security');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [logoutOthers, setLogoutOthers] = useState(false);
  const [prefs, setPrefs] = useState({ email: true, tasks: true, deadlines: true });
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem('ttm_theme') as any) || 'dark';
    setTheme(stored);
    setReducedMotion(localStorage.getItem('ttm_reduced_motion') === 'true');
    document.documentElement.classList.toggle('light', stored === 'light');
  }, []);

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => (await api.get('/auth/sessions')).data,
    enabled: tab === 'security',
  });

  const changePw = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPw) throw new Error('New passwords do not match.');
      return (await api.post('/auth/change-password', { currentPassword, newPassword, logoutOthers })).data;
    },
    onSuccess: async (res) => {
      toast(res.data?.message || res.message || 'Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPw('');
      await refreshUser();
    },
    onError: (e: any) => toast(apiError(e, 'Could not change password'), 'error'),
  });

  const revokeSessions = useMutation({
    mutationFn: () => api.post('/auth/sessions/revoke', {}),
    onSuccess: () => {
      toast('Signed out of all other sessions');
      window.location.href = '/login';
    },
  });

  function applyTheme(next: 'dark' | 'light') {
    setTheme(next);
    localStorage.setItem('ttm_theme', next);
    document.documentElement.classList.toggle('light', next === 'light');
  }

  function applyReducedMotion(v: boolean) {
    setReducedMotion(v);
    localStorage.setItem('ttm_reduced_motion', String(v));
    // Inject a global reduced-motion override
    let style = document.getElementById('ttm-rm-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'ttm-rm-style';
      document.head.appendChild(style);
    }
    style.textContent = v ? '*,*::before,*::after{animation:none!important;transition:none!important}' : '';
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" subtitle="Security, notifications and appearance preferences." />

      <div className="card3d mb-6 flex flex-wrap gap-1 p-1.5">
        {(
          [
            ['security', 'Security', Lock],
            ['notifications', 'Notifications', BellRing],
            ['appearance', 'Appearance', Palette],
          ] as [Tab, string, any][]
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition ${
              tab === key ? 'raised text-white' : 'text-muted hover:bg-white/[.05] hover:text-white'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'security' && (
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="card3d p-6">
            <h3 className="mb-1 font-display text-base font-bold">Change password</h3>
            <p className="mb-5 text-xs text-muted">Use at least 8 characters with a mix of letters, numbers and symbols.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                changePw.mutate();
              }}
              className="space-y-3.5"
            >
              <input required type="password" className="input" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
              <input required type="password" minLength={8} className="input" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
              <input required type="password" minLength={8} className="input" placeholder="Confirm new password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" />
              <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-sm">
                <input type="checkbox" checked={logoutOthers} onChange={(e) => setLogoutOthers(e.target.checked)} className="h-4 w-4 accent-indigo-500" />
                Sign out of all other devices after changing
              </label>
              <button disabled={changePw.isPending} className="btn-primary">
                {changePw.isPending && <Spinner size={15} />} Update Password
              </button>
            </form>
          </div>

          <div className="card3d p-6">
            <h3 className="mb-1 flex items-center gap-2 font-display text-base font-bold"><MonitorSmartphone size={17} /> Active sessions</h3>
            <p className="mb-4 text-xs text-muted">Devices currently signed in to your account.</p>
            <div className="mb-4 space-y-2">
              {(sessionsData?.sessions ?? []).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-white/[.07] bg-white/[.03] px-4 py-3 text-xs">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{(s.userAgent || 'Unknown device').slice(0, 60)}</span>
                    <span className="text-muted">IP {s.ip || 'unknown'} · since {new Date(s.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>
              ))}
            </div>
            <button onClick={() => revokeSessions.mutate()} disabled={revokeSessions.isPending} className="btn-ghost !border-rose-400/30 text-rose-300 hover:!bg-rose-500/10">
              <LogOut size={14} /> Logout from other sessions
            </button>
          </div>
        </motion.div>
      )}

      {tab === 'notifications' && (
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="card3d space-y-4 p-6">
          <h3 className="font-display text-base font-bold">Notification preferences</h3>
          {(
            [
              ['email', 'Email notifications', 'Receive product updates and account alerts by email.'],
              ['tasks', 'Task notifications', 'Get notified when tasks are assigned or status changes.'],
              ['deadlines', 'Deadline reminders', 'Reminders before task due dates approach.'],
            ] as [keyof typeof prefs, string, string][]
          ).map(([key, label, desc]) => (
            <label key={key} className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-white/[.07] bg-white/[.03] px-4 py-3.5">
              <span>
                <span className="block text-sm font-bold">{label}</span>
                <span className="mt-0.5 block text-xs text-muted">{desc}</span>
              </span>
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))}
                className="mt-1 h-4 w-8 shrink-0 cursor-pointer appearance-none rounded-full bg-slate-600 transition-colors before:block before:h-3.5 before:w-3.5 before:translate-x-0.5 before:translate-y-[1px] before:rounded-full before:bg-white before:transition-transform checked:bg-indigo-500 checked:before:translate-x-[19px]"
              />
            </label>
          ))}
          <button
            className="btn-primary"
            onClick={async () => {
              try {
                await api.patch('/profile/me', { notificationPrefs: prefs });
                await refreshUser();
                toast('Notification preferences saved');
              } catch (e: any) {
                toast(apiError(e), 'error');
              }
            }}
          >
            Save Preferences
          </button>
        </motion.div>
      )}

      {tab === 'appearance' && (
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="card3d space-y-4 p-6">
          <h3 className="font-display text-base font-bold">Theme</h3>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ['dark', 'Dark mode', Moon],
                ['light', 'Light mode', Sun],
              ] as ['dark' | 'light', string, any][]
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => applyTheme(key)}
                className={`card3d card3d-hover flex flex-col items-center gap-3 !rounded-2xl p-6 ${theme === key ? '!border-indigo-400/50 ring-2 ring-indigo-400/40' : ''}`}
              >
                <Icon size={26} className={theme === key ? 'text-indigo-300' : 'text-muted'} />
                <span className="text-sm font-bold">{label}</span>
              </button>
            ))}
          </div>

          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-white/[.07] bg-white/[.03] px-4 py-3.5">
            <span>
              <span className="block text-sm font-bold">Reduced motion</span>
              <span className="mt-0.5 block text-xs text-muted">Minimize animations across the interface.</span>
            </span>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => applyReducedMotion(e.target.checked)}
              className="mt-1 h-4 w-8 shrink-0 cursor-pointer appearance-none rounded-full bg-slate-600 transition-colors before:block before:h-3.5 before:w-3.5 before:translate-x-0.5 before:translate-y-[1px] before:rounded-full before:bg-white before:transition-transform checked:bg-indigo-500 checked:before:translate-x-[19px]"
            />
          </label>
        </motion.div>
      )}
    </div>
  );
}
