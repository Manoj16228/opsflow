import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckSquare,
  Search,
  Filter,
  Plus,
  LayoutGrid,
  List,
  Clock,
  AlertCircle,
  Calendar,
  User,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Download,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { EmptyState, Skeleton, ErrorState } from '../components/ui/EmptyState';
import { formatDate, getPriorityBadgeColor, getStatusBadgeColor, isDateOverdue } from '../lib/utils';
import { Task, Department, TaskStatus, Priority } from '../types';
import { exportToCSV } from '../lib/exportUtils';
import { useToast } from '../context/ToastContext';
import { playChime } from '../lib/audioAlerts';

export function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Load Departments
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data.data,
  });

  // Load Tasks
  const {
    data: taskResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tasks', search, status, priority, departmentId, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      if (departmentId) params.append('departmentId', departmentId);
      params.append('page', String(page));
      params.append('limit', '30');

      return (await api.get(`/tasks?${params.toString()}`)).data;
    },
  });

  const tasks: Task[] = taskResponse?.data || [];
  const meta = taskResponse?.meta || { totalCount: 0, totalPages: 1 };

  const handleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map((t) => t.id));
    }
  };

  const handleToggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = async (newStatus: TaskStatus) => {
    setIsBulkUpdating(true);
    try {
      await Promise.all(
        selectedTaskIds.map((id) => api.patch(`/tasks/${id}/status`, { status: newStatus }))
      );
      showToast(`Updated ${selectedTaskIds.length} tasks to ${newStatus}`, 'success');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      setSelectedTaskIds([]);
      playChime('success');
    } catch (err: any) {
      showToast('Failed to perform bulk update', 'error');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleExportCSV = () => {
    const dataToExport = selectedTaskIds.length > 0
      ? tasks.filter((t) => selectedTaskIds.includes(t.id))
      : tasks;

    const formatted = dataToExport.map((t) => ({
      TaskCode: t.taskCode,
      Title: t.title,
      Priority: t.priority,
      Status: t.status,
      Department: t.department?.name || 'General Operations',
      Assignee: t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : 'Unassigned',
      DueDate: t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : 'N/A',
      SLAHours: t.slaHours,
      EstimatedHours: t.estimatedHours,
    }));

    exportToCSV(formatted, `opsflow-tasks`);
    showToast(`Exported ${formatted.length} tasks to CSV`, 'success');
    playChime('success');
  };

  const KANBAN_COLUMNS: { title: string; status: TaskStatus; accent: string; border: string }[] = [
    { title: 'Backlog', status: 'BACKLOG', accent: 'text-slate-600 dark:text-slate-400', border: 'border-t-slate-500' },
    { title: 'Assigned', status: 'ASSIGNED', accent: 'text-purple-600 dark:text-purple-400', border: 'border-t-purple-500' },
    { title: 'In Progress', status: 'IN_PROGRESS', accent: 'text-sky-600 dark:text-sky-400', border: 'border-t-sky-500' },
    { title: 'In Review', status: 'IN_REVIEW', accent: 'text-amber-600 dark:text-amber-400', border: 'border-t-amber-500' },
    { title: 'Completed', status: 'COMPLETED', accent: 'text-emerald-600 dark:text-emerald-400', border: 'border-t-emerald-500' },
  ];

  return (
    <div className="space-y-6 text-left relative pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <CheckSquare className="w-7 h-7 text-brand-500" /> Operational Task Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Enterprise workload orchestration, SLA compliance countdowns, and cross-functional task tracking.
          </p>
        </div>

        {/* View Switcher & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5"
            disabled={tasks.length === 0}
          >
            <Download className="w-3.5 h-3.5 text-brand-500" />
            <span>Export CSV</span>
          </Button>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-brand-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Table View
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-brand-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban Board
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 glass-card p-3.5 rounded-2xl border border-slate-200 dark:border-white/[0.08]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks or codes (e.g. TSK-1001)..."
            className="w-full bg-white dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors shadow-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { label: 'All Statuses', value: '' },
            { label: 'Backlog', value: 'BACKLOG' },
            { label: 'Assigned', value: 'ASSIGNED' },
            { label: 'In Progress', value: 'IN_PROGRESS' },
            { label: 'In Review', value: 'IN_REVIEW' },
            { label: 'Completed', value: 'COMPLETED' },
            { label: 'Cancelled', value: 'CANCELLED' },
          ]}
        />

        <Select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          options={[
            { label: 'All Priorities', value: '' },
            { label: 'Low', value: 'LOW' },
            { label: 'Medium', value: 'MEDIUM' },
            { label: 'High', value: 'HIGH' },
            { label: 'Critical', value: 'CRITICAL' },
          ]}
        />

        <Select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          options={[
            { label: 'All Departments', value: '' },
            ...departments.map((d) => ({ label: d.name, value: d.id })),
          ]}
        />
      </div>

      {/* Content Area */}
      {error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description="No operational tasks match the active filter criteria. Try adjusting your search query or create a new task."
        />
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.length === tasks.length && tasks.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Task Code & Title</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Assignee</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">SLA Target</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {tasks.map((task) => {
                  const isSelected = selectedTaskIds.includes(task.id);
                  const overdue = isDateOverdue(task.dueDate, task.status === 'COMPLETED');
                  return (
                    <tr
                      key={task.id}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className={`cursor-pointer transition-colors group ${
                        isSelected
                          ? 'bg-brand-50/70 dark:bg-brand-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-850/60'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center" onClick={(e) => handleToggleSelect(e, task.id)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-[11px] text-brand-700 dark:text-brand-400 font-bold bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-500/20">
                            {task.taskCode}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-white transition-colors">
                            {task.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getPriorityBadgeColor(
                            task.priority
                          )}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeColor(
                            task.status
                          )}`}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-400 font-medium">
                        {task.department?.name || 'General Operations'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {task.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-[10px] text-white font-bold shrink-0 shadow-xs">
                              {task.assignedTo.firstName[0]}
                            </div>
                            <span className="font-medium">
                              {task.assignedTo.firstName} {task.assignedTo.lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic font-medium">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={overdue ? 'text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1' : 'text-slate-600 dark:text-slate-400 font-medium'}>
                          {overdue && <Clock className="w-3.5 h-3.5" />}
                          {formatDate(task.dueDate)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 font-semibold">
                        {task.slaHours || 24}h SLA
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 inline group-hover:text-slate-900 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                className={`glass-card rounded-2xl p-3.5 flex flex-col min-h-[550px] border-t-2 ${col.border}`}
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-white/[0.06]">
                  <span className={`text-xs font-bold uppercase tracking-wider ${col.accent}`}>
                    {col.title}
                  </span>
                  <Badge variant="default" className="text-[10px] font-mono px-2 py-0.5">
                    {colTasks.length}
                  </Badge>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="bg-white dark:bg-slate-950/85 border border-slate-200 dark:border-slate-800/90 rounded-xl p-3.5 hover:border-brand-500/40 cursor-pointer shadow-xs dark:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-[10px] text-brand-700 dark:text-brand-400 font-bold bg-brand-50 dark:bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-200 dark:border-brand-500/20">
                          {task.taskCode}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${getPriorityBadgeColor(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-white line-clamp-2 mb-3">
                        {task.title}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2.5 border-t border-slate-100 dark:border-slate-900">
                        <div className="flex items-center gap-1.5 truncate">
                          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[9px] text-brand-600 dark:text-brand-400 font-bold">
                            {task.assignedTo ? task.assignedTo.firstName[0] : '?'}
                          </div>
                          <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                            {task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName[0]}.` : 'Unassigned'}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 shrink-0">
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedTaskIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 backdrop-blur-xl flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700 text-xs font-bold">
            <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px]">
              {selectedTaskIds.length}
            </span>
            <span>Tasks Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              className="flex items-center gap-1.5 text-xs py-1"
              onClick={() => handleBulkStatusChange('COMPLETED')}
              isLoading={isBulkUpdating}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mark Completed</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1.5 text-xs py-1 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
              onClick={handleExportCSV}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Selected</span>
            </Button>

            <button
              onClick={() => setSelectedTaskIds([])}
              className="text-xs font-medium text-slate-400 hover:text-white px-2 py-1"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
