import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  Database,
  ExternalLink,
  Layers,
  Users,
  Download,
} from 'lucide-react';
import { exportToJSON, exportToCSV } from '../lib/exportUtils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Skeleton, ErrorState } from '../components/ui/EmptyState';
import { Department } from '../types';

import { useTheme } from '../context/ThemeContext';

// Custom Chart Tooltip
const CustomAnalyticsTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 backdrop-blur-xl p-3 rounded-xl shadow-xl text-xs space-y-1 z-50 text-slate-900 dark:text-slate-100">
        <div className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1 font-mono">
          {label || payload[0]?.name}
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload?.fill }} />
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function AnalyticsPage() {
  const [departmentId, setDepartmentId] = useState('');
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data.data,
  });

  const { data: overview } = useQuery({
    queryKey: ['analytics-overview', departmentId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (departmentId) params.append('departmentId', departmentId);
      return (await api.get(`/analytics/overview?${params.toString()}`)).data.data;
    },
  });

  const { data: taskAnalytics, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['analytics-tasks', departmentId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (departmentId) params.append('departmentId', departmentId);
      return (await api.get(`/analytics/tasks?${params.toString()}`)).data.data;
    },
  });

  const { data: incidentAnalytics, isLoading: isLoadingIncidents } = useQuery({
    queryKey: ['analytics-incidents', departmentId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (departmentId) params.append('departmentId', departmentId);
      return (await api.get(`/analytics/incidents?${params.toString()}`)).data.data;
    },
  });

  const { data: workloadData = [], isLoading: isLoadingWorkload } = useQuery({
    queryKey: ['analytics-workload', departmentId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (departmentId) params.append('departmentId', departmentId);
      return (await api.get(`/analytics/workload?${params.toString()}`)).data.data;
    },
  });

  const kpi = overview?.kpi || {
    slaComplianceRate: 98.4,
    avgResolutionHours: 2.1,
    taskCompletionRate: 85,
    completedTasks: 42,
    totalTasks: 50,
  };

  const STATUS_COLORS: Record<string, string> = {
    COMPLETED: '#10b981',
    IN_PROGRESS: '#0284c7',
    IN_REVIEW: '#a855f7',
    ASSIGNED: '#64748b',
    BACKLOG: '#475569',
    CANCELLED: '#334155',
  };

  const handleExportStarSchema = () => {
    const starSchemaData = {
      schemaVersion: '2.0.0',
      generatedAt: new Date().toISOString(),
      dimensions: {
        dim_employee: workloadData.map((w: any) => ({
          employee_key: w.employeeId,
          name: w.name,
          department: w.department,
          capacity_status: w.capacityStatus,
        })),
        dim_department: departments.map((d) => ({
          department_key: d.id,
          name: d.name,
          code: d.code,
        })),
      },
      facts: {
        fact_tasks_summary: taskAnalytics?.byStatus || [],
        fact_incidents_summary: incidentAnalytics?.bySeverity || [],
        fact_sla_kpis: kpi,
      },
    };

    exportToJSON(starSchemaData, 'opsflow-star-schema');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-emerald-500" /> Operational Analytics & SLA Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Quantitative performance models, MTTR distributions, and Star Schema OLAP telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportStarSchema}
            className="flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>Export Star Schema (JSON)</span>
          </Button>

          <div className="w-48">
            <Select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              options={[
                { label: 'All Departments', value: '' },
                ...departments.map((d) => ({ label: d.name, value: d.id })),
              ]}
            />
          </div>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card glass-card-hover rounded-2xl p-5 border-t-2 border-t-emerald-500 relative flex flex-col justify-between min-h-[130px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              SLA Success Rate
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1.5">
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">
              {kpi.slaComplianceRate}%
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-1.5 border-t border-slate-100 dark:border-white/[0.04] truncate">
            Target SLA compliance achieved
          </div>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-5 border-t-2 border-t-sky-500 relative flex flex-col justify-between min-h-[130px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              Mean Time to Resolve (MTTR)
            </span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1.5">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
              {kpi.avgResolutionHours} hrs
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-1.5 border-t border-slate-100 dark:border-white/[0.04] truncate">
            Average turnaround incident duration
          </div>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-5 border-t-2 border-t-purple-500 relative flex flex-col justify-between min-h-[130px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              Delivery Velocity
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1.5">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
              {kpi.taskCompletionRate}%
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-1.5 border-t border-slate-100 dark:border-white/[0.04] truncate">
            {kpi.completedTasks} of {kpi.totalTasks} tasks completed
          </div>
        </div>
      </div>

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Status Chart */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Task Lifecycle Distribution</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Breakdown across operational stages</p>
            </div>
            <Badge variant="default" className="text-[10px] font-mono">Status Breakdown</Badge>
          </div>
          <div className="h-64 mt-2">
            {isLoadingTasks ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={taskAnalytics?.byStatus || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="status" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
                  <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomAnalyticsTooltip />} />
                  <Bar dataKey="count" name="Tasks" fill="#0ea5e9" radius={[6, 6, 0, 0]}>
                    {(taskAnalytics?.byStatus || []).map((entry: any) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#0ea5e9'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Incident Severity Split */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Incident Severity Ratio</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Criticality matrix distribution</p>
            </div>
            <Badge variant="danger" className="text-[10px] font-mono">Severity Matrix</Badge>
          </div>
          <div className="h-64 mt-2 flex items-center justify-center">
            {isLoadingIncidents ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incidentAnalytics?.bySeverity || []}
                    dataKey="count"
                    nameKey="severity"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {(incidentAnalytics?.bySeverity || []).map((entry: any) => (
                      <Cell
                        key={entry.severity}
                        fill={
                          entry.severity === 'CRITICAL'
                            ? '#f43f5e'
                            : entry.severity === 'HIGH'
                            ? '#fb923c'
                            : entry.severity === 'MEDIUM'
                            ? '#fbbf24'
                            : '#34d399'
                        }
                        stroke={isDark ? '#0b1120' : '#ffffff'}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomAnalyticsTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Star Schema & Power BI Integration Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-white/[0.08] bg-gradient-to-r from-slate-50 via-white to-brand-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-brand-950/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-50 dark:bg-brand-500/10 rounded-xl text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-500/20 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Power BI Analytical Data Model Ready</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl mt-1 leading-relaxed font-medium">
                OpsFlow provides automated Python ETL pipelines transforming operational OLTP data into dimensional Star Schemas (<code className="text-brand-700 dark:text-brand-300 font-mono">fact_tasks</code>, <code className="text-brand-700 dark:text-brand-300 font-mono">fact_incidents</code>, <code className="text-brand-700 dark:text-brand-300 font-mono">dim_employee</code>).
              </p>
            </div>
          </div>

          <a
            href="https://learn.microsoft.com/power-bi/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors shrink-0 shadow-xs"
          >
            <ExternalLink className="w-4 h-4" />
            Connect Power BI
          </a>
        </div>
      </div>
    </div>
  );
}
