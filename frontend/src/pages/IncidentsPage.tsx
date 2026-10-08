import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  Flame,
  Zap,
  Activity,
} from 'lucide-react';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { EmptyState, Skeleton, ErrorState } from '../components/ui/EmptyState';
import { formatDate, formatRelativeTime, getPriorityBadgeColor, getStatusBadgeColor } from '../lib/utils';
import { Incident, IncidentSeverity, IncidentStatus, Department } from '../types';

import { exportToCSV } from '../lib/exportUtils';
import { Download } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function IncidentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [page, setPage] = useState(1);

  // Load Departments
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data.data,
  });

  // Load Incidents
  const {
    data: incidentResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['incidents', search, severity, status, departmentId, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (severity) params.append('severity', severity);
      if (status) params.append('status', status);
      if (departmentId) params.append('departmentId', departmentId);
      params.append('page', String(page));
      params.append('limit', '30');

      return (await api.get(`/incidents?${params.toString()}`)).data;
    },
  });

  const incidents: Incident[] = incidentResponse?.data || [];
  const meta = incidentResponse?.meta || { totalCount: 0, totalPages: 1 };

  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;
  const highCount = incidents.filter((i) => i.severity === 'HIGH' && i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;
  const openCount = incidents.filter((i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;

  const handleExportCSV = () => {
    const formatted = incidents.map((i) => ({
      IncidentCode: i.incidentCode,
      Title: i.title,
      Severity: i.severity,
      Status: i.status,
      Department: i.department?.name || 'Operations',
      ReportedBy: i.reportedBy ? `${i.reportedBy.firstName} ${i.reportedBy.lastName}` : 'System',
      Created: new Date(i.createdAt).toISOString(),
      Resolved: i.resolvedAt ? new Date(i.resolvedAt).toISOString() : 'Active',
      SLA_Deadline: i.slaDeadline ? new Date(i.slaDeadline).toISOString() : 'N/A',
    }));

    exportToCSV(formatted, 'opsflow-incidents');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <Flame className="w-7 h-7 text-rose-500" /> Incident Triage & SLA Command
            </h1>
            {criticalCount > 0 && (
              <Badge variant="danger" dot className="text-xs font-mono shadow-glow-rose">
                {criticalCount} P1 ACTIVE
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Real-time outage response, on-call engineer dispatching, and automated SLA breach mitigation.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 self-start sm:self-auto"
          disabled={incidents.length === 0}
        >
          <Download className="w-3.5 h-3.5 text-rose-500" />
          <span>Export Incidents CSV</span>
        </Button>
      </div>

      {/* Incident Severity Metric Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-rose-500 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Critical Outages (P1)
            </span>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{criticalCount}</div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">1 Hour SLA Target</span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              High Severity (P2)
            </span>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{highCount}</div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">4 Hours SLA Target</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Active Incidents
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{openCount}</div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Under active investigation</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 glass-card p-3.5 rounded-2xl border border-slate-200 dark:border-white/[0.08]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search incident title or code (e.g. INC-2001)..."
            className="w-full bg-white dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors shadow-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          options={[
            { label: 'All Severities', value: '' },
            { label: 'Critical (P1)', value: 'CRITICAL' },
            { label: 'High (P2)', value: 'HIGH' },
            { label: 'Medium (P3)', value: 'MEDIUM' },
            { label: 'Low (P4)', value: 'LOW' },
          ]}
        />

        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { label: 'All Statuses', value: '' },
            { label: 'Open', value: 'OPEN' },
            { label: 'Assigned', value: 'ASSIGNED' },
            { label: 'Investigating', value: 'INVESTIGATING' },
            { label: 'Resolved', value: 'RESOLVED' },
            { label: 'Closed', value: 'CLOSED' },
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
      ) : incidents.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No incidents reported"
          description="All operational systems and cloud microservices are healthy and running within target service level standards."
        />
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-white/[0.08] shadow-xs dark:shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Incident Code & Title</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Responding Team</th>
                  <th className="py-3.5 px-4">On-Call Engineer</th>
                  <th className="py-3.5 px-4">SLA Clock</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {incidents.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-850/60 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[11px] text-rose-700 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-500/20">
                          {inc.incidentCode}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-white transition-colors">
                          {inc.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getPriorityBadgeColor(
                          inc.severity
                        )}`}
                      >
                        {inc.severity === 'CRITICAL' && <Flame className="w-3 h-3 text-rose-500 animate-pulse" />}
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeColor(
                          inc.status
                        )}`}
                      >
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-400 font-medium">
                      {inc.department?.name || 'Platform Operations'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {inc.assignedEmployee ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-[10px] text-white font-bold shrink-0 shadow-xs">
                            {inc.assignedEmployee.firstName[0]}
                          </div>
                          <span className="font-medium">
                            {inc.assignedEmployee.firstName} {inc.assignedEmployee.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic font-medium">Unassigned (Pool)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          inc.slaStatus === 'BREACHED'
                            ? 'danger'
                            : inc.slaStatus === 'AT_RISK'
                            ? 'warning'
                            : 'success'
                        }
                        dot={inc.slaStatus !== 'MET'}
                      >
                        {inc.slaStatus === 'MET'
                          ? 'SLA Met'
                          : inc.slaStatus === 'BREACHED'
                          ? 'SLA Breached'
                          : inc.remainingMinutes !== null && inc.remainingMinutes !== undefined
                          ? `${inc.remainingMinutes}m remaining`
                          : 'On Track'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 inline group-hover:text-slate-900 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
