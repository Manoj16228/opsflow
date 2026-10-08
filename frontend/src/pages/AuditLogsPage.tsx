import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Search, Filter, Eye, Clock, User, Globe, Code } from 'lucide-react';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { EmptyState, Skeleton, ErrorState } from '../components/ui/EmptyState';
import { formatDateTime } from '../lib/utils';
import { AuditLogItem } from '../types';

export function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [page, setPage] = useState(1);

  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const {
    data: auditResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['audit-logs', search, action, entity, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (action) params.append('action', action);
      if (entity) params.append('entity', entity);
      params.append('page', String(page));
      params.append('limit', '30');

      return (await api.get(`/audit-logs?${params.toString()}`)).data;
    },
  });

  const logs: AuditLogItem[] = auditResponse?.data || [];
  const meta = auditResponse?.meta || { totalCount: 0, totalPages: 1 };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" /> Immutable Compliance Audit Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise security trail logging authenticated actions, role changes, and state mutations.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, actor email, or entity ID..."
            className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          options={[
            { label: 'All Actions', value: '' },
            { label: 'USER_LOGIN', value: 'USER_LOGIN' },
            { label: 'TASK_CREATED', value: 'TASK_CREATED' },
            { label: 'TASK_STATUS_CHANGED', value: 'TASK_STATUS_CHANGED' },
            { label: 'INCIDENT_CREATED', value: 'INCIDENT_CREATED' },
            { label: 'INCIDENT_STATUS_CHANGED', value: 'INCIDENT_STATUS_CHANGED' },
            { label: 'EMPLOYEE_CREATED', value: 'EMPLOYEE_CREATED' },
            { label: 'USER_ROLE_CHANGED', value: 'USER_ROLE_CHANGED' },
          ]}
        />

        <Select
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          options={[
            { label: 'All Entities', value: '' },
            { label: 'Task', value: 'Task' },
            { label: 'Incident', value: 'Incident' },
            { label: 'Employee', value: 'Employee' },
            { label: 'User', value: 'User' },
            { label: 'Organization', value: 'Organization' },
          ]}
        />
      </div>

      {/* Content Table */}
      {error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No audit entries found"
          description="No records match the current filter criteria."
        />
      ) : (
        <Card className="p-0 overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-brand-400">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-200">{log.entity}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {log.entityId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{log.user?.firstName ? `${log.user.firstName} ${log.user.lastName}` : log.userEmail || 'System'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.userEmail || 'system@opsflow.io'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Inspect Changes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* JSON Inspection Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Event Inspection"
        description="Immutable snapshot of state mutation and client telemetry."
      >
        {selectedLog && (
          <div className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 block">Action</span>
                <span className="text-brand-400 font-bold">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Entity</span>
                <span className="text-slate-200 font-bold">
                  {selectedLog.entity} ({selectedLog.entityId})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Actor Email</span>
                <span className="text-slate-200">{selectedLog.userEmail || 'system'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Recorded At</span>
                <span className="text-slate-200">{formatDateTime(selectedLog.createdAt)}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block mb-1">State Mutation Diff</span>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 max-h-60 overflow-y-auto leading-relaxed">
                {JSON.stringify(
                  {
                    oldValues: selectedLog.oldValues || null,
                    newValues: selectedLog.newValues || null,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
