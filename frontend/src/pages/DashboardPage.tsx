import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckSquare,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  TrendingUp,
  Activity,
  Filter,
  BarChart2,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Zap,
  Radio,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Skeleton, ErrorState } from '../components/ui/EmptyState';
import { Department } from '../types';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';

// Custom Frosted Glass Tooltip for Recharts
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/90 backdrop-blur-xl p-3 rounded-xl shadow-xl text-xs space-y-1.5 z-50 text-slate-900 dark:text-slate-100">
        <div className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1 font-mono">
          {label}
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
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

export function DashboardPage() {
  const [departmentId, setDepartmentId] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('all');
  const navigate = useNavigate();
  const { isConnected } = useSocket();
  const { actualTheme } = useTheme();

  const isDark = actualTheme === 'dark';

  // Load Departments for filter dropdown
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data.data,
  });

  // Load Overview KPIs
  const {
    data: overview,
    isLoading: isLoadingOverview,
    error: overviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ['analytics-overview', departmentId, timeRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (departmentId) params.append('departmentId', departmentId);
      return (await api.get(`/analytics/overview?${params.toString()}`)).data.data;
    },
  });

  // Load Task Analytics
  const { data: taskData, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['analytics-tasks', departmentId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (departmentId) params.append('departmentId', departmentId);
      return (await api.get(`/analytics/tasks?${params.toString()}`)).data.data;
    },
  });

  // Load Incident Analytics
  const { data: incidentData, isLoading: isLoadingIncidents } = useQuery({
    queryKey: ['analytics-incidents', departmentId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (departmentId) params.append('departmentId', departmentId);
      return (await api.get(`/analytics/incidents?${params.toString()}`)).data.data;
    },
  });

  // Load Workload Analytics
  const { data: workloadData = [], isLoading: isLoadingWorkload } = useQuery({
    queryKey: ['analytics-workload', departmentId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (departmentId) params.append('departmentId', departmentId);
      return (await api.get(`/analytics/workload?${params.toString()}`)).data.data;
    },
  });

  if (overviewError) {
    return <ErrorState onRetry={() => refetchOverview()} />;
  }

  const kpi = overview?.kpi || {
    totalEmployees: 0,
    totalTasks: 0,
    completedTasks: 0,
    taskCompletionRate: 0,
    overdueTasks: 0,
    openIncidents: 0,
    criticalIncidents: 0,
    slaComplianceRate: 100,
    avgResolutionHours: 0,
  };

  const PRIORITY_COLORS: Record<string, string> = {
    CRITICAL: '#e11d48',
    HIGH: '#ea580c',
    MEDIUM: '#d97706',
    LOW: '#059669',
  };

  return (
    <div className="space-y-7 text-left">
      {/* Page Title & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              Executive Operations Command
            </h1>
            <Badge variant="success" dot className="text-[11px] font-mono shadow-glow-emerald">
              LIVE TELEMETRY
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Real-time organizational health, SLA compliance ratings, and workforce load distribution.
          </p>
        </div>

        {/* Filter Pills & Department Select */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time range pills */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-inner">
            {[
              { label: 'All Time', value: 'all' },
              { label: '30 Days', value: '30d' },
              { label: '7 Days', value: '7d' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setTimeRange(tab.value)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  timeRange === tab.value
                    ? 'bg-brand-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

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

      {/* Top 6 KPI Cards with Glow Accents */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {isLoadingOverview ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
        ) : (
          <>
            {/* 1. Workforce */}
            <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-4.5 border-t-2 border-t-purple-500 relative flex flex-col justify-between min-h-[124px] group">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  Workforce
                </span>
                <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="my-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                  {kpi.totalEmployees}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1 border-t border-slate-100 dark:border-white/[0.04] truncate">
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">100% capacity</span>
              </div>
            </div>

            {/* 2. Total Tasks */}
            <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-4.5 border-t-2 border-t-brand-500 relative flex flex-col justify-between min-h-[124px] group">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  Total Tasks
                </span>
                <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 shrink-0">
                  <CheckSquare className="w-4 h-4" />
                </div>
              </div>
              <div className="my-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                  {kpi.totalTasks}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-brand-600 dark:text-brand-400 font-semibold pt-1 border-t border-slate-100 dark:border-white/[0.04] truncate">
                <span className="truncate">{kpi.taskCompletionRate}% done</span>
              </div>
            </div>

            {/* 3. Completed Tasks */}
            <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-4.5 border-t-2 border-t-emerald-500 relative flex flex-col justify-between min-h-[124px] group">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  Completed
                </span>
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="my-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">
                  {kpi.completedTasks}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1 border-t border-slate-100 dark:border-white/[0.04] truncate">
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Verified</span>
              </div>
            </div>

            {/* 4. Overdue Tasks */}
            <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-4.5 border-t-2 border-t-amber-500 relative flex flex-col justify-between min-h-[124px] group">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  Overdue
                </span>
                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="my-1">
                <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight leading-none ${kpi.overdueTasks > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {kpi.overdueTasks}
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-1 border-t border-slate-100 dark:border-white/[0.04] truncate">
                <span className="truncate">Target breach</span>
              </div>
            </div>

            {/* 5. Open Incidents */}
            <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-4.5 border-t-2 border-t-rose-500 relative flex flex-col justify-between min-h-[124px] group">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  Incidents
                </span>
                <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="my-1">
                <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight leading-none ${kpi.openIncidents > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {kpi.openIncidents}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 font-semibold pt-1 border-t border-slate-100 dark:border-white/[0.04] truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                <span className="truncate">{kpi.criticalIncidents} Critical P1</span>
              </div>
            </div>

            {/* 6. SLA Compliance */}
            <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-4.5 border-t-2 border-t-sky-500 relative flex flex-col justify-between min-h-[124px] group">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  SLA Rating
                </span>
                <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="my-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-sky-600 dark:text-sky-400 tracking-tight leading-none">
                  {kpi.slaComplianceRate}%
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-1 border-t border-slate-100 dark:border-white/[0.04] truncate">
                <span className="truncate">MTTR {kpi.avgResolutionHours}h avg</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Primary Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: 7-Day Velocity Trend */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-2 border-b border-slate-100 dark:border-white/[0.06] gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-500" /> Task Velocity & Delivery Trajectory
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Daily task creation rate vs completed deliverables over past 7 days
              </p>
            </div>
            <Badge variant="info" className="w-fit text-[10px] font-mono">
              Rolling 7-Day Window
            </Badge>
          </div>

          <div className="h-68 mt-3">
            {isLoadingTasks ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={taskData?.trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="date" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
                  <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    dataKey="created"
                    name="Tasks Created"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCreated)"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Tasks Completed"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Priority Severity Split */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Priority Split</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Task distribution by urgency</p>
            </div>
            <Badge variant="purple" className="text-[10px] font-mono">
              Severity Matrix
            </Badge>
          </div>

          <div className="h-68 mt-2 flex items-center justify-center">
            {isLoadingTasks ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={taskData?.byPriority || []}
                    dataKey="count"
                    nameKey="priority"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                  >
                    {(taskData?.byPriority || []).map((entry: any) => (
                      <Cell
                        key={entry.priority}
                        fill={PRIORITY_COLORS[entry.priority] || '#64748b'}
                        stroke={isDark ? '#0b1120' : '#ffffff'}
                        strokeWidth={3}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Department Workload Allocation */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Department Workload</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Active tasks allocated across business units</p>
            </div>
            <Badge variant="default" className="text-[10px] font-mono">
              Distribution
            </Badge>
          </div>

          <div className="h-64 mt-2">
            {isLoadingTasks ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={taskData?.byDepartment || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="code" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
                  <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="count" name="Allocated Tasks" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 4: Incident Triage & SLA Compliance */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" /> Incident SLA Compliance
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Triage resolution adherence and breaches</p>
            </div>
            <Badge variant="success" className="text-[10px] font-mono">
              {incidentData?.slaSummary?.complianceRate || 98}% Target Met
            </Badge>
          </div>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 dark:bg-slate-950/70 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Resolved
                </span>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {incidentData?.slaSummary?.totalResolved || 0}
                </div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-500/30 text-center">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  SLA Met
                </span>
                <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
                  {incidentData?.slaSummary?.met || 0}
                </div>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-200 dark:border-rose-500/30 text-center">
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  Breached
                </span>
                <div className="text-2xl font-extrabold text-rose-700 dark:text-rose-400 mt-1">
                  {incidentData?.slaSummary?.breached || 0}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Severity Breakdown</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(incidentData?.bySeverity || []).map((s: any) => (
                  <div
                    key={s.severity}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center"
                  >
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">{s.severity}</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workforce Capacity & Real-Time Balancing Table */}
      <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-white/[0.06] gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Active Workforce Capacity & Load
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Real-time engineering bandwidth and incident dispatch allocation</p>
          </div>
          <button
            onClick={() => navigate('/employees')}
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors flex items-center gap-1"
          >
            <span>View All Staff</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950/70 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Engineer</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Active Tasks</th>
                <th className="py-3 px-4">Open Incidents</th>
                <th className="py-3 px-4">Capacity Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoadingWorkload ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">Loading workforce telemetry...</td>
                </tr>
              ) : (
                workloadData.slice(0, 5).map((emp: any) => (
                  <tr
                    key={emp.employeeId}
                    onClick={() => navigate(`/employees/${emp.employeeId}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs">
                          {emp.name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-white transition-colors">
                            {emp.name}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{emp.designation}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{emp.department}</td>
                    <td className="py-3 px-4 font-mono text-brand-600 dark:text-brand-400 font-bold">{emp.activeTasks}</td>
                    <td className="py-3 px-4 font-mono text-rose-600 dark:text-rose-400 font-bold">{emp.openIncidents}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          emp.capacityStatus === 'OVERLOADED'
                            ? 'danger'
                            : emp.capacityStatus === 'HIGH'
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {emp.capacityStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 inline group-hover:text-slate-900 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
