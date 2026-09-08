import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Wrench, Save, Database, Server } from 'lucide-react';
import { api, apiError } from '../../api/client';
import { PageHeader } from '../../components/ui/primitives';
import { SkeletonCard, Spinner } from '../../components/ui/feedback';
import { useToast } from '../../hooks/useToast';

export default function SystemSettingsAdmin() {
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<any>(null);

  const { data, isLoading }: any = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => (await api.get('/admin/system-settings')).data,
  });

  useEffect(() => {
    if (data?.settings) {
      const { key, appName, ...rest } = data.settings;
      setForm(rest);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => (await api.put('/admin/system-settings', form)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system-settings'] });
      toast('Settings saved successfully');
    },
    onError: (e: any) => toast(apiError(e), 'error'),
  });

  if (isLoading || !form)
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="System Settings" subtitle="Global platform configuration." />
        <SkeletonCard lines={6} />
      </div>
    );

  const toggles = [
    ['allowRegistration', 'Public registration', 'Allow anyone to create a Regular Member account from the register page.'],
    ['emailNotifications', 'Email notifications', 'Master switch for outbound email alerts.'],
    ['taskNotifications', 'Task notifications', 'In-app notifications for assignments and status changes.'],
    ['deadlineReminders', 'Deadline reminders', 'Notify assignees before task due dates.'],
    ['maintenanceMode', 'Maintenance mode', 'Show a maintenance banner across the workspace.'],
  ] as const;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="System Settings"
        subtitle="Global platform configuration — applies to every user of Team Task Manager."
      />

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="card3d space-y-5 p-7">
        <h3 className="flex items-center gap-2 font-display text-base font-bold"><Wrench size={17} className="text-indigo-300" /> General</h3>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Default member type for new registrations</span>
          <select
            value={form.defaultMemberType}
            onChange={(e) => setForm({ ...form, defaultMemberType: e.target.value })}
            className="input w-full cursor-pointer sm:w-72"
          >
            <option value="regular_member">Regular Member</option>
            <option value="team_lead">Team Lead</option>
          </select>
          <span className="mt-1.5 block text-[11px] text-muted">Applied when someone registers via the public sign-up page.</span>
        </label>

        <label className="block max-w-xs">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Session duration (days)</span>
          <input
            type="number"
            min={1}
            max={90}
            className="input"
            value={form.sessionDays}
            onChange={(e) => setForm({ ...form, sessionDays: parseInt(e.target.value) || 7 })}
          />
        </label>

        <div className="border-t border-white/10 pt-5">
          <h3 className="mb-4 font-display text-base font-bold">Feature switches</h3>
          <div className="space-y-3">
            {toggles.map(([key, label, desc]) => (
              <label key={key} className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-white/[.07] bg-white/[.03] px-4 py-3.5">
                <span>
                  <span className="block text-sm font-bold">{label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{desc}</span>
                </span>
                <input
                  type="checkbox"
                  checked={!!form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  className="mt-1 h-4 w-8 shrink-0 cursor-pointer appearance-none rounded-full bg-slate-600 transition-colors before:block before:h-3.5 before:w-3.5 before:translate-x-0.5 before:translate-y-[1px] before:rounded-full before:bg-white before:transition-transform checked:bg-indigo-500 checked:before:translate-x-[19px]"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t border-white/10 pt-5">
          <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary">
            {save.isPending ? <Spinner size={15} /> : <Save size={15} />} Save Settings
          </button>
        </div>
      </motion.div>

      {/* Deployment info card */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card3d mt-6 p-7">
        <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold"><Server size={17} className="text-cyan-300" /> Deployment</h3>
        <ul className="space-y-2.5 text-sm text-muted">
          <li className="flex items-center gap-2.5"><Database size={15} className="shrink-0 text-cyan-300" /> Set <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs text-cyan-200">MONGO_URI</code> to connect your own MongoDB cluster — leave it empty in dev for the built-in demo database.</li>
          <li className="flex items-center gap-2.5"><Wrench size={15} className="shrink-0 text-indigo-300" /> Configure <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs text-indigo-200">JWT_SECRET</code> in production via <code className="font-mono text-xs">server/.env</code>.</li>
        </ul>
      </motion.div>
    </div>
  );
}
