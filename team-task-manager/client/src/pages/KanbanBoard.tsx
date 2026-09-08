import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Columns3, Plus } from 'lucide-react';
import { api } from '../api/client';
import type { TaskStatus } from '../types';
import { PageHeader } from '../components/ui/primitives';
import { SkeletonGrid } from '../components/ui/feedback';
import { KanbanBoard } from '../components/KanbanBoard';
import { TaskFormModal } from '../components/TaskFormModal';
import { useAuth } from '../hooks/useAuth';

export default function KanbanBoardPage() {
  const { user, isTeamLead } = useAuth();
  const [params] = useSearchParams();
  const projectId = params.get('project') ?? undefined;
  const [modalOpen, setModalOpen] = useState(false);
  const [presetStatus, setPresetStatus] = useState<TaskStatus>('todo');

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', 'board', projectId],
    queryFn: async () => (await api.get(`/tasks?limit=100${projectId ? `&project=${projectId}` : ''}`)).data,
  });

  const canEdit =
    isTeamLead ||
    // regular members can still move their own cards; server enforces specifics
    true;

  return (
    <div>
      <PageHeader
        title="Kanban Board"
        subtitle={
          user?.role === 'admin' || user?.memberType === 'team_lead'
            ? 'Drag cards between columns — changes save instantly for the whole team.'
            : 'Drag your own tasks between columns. Team leads manage everything.'
        }
        actions={
          isTeamLead && (
            <button
              onClick={() => {
                setPresetStatus('todo');
                setModalOpen(true);
              }}
              className="btn-primary"
            >
              <Plus size={16} /> New Task
            </button>
          )
        }
      />

      {isLoading ? (
        <SkeletonGrid count={4} />
      ) : (
        <KanbanBoard
          tasks={data?.tasks ?? []}
          projectId={projectId}
          canEdit={canEdit}
          onAddTask={(status) => {
            setPresetStatus(status);
            setModalOpen(true);
          }}
        />
      )}

      {!isLoading && (data?.tasks?.length ?? 0) === 0 && (
        <div className="card3d mt-6 flex flex-col items-center gap-2 p-10 text-center">
          <Columns3 size={34} className="text-indigo-300" />
          <p className="font-display font-bold">Nothing on the board yet</p>
          <p className="text-sm text-muted">Tasks you create will appear here as draggable cards.</p>
        </div>
      )}

      <TaskFormModal open={modalOpen} onClose={() => setModalOpen(false)} projectId={projectId} initialStatus={presetStatus} />
    </div>
  );
}
