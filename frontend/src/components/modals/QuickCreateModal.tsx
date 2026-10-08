import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { api } from '../../lib/api';
import { playChime } from '../../lib/audioAlerts';
import { CheckSquare, Flame, Sparkles } from 'lucide-react';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickCreateModal({ isOpen, onClose }: QuickCreateModalProps) {
  const [tab, setTab] = useState<'task' | 'incident'>('task');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [severity, setSeverity] = useState('HIGH');
  const [departmentId, setDepartmentId] = useState('');
  const queryClient = useQueryClient();

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data.data,
  });

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      return (
        await api.post('/tasks', {
          title,
          description,
          priority,
          departmentId: departmentId || departments[0]?.id,
          estimatedHours: 4,
        })
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      playChime('success');
      onClose();
      resetForm();
    },
  });

  const createIncidentMutation = useMutation({
    mutationFn: async () => {
      return (
        await api.post('/incidents', {
          title,
          description,
          severity,
          departmentId: departmentId || departments[0]?.id,
        })
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      playChime('critical');
      onClose();
      resetForm();
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setSeverity('HIGH');
    setDepartmentId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (tab === 'task') {
      createTaskMutation.mutate();
    } else {
      createIncidentMutation.mutate();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Dispatch" maxWidth="md">
      <div className="space-y-4 text-left">
        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setTab('task')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              tab === 'task'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Create Task
          </button>
          <button
            type="button"
            onClick={() => setTab('incident')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              tab === 'incident'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            File Incident Outage
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            label="Title"
            placeholder={tab === 'task' ? 'e.g. Implement OAuth token refresh flow' : 'e.g. API Gateway 504 Gateway Timeouts'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description & Context
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide technical scope or reproduction steps..."
              className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              options={departments.map((d: any) => ({ label: d.name, value: d.id }))}
            />

            {tab === 'task' ? (
              <Select
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                options={[
                  { label: 'Low', value: 'LOW' },
                  { label: 'Medium', value: 'MEDIUM' },
                  { label: 'High', value: 'HIGH' },
                  { label: 'Critical', value: 'CRITICAL' },
                ]}
              />
            ) : (
              <Select
                label="Severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                options={[
                  { label: 'P4 - Low', value: 'LOW' },
                  { label: 'P3 - Medium', value: 'MEDIUM' },
                  { label: 'P2 - High', value: 'HIGH' },
                  { label: 'P1 - Critical Outage', value: 'CRITICAL' },
                ]}
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button
              variant={tab === 'task' ? 'primary' : 'danger'}
              type="submit"
              size="sm"
              isLoading={createTaskMutation.isPending || createIncidentMutation.isPending}
            >
              {tab === 'task' ? 'Dispatch Task' : 'Declare Incident'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
