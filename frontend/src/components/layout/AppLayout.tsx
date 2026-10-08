import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Department, Employee } from '../../types';

import { CommandPalette } from '../ui/CommandPalette';
import { RealTimeStatusBar } from './RealTimeStatusBar';
import { AICopilotDrawer } from '../copilot/AICopilotDrawer';
import { ShortcutsModal } from '../modals/ShortcutsModal';
import { QuickCreateModal } from '../modals/QuickCreateModal';

export function AppLayout() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Global Keyboard Shortcuts Listener
  React.useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input, textarea, or select
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        (activeEl as HTMLElement)?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (isInput) return;

      const now = Date.now();
      const key = e.key.toLowerCase();

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      if (key === 'c' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsQuickCreateOpen(true);
        return;
      }

      if (key === 'a' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsCopilotOpen((prev) => !prev);
        return;
      }

      // Check for two-key sequence (e.g. 'g' then 'd')
      if (lastKey === 'g' && now - lastKeyTime < 800) {
        if (key === 'd') {
          e.preventDefault();
          navigate('/dashboard');
        } else if (key === 't') {
          e.preventDefault();
          navigate('/tasks');
        } else if (key === 'i') {
          e.preventDefault();
          navigate('/incidents');
        } else if (key === 'e') {
          e.preventDefault();
          navigate('/employees');
        } else if (key === 'a') {
          e.preventDefault();
          navigate('/analytics');
        } else if (key === 'w') {
          e.preventDefault();
          navigate('/automations');
        } else if (key === 's') {
          e.preventDefault();
          navigate('/settings');
        }
        lastKey = '';
        return;
      }

      if (key === 'g') {
        lastKey = 'g';
        lastKeyTime = now;
      } else {
        lastKey = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Load departments and employees for dropdowns
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data.data,
  });

  const { data: employeeData } = useQuery<{ employees: Employee[] }>({
    queryKey: ['employees-list'],
    queryFn: async () => (await api.get('/employees?limit=100')).data,
  });

  const employees = employeeData?.employees || [];

  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    departmentId: '',
    assignedToId: '',
    priority: 'MEDIUM',
    slaHours: 24,
    estimatedHours: 8,
    dueDate: '',
  });
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Incident form state
  const [incidentForm, setIncidentForm] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM',
    departmentId: '',
    assignedEmployeeId: '',
    slaHours: 4,
  });
  const [isCreatingIncident, setIsCreatingIncident] = useState(false);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingTask(true);
    try {
      const payload: any = {
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
        slaHours: Number(taskForm.slaHours),
        estimatedHours: Number(taskForm.estimatedHours),
        departmentId: taskForm.departmentId || null,
        assignedToId: taskForm.assignedToId || null,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : null,
      };

      const res = await api.post('/tasks', payload);
      showToast('Task created successfully', 'success', res.data.data.taskCode);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      setIsTaskModalOpen(false);
      setTaskForm({
        title: '',
        description: '',
        departmentId: '',
        assignedToId: '',
        priority: 'MEDIUM',
        slaHours: 24,
        estimatedHours: 8,
        dueDate: '',
      });
      navigate(`/tasks/${res.data.data.id}`);
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to create task', 'error');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingIncident(true);
    try {
      const payload: any = {
        title: incidentForm.title,
        description: incidentForm.description,
        severity: incidentForm.severity,
        slaHours: Number(incidentForm.slaHours),
        departmentId: incidentForm.departmentId || null,
        assignedEmployeeId: incidentForm.assignedEmployeeId || null,
      };

      const res = await api.post('/incidents', payload);
      showToast('Incident reported successfully', 'success', res.data.data.incidentCode);
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      setIsIncidentModalOpen(false);
      setIncidentForm({
        title: '',
        description: '',
        severity: 'MEDIUM',
        departmentId: '',
        assignedEmployeeId: '',
        slaHours: 4,
      });
      navigate(`/incidents/${res.data.data.id}`);
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to report incident', 'error');
    } finally {
      setIsCreatingIncident(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 selection:bg-brand-500 selection:text-white transition-colors">
      <Sidebar
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onQuickTask={() => setIsTaskModalOpen(true)}
          onQuickIncident={() => setIsIncidentModalOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />
        <RealTimeStatusBar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenTaskModal={() => setIsTaskModalOpen(true)}
        onOpenIncidentModal={() => setIsIncidentModalOpen(true)}
      />

      {/* AI Copilot & SRE Assistant Drawer (A) */}
      <AICopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      {/* Keyboard Shortcuts Cheat Sheet (?) */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Linear-Style Quick Dispatch Modal (C) */}
      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
      />

      {/* Quick Create Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Create New Operational Task"
        description="Allocate work items with SLA tracking and assignee attribution."
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Task Title"
            required
            placeholder="e.g. Upgrade PostgreSQL Cluster to v16"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-slate-300">Description *</label>
            <textarea
              required
              rows={3}
              placeholder="Provide context, acceptance criteria, and operational guidelines..."
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Priority"
              value={taskForm.priority}
              onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
              options={[
                { label: 'Low', value: 'LOW' },
                { label: 'Medium', value: 'MEDIUM' },
                { label: 'High', value: 'HIGH' },
                { label: 'Critical', value: 'CRITICAL' },
              ]}
            />

            <Select
              label="Department"
              value={taskForm.departmentId}
              onChange={(e) => setTaskForm({ ...taskForm, departmentId: e.target.value })}
              options={[
                { label: 'Select Department...', value: '' },
                ...departments.map((d) => ({ label: d.name, value: d.id })),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Assign Employee"
              value={taskForm.assignedToId}
              onChange={(e) => setTaskForm({ ...taskForm, assignedToId: e.target.value })}
              options={[
                { label: 'Unassigned', value: '' },
                ...employees.map((emp) => ({
                  label: `${emp.firstName} ${emp.lastName} (${emp.designation})`,
                  value: emp.id,
                })),
              ]}
            />

            <Input
              label="SLA Target (Hours)"
              type="number"
              min={1}
              value={taskForm.slaHours}
              onChange={(e) => setTaskForm({ ...taskForm, slaHours: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Estimated Hours"
              type="number"
              min={0}
              value={taskForm.estimatedHours}
              onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: Number(e.target.value) })}
            />

            <Input
              label="Due Date"
              type="datetime-local"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreatingTask}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Report Incident Modal */}
      <Modal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        title="Report Operational Incident"
        description="Trigger high-priority incident triage with SLA breach monitoring."
      >
        <form onSubmit={handleCreateIncident} className="space-y-4">
          <Input
            label="Incident Title"
            required
            placeholder="e.g. EU-West Payment Gateway Timeout"
            value={incidentForm.title}
            onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-slate-300">Incident Telemetry & Details *</label>
            <textarea
              required
              rows={3}
              placeholder="Describe symptoms, impacted regions, error logs, and immediate impact..."
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              value={incidentForm.description}
              onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Severity"
              value={incidentForm.severity}
              onChange={(e) => {
                const sev = e.target.value;
                const sla = sev === 'CRITICAL' ? 1 : sev === 'HIGH' ? 4 : sev === 'MEDIUM' ? 12 : 48;
                setIncidentForm({ ...incidentForm, severity: sev, slaHours: sla });
              }}
              options={[
                { label: 'Critical (P1 - 1 Hour SLA)', value: 'CRITICAL' },
                { label: 'High (P2 - 4 Hours SLA)', value: 'HIGH' },
                { label: 'Medium (P3 - 12 Hours SLA)', value: 'MEDIUM' },
                { label: 'Low (P4 - 48 Hours SLA)', value: 'LOW' },
              ]}
            />

            <Select
              label="Responding Department"
              value={incidentForm.departmentId}
              onChange={(e) => setIncidentForm({ ...incidentForm, departmentId: e.target.value })}
              options={[
                { label: 'Select Department...', value: '' },
                ...departments.map((d) => ({ label: d.name, value: d.id })),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Assign On-Call Engineer"
              value={incidentForm.assignedEmployeeId}
              onChange={(e) => setIncidentForm({ ...incidentForm, assignedEmployeeId: e.target.value })}
              options={[
                { label: 'Unassigned (Triage Pool)', value: '' },
                ...employees.map((emp) => ({
                  label: `${emp.firstName} ${emp.lastName} (${emp.designation})`,
                  value: emp.id,
                })),
              ]}
            />

            <Input
              label="SLA Target (Hours)"
              type="number"
              min={0.5}
              value={incidentForm.slaHours}
              onChange={(e) => setIncidentForm({ ...incidentForm, slaHours: Number(e.target.value) })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsIncidentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" isLoading={isCreatingIncident}>
              Report Incident
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
