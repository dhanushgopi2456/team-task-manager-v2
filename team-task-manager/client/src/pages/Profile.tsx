import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, FolderKanban, ListTodo } from 'lucide-react';
import { api, apiError } from '../api/client';
import { PageHeader, Avatar, RoleBadge } from '../components/ui/primitives';
import { Spinner } from '../components/ui/feedback';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444'];

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [avatarColor, setAvatarColor] = useState('#6366f1');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setJobTitle(user.jobTitle || '');
      setAvatarColor(user.avatarColor || '#6366f1');
    }
  }, [user]);

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await api.get('/profile/me')).data,
  });

  const save = useMutation({
    mutationFn: async () => (await api.patch('/profile/me', { name, email, jobTitle, avatarColor })).data,
    onSuccess: async (res) => {
      toast(res.message || 'Profile updated successfully');
      await refreshUser();
    },
    onError: (e: any) => toast(apiError(e), 'error'),
  });

  const profile = profileData?.profile;
  const memberSince = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : '';

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Profile" subtitle="Your identity across Team Task Manager." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Identity card */}
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className="card3d flex flex-col items-center p-7 text-center lg:col-span-1">
          <Avatar name={name || user?.name || '?'} color={avatarColor} size={96} ring />
          <h2 className="mt-4 font-display text-xl font-extrabold">{user?.name}</h2>
          <p className="text-sm text-muted">{user?.jobTitle || 'Team member'}</p>
          <div className="mt-3"><RoleBadge role={user!.role} memberType={user!.memberType} /></div>

          <div className="mt-6 grid w-full grid-cols-3 gap-2">
            {[
              { icon: ListTodo, label: 'Open', value: profile?.stats?.openTasks ?? 0 },
              { icon: CheckCircle2, label: 'Done', value: profile?.stats?.completedTasks ?? 0 },
              { icon: FolderKanban, label: 'Projects', value: profile?.stats?.projectCount ?? 0 },
            ].map((x) => (
              <div key={x.label} className="rounded-xl border border-white/[.07] bg-white/[.03] py-3">
                <x.icon size={15} className="mx-auto text-indigo-300" />
                <p className="mt-1 font-display text-lg font-extrabold">{x.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted">{x.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[11px] uppercase tracking-widest text-slate-500">Member since {memberSince || '—'}</p>
        </motion.div>

        {/* Edit form */}
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card3d p-7 lg:col-span-2">
          <h3 className="mb-5 font-display text-base font-bold">Edit details</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Full name</span>
                <input required minLength={2} className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Email</span>
                <input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Job title</span>
              <input className="input" placeholder="e.g. Backend Developer" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} maxLength={80} />
            </label>
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">Profile photo color</span>
              <div className="flex flex-wrap gap-2.5">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    className={`h-9 w-9 rounded-full transition-transform hover:scale-110 ${
                      avatarColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''
                    }`}
                    style={{ background: `linear-gradient(135deg, ${c}, ${c}aa)`, boxShadow: `0 4px 12px -2px ${c}77` }}
                    aria-label={`Pick color ${c}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button type="submit" disabled={save.isPending} className="btn-primary">
                {save.isPending && <Spinner size={15} />} Save Profile
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
