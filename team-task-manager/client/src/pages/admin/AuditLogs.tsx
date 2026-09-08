import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../api/client';
import { PageHeader } from '../../components/ui/primitives';
import { EmptyState } from '../../components/ui/feedback';

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading }: any = useQuery({
    queryKey: ['audit-logs', search, actionFilter, resultFilter, page],
    queryFn: async () =>
      (
        await api.get(
          `/admin/audit-logs?search=${encodeURIComponent(search)}&action=${actionFilter}&result=${resultFilter}&page=${page}&limit=20`
        )
      ).data,
  });

  const logs = data?.logs ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Immutable record of security-relevant events — who did what, when, and from where."
      />

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card3d mb-5 flex flex-wrap items-center gap-3 p-4">
        <span className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search actor, action or target…"
            className="input pl-9"
          />
        </span>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="input w-auto max-w-[220px] cursor-pointer capitalize">
          <option value="all">All actions</option>
          {(data?.actions ?? []).map((a: string) => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} className="input w-auto cursor-pointer">
          <option value="all">All results</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
        </select>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-2xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon={<ScrollText size={34} />} title="No audit events found" message="Try adjusting your search or filters." />
      ) : (
        <>
          <ol className="relative ml-4 space-y-3 border-l border-white/10 pl-6">
            {logs.map((log: any, i: number) => (
              <motion.li
                key={log._id}
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="card3d relative !rounded-2xl p-4"
              >
                <span
                  className={`absolute -left-[31px] top-5 h-3 w-3 rounded-full ring-4 ring-[#0e1226] ${
                    log.result === 'failure' ? 'bg-rose-400' : 'bg-emerald-400'
                  }`}
                  style={{ boxShadow: `0 0 10px ${log.result === 'failure' ? '#f8717188' : '#34d39988'}` }}
                />
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold">
                      {log.action.replace(/_/g, ' ')}
                      {log.targetLabel && <span className="font-medium text-muted"> · {log.targetLabel}</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      by <span className="font-semibold">{log.actorName}</span>
                      {log.ip && <> · IP {log.ip}</>}
                      {log.userAgent && <> · {String(log.userAgent).slice(0, 48)}</>}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <span className={`chip border ${log.result === 'failure' ? 'border-rose-400/30 bg-rose-500/10 text-rose-300' : 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300'}`}>
                      {log.result}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>

          {pagination && pagination.pages > 1 && (
            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs text-muted">Page {pagination.page} of {pagination.pages} ({pagination.total} events)</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-ghost !p-2 disabled:opacity-30"><ChevronLeft size={15} /></button>
                <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} className="btn-ghost !p-2 disabled:opacity-30"><ChevronRight size={15} /></button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
