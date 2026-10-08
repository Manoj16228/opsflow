import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Users,
  Building,
  Mail,
  Phone,
  Calendar,
  CheckSquare,
  AlertTriangle,
  Award,
  TrendingUp,
  Clock,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton, ErrorState } from '../components/ui/EmptyState';
import { formatDate, getPriorityBadgeColor, getStatusBadgeColor } from '../lib/utils';
import { Employee } from '../types';

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: employee,
    isLoading,
    error,
    refetch,
  } = useQuery<Employee>({
    queryKey: ['employee', id],
    queryFn: async () => (await api.get(`/employees/${id}`)).data.data,
    enabled: !!id,
  });

  if (error) {
    return <ErrorState title="Employee not found" onRetry={() => refetch()} />;
  }

  if (isLoading || !employee) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const perf = employee.performance || {
    totalAssignedTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    taskCompletionRate: 100,
    assignedIncidents: 0,
    resolvedIncidents: 0,
    slaComplianceRate: 100,
  };

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <button
          onClick={() => navigate('/employees')}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              {employee.employeeCode}
            </span>
            <h1 className="text-xl font-bold text-white">
              {employee.firstName} {employee.lastName}
            </h1>
            <Badge variant={employee.status === 'ACTIVE' ? 'success' : 'warning'}>
              {employee.status}
            </Badge>
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">{employee.designation}</span>
        </div>
      </div>

      {/* Performance Score Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase">Task Completion</span>
            <CheckSquare className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-bold text-brand-400">{perf.taskCompletionRate}%</div>
          <span className="text-[11px] text-slate-400">
            {perf.completedTasks} of {perf.totalAssignedTasks} tasks completed
          </span>
        </Card>

        <Card className="p-4 bg-slate-900/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase">SLA Compliance</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{perf.slaComplianceRate}%</div>
          <span className="text-[11px] text-slate-400">Resolution performance</span>
        </Card>

        <Card className="p-4 bg-slate-900/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase">Overdue Tasks</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-bold ${perf.overdueTasks > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
            {perf.overdueTasks}
          </div>
          <span className="text-[11px] text-slate-400">Past SLA deadline</span>
        </Card>

        <Card className="p-4 bg-slate-900/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase">Incidents Handled</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">{perf.assignedIncidents}</div>
          <span className="text-[11px] text-slate-400">{perf.resolvedIncidents} resolved</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Sidebar */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Employee Profile</CardTitle>
            <Shield className="w-4 h-4 text-brand-400" />
          </CardHeader>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Department</span>
              <div className="font-medium text-slate-200 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                {employee.department?.name || 'General Operations'}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Manager</span>
              {employee.manager ? (
                <div
                  className="font-medium text-slate-200 hover:text-brand-400 cursor-pointer"
                  onClick={() => navigate(`/employees/${employee.manager?.id}`)}
                >
                  {employee.manager.firstName} {employee.manager.lastName} ({employee.manager.designation})
                </div>
              ) : (
                <span className="text-slate-400 italic">Executive Lead</span>
              )}
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Email</span>
              <div className="font-mono text-slate-200">{employee.email}</div>
            </div>

            {employee.phone && (
              <div>
                <span className="text-slate-400 block mb-0.5">Phone</span>
                <div className="font-mono text-slate-200">{employee.phone}</div>
              </div>
            )}

            <div>
              <span className="text-slate-400 block mb-0.5">Joining Date</span>
              <div className="text-slate-200">{formatDate(employee.joiningDate)}</div>
            </div>

            {employee.skills && employee.skills.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 block mb-1.5 font-medium">Core Skills & Stacks</span>
                <div className="flex flex-wrap gap-1">
                  {employee.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-950 text-slate-300 border border-slate-800 font-mono"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Assigned Tasks & Activity (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Workload Items</CardTitle>
              <Badge variant="info">Active Queue</Badge>
            </CardHeader>
            <div className="space-y-2.5">
              {employee.recentTasks && employee.recentTasks.length > 0 ? (
                employee.recentTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] text-brand-400 font-bold">
                          {task.taskCode}
                        </span>
                        <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white">
                          {task.title}
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Due {formatDate(task.dueDate)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium border ${getStatusBadgeColor(
                          task.status
                        )}`}
                      >
                        {task.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic text-center py-4">
                  No active tasks currently assigned.
                </div>
              )}
            </div>
          </Card>

          {/* Recent Incidents */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Incidents & Outages</CardTitle>
              <Badge variant="danger">Triage History</Badge>
            </CardHeader>
            <div className="space-y-2.5">
              {employee.recentIncidents && employee.recentIncidents.length > 0 ? (
                employee.recentIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                    className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] text-rose-400 font-bold">
                          {inc.incidentCode}
                        </span>
                        <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white">
                          {inc.title}
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Reported {formatDate(inc.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium border ${getStatusBadgeColor(
                          inc.status
                        )}`}
                      >
                        {inc.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic text-center py-4">
                  No incidents assigned to this engineer.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
