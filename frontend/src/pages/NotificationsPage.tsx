import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Clock,
  Trash2,
  AlertTriangle,
  CheckSquare,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState, Skeleton, ErrorState } from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';
import { formatRelativeTime } from '../lib/utils';
import { NotificationItem } from '../types';

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const {
    data: notifResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications?limit=50')).data,
  });

  const notifications: NotificationItem[] = notifResponse?.data || [];
  const unreadCount: number = notifResponse?.meta?.unreadCount || 0;

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      showToast('All notifications marked as read', 'success');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await api.patch(`/notifications/${notif.id}/read`);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
    if (notif.linkUrl) {
      navigate(notif.linkUrl);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'INCIDENT_ASSIGNED':
      case 'INCIDENT_SLA_BREACH':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'TASK_ASSIGNED':
      case 'TASK_STATUS_CHANGED':
        return <CheckSquare className="w-4 h-4 text-brand-400" />;
      default:
        return <Info className="w-4 h-4 text-sky-400" />;
    }
  };

  const [isSendingTest, setIsSendingTest] = React.useState(false);
  const [showEmailLogs, setShowEmailLogs] = React.useState(false);
  const [previewEmail, setPreviewEmail] = React.useState<any | null>(null);

  const { data: emailLogsData, refetch: refetchEmailLogs } = useQuery({
    queryKey: ['email-logs'],
    queryFn: async () => (await api.get('/notifications/email-logs?limit=20')).data.data,
    enabled: showEmailLogs,
  });

  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    try {
      const res = await api.post('/notifications/test-email');
      showToast(`Automated test alert sent to ${res.data.data.recipient}!`, 'success');
      if (showEmailLogs) refetchEmailLogs();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to dispatch test email', 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-400" /> Notifications & Automated Alerts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time assignment notices, incident alerts, and automated email dispatch stream.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowEmailLogs(!showEmailLogs)}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            {showEmailLogs ? 'Hide Email Outbox' : 'View Email Outbox'}
          </Button>

          {unreadCount > 0 && (
            <Button onClick={handleMarkAllRead} size="sm" variant="outline" icon={<CheckCheck className="w-4 h-4" />}>
              Mark All as Read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {/* Automated Admin Mail Dispatch Banner */}
      <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-950/20 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 text-sky-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Automated Admin Email Alert System</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE &bull; 100% LOCAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              All tasks added, SRE incidents/alerts, and major security changes automatically dispatch to <strong className="text-sky-300 font-mono">mozework11@gmail.com</strong>.
            </p>
          </div>
        </div>

        <Button
          onClick={handleSendTestEmail}
          isLoading={isSendingTest}
          size="sm"
          className="shrink-0 bg-sky-600 hover:bg-sky-500 text-white text-xs shadow-md shadow-sky-600/20"
        >
          ⚡ Send Test Alert Email
        </Button>
      </div>

      {/* Dispatched Email Logs Drawer/Panel */}
      {showEmailLogs && (
        <Card className="border-sky-500/20 bg-slate-900/80">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Admin Email Outbox History</span>
              <Badge variant="blue" className="font-mono text-[10px]">mozework11@gmail.com</Badge>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {emailLogsData?.logs?.length || 0} recent dispatches
            </span>
          </div>

          <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
            {(!emailLogsData?.logs || emailLogsData.logs.length === 0) ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No outbound emails dispatched yet in this session. Create a task or incident to see automated emails here!
              </div>
            ) : (
              emailLogsData.logs.map((log: any) => (
                <div key={log.id} className="p-3.5 hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                        log.category === 'INCIDENT_ALERT' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        log.category === 'TASK_ALERT' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                        log.category === 'MAJOR_CHANGE' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {log.category}
                      </span>
                      <span className="font-semibold text-slate-200 truncate">{log.subject}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-3">
                      <span>To: {log.to}</span>
                      <span>&bull;</span>
                      <span>{formatRelativeTime(log.createdAt)}</span>
                      <span>&bull;</span>
                      <span className="text-emerald-400">{log.status}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      onClick={() => setPreviewEmail(log)}
                      size="sm"
                      variant="outline"
                      className="text-[11px] py-1 px-2.5 h-auto"
                    >
                      Preview Email
                    </Button>
                    {log.previewPath && (
                      <a
                        href={`http://localhost:5001${log.previewPath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 shrink-0 transition-all"
                      >
                        HTML File &rarr;
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Inline Email Preview Modal */}
      {previewEmail && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="space-y-0.5">
                <div className="text-xs text-slate-400 font-mono">Dispatched to: <strong className="text-sky-400">{previewEmail.to}</strong></div>
                <div className="text-sm font-bold text-white truncate">{previewEmail.subject}</div>
              </div>
              <Button onClick={() => setPreviewEmail(null)} size="sm" variant="outline" className="text-xs">
                Close &times;
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-950">
              <iframe
                title="Email Preview"
                srcDoc={previewEmail.htmlContent}
                className="w-full h-[450px] border border-slate-800 rounded-lg bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      {error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Inbox is clear"
          description="You have no notifications or pending operational alerts."
        />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              onClick={() => handleItemClick(notif)}
              className={`p-4 cursor-pointer hover:border-slate-700 transition-all flex items-start justify-between gap-4 ${
                !notif.isRead ? 'bg-slate-900 border-brand-500/30' : 'bg-slate-950/60 border-slate-800/80'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                  {getNotificationIcon(notif.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-200">{notif.title}</h4>
                    {!notif.isRead && <Badge variant="info" className="text-[10px] py-0">New</Badge>}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                </div>
              </div>

              <span className="text-[11px] text-slate-500 shrink-0">
                {formatRelativeTime(notif.createdAt)}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
