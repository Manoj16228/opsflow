import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building, Users, CheckSquare, AlertTriangle, Plus, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EmptyState, Skeleton, ErrorState } from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Department } from '../types';

export function DepartmentsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: departments = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data.data,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/departments', formData);
      showToast('Department created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '', code: '', description: '' });
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to create department', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building className="w-6 h-6 text-brand-400" /> Departments & Business Units
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize workforce, assign operational workloads, and route incident triage.
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            New Department
          </Button>
        )}
      </div>

      {/* Department Cards Grid */}
      {error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No departments configured"
          description="Create your organization's first department to start grouping teams and tasks."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <Card key={dept.id} hoverEffect className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-xs text-brand-400 font-bold bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                    {dept.code}
                  </span>
                  <Badge variant="default" className="text-[11px] font-mono">
                    {dept._count?.employees || 0} Members
                  </Badge>
                </div>

                <h3 className="font-semibold text-base text-white mb-1">{dept.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {dept.description || 'General corporate operations unit.'}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5 text-brand-400" />
                    {dept._count?.tasks || 0} tasks
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    {dept._count?.incidents || 0} incidents
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Department Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Department"
        description="Add a new business unit or operational division."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Department Name"
            required
            placeholder="e.g. Cybersecurity & Compliance"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label="Department Code (Short Identifier)"
            required
            placeholder="e.g. SEC"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-slate-300">Description</label>
            <textarea
              rows={3}
              placeholder="Describe scope of operations, services, and responsibilities..."
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Department
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
