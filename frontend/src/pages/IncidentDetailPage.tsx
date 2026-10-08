import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  Send,
  CheckCircle2,
  Building,
  User,
  ShieldAlert,
  Flame,
  FileText,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Skeleton, ErrorState } from '../components/ui/EmptyState';
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  getPriorityBadgeColor,
  getStatusBadgeColor,
} from '../lib/utils';
import { Incident, IncidentStatus } from '../types';
import { PostmortemModal } from '../components/modals/PostmortemModal';
import { IncidentWarRoomModal } from '../components/incidents/IncidentWarRoomModal';

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinIncidentRoom, leaveIncidentRoom, socket } = useSocket();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [postmortemData, setPostmortemData] = useState<any>(null);
  const [isPostmortemOpen, setIsPostmortemOpen] = useState(false);
  const [isGeneratingPostmortem, setIsGeneratingPostmortem] = useState(false);
  const [isWarRoomOpen, setIsWarRoomOpen] = useState(false);

  useEffect(() => {
    if (id) {
      joinIncidentRoom(id);
      return () => leaveIncidentRoom(id);
    }
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;

    const handleIncidentUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
    };

    socket.on('incident:updated', handleIncidentUpdated);
    socket.on('incident:status_changed', handleIncidentUpdated);
    socket.on('incident:comment_added', handleIncidentUpdated);

    return () => {
      socket.off('incident:updated', handleIncidentUpdated);
      socket.off('incident:status_changed', handleIncidentUpdated);
      socket.off('incident:comment_added', handleIncidentUpdated);
    };
  }, [socket, id, queryClient]);

  const {
    data: incident,
    isLoading,
    error,
    refetch,
  } = useQuery<Incident>({
    queryKey: ['incident', id],
    queryFn: async () => (await api.get(`/incidents/${id}`)).data.data,
    enabled: !!id,
  });

  if (error) {
    return <ErrorState title="Incident not found" onRetry={() => refetch()} />;
  }

  if (isLoading || !incident) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const handleStatusChange = async (newStatus: IncidentStatus) => {
    if (newStatus === 'RESOLVED') {
      setIsResolveModalOpen(true);
      return;
    }

    try {
      await api.patch(`/incidents/${id}/status`, { status: newStatus });
      showToast('Incident status updated', 'success');
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to update status', 'error');
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResolving(true);
    try {
      await api.patch(`/incidents/${id}/status`, {
        status: 'RESOLVED',
        resolutionNotes,
      });
      showToast('Incident resolved successfully', 'success');
      setIsResolveModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Resolution failed', 'error');
    } finally {
      setIsResolving(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await api.post(`/incidents/${id}/comments`, { content: commentText.trim() });
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to post comment', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/incidents')}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                {incident.incidentCode}
              </span>
              <h1 className="text-xl font-bold text-white">{incident.title}</h1>
            </div>
            <span className="text-xs text-slate-400 mt-0.5 block">
              Reported {formatRelativeTime(incident.createdAt)} by {incident.reportedBy?.firstName}{' '}
              {incident.reportedBy?.lastName}
            </span>
          </div>
        </div>

        {/* Action Controls & Status */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="danger"
            className="flex items-center gap-1.5 shadow-glow-rose"
            onClick={() => setIsWarRoomOpen(true)}
          >
            <Flame className="w-3.5 h-3.5 animate-pulse" />
            <span>Enter Live War Room</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1.5 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
            onClick={async () => {
              setIsGeneratingPostmortem(true);
              try {
                const res = await api.post('/copilot/incident-rca', { incidentId: id });
                setPostmortemData(res.data.data);
                setIsPostmortemOpen(true);
              } catch (err: any) {
                showToast('Failed to generate SRE postmortem', 'error');
              } finally {
                setIsGeneratingPostmortem(false);
              }
            }}
            isLoading={isGeneratingPostmortem}
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span>SRE Postmortem (RCA)</span>
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <div className="w-40">
              <Select
                value={incident.status}
                onChange={(e) => handleStatusChange(e.target.value as IncidentStatus)}
                options={[
                  { label: 'Open', value: 'OPEN' },
                  { label: 'Assigned', value: 'ASSIGNED' },
                  { label: 'Investigating', value: 'INVESTIGATING' },
                  { label: 'Resolved', value: 'RESOLVED' },
                  { label: 'Closed', value: 'CLOSED' },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Triage Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Telemetry */}
          <Card>
            <CardHeader>
              <CardTitle>Telemetry & Incident Scope</CardTitle>
              <span
                className={`text-xs px-2 py-0.5 rounded font-semibold border ${getPriorityBadgeColor(
                  incident.severity
                )}`}
              >
                {incident.severity} Severity
              </span>
            </CardHeader>
            <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
              {incident.description}
            </div>

            {incident.resolutionNotes && (
              <div className="mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs">
                <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Resolution Summary
                </div>
                <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {incident.resolutionNotes}
                </div>
              </div>
            )}
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Triage & Investigation Timeline</CardTitle>
              <Badge variant="default" className="text-xs font-mono">
                {incident.histories?.length || 0} Logs
              </Badge>
            </CardHeader>
            <div className="space-y-4">
              {incident.histories && incident.histories.length > 0 ? (
                incident.histories.map((hist) => (
                  <div key={hist.id} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="text-slate-300">
                        <span className="font-semibold text-slate-200">
                          {hist.user?.firstName || 'System'}
                        </span>{' '}
                        {hist.action.replace('_', ' ').toLowerCase()}{' '}
                        {hist.newValue && (
                          <span className="text-rose-400 font-mono">({hist.newValue})</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatDateTime(hist.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic">No timeline entries yet.</div>
              )}
            </div>
          </Card>

          {/* Comments & War Room Chat */}
          <Card>
            <CardHeader>
              <CardTitle>War Room Live Discussion</CardTitle>
              <Badge variant="danger" dot className="text-xs">
                Triage Room
              </Badge>
            </CardHeader>

            <div className="space-y-4 mb-6">
              {incident.comments && incident.comments.length > 0 ? (
                incident.comments.map((comment) => (
                  <div key={comment.id} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-rose-400">
                          {comment.user.firstName[0]}
                        </div>
                        <span className="text-xs font-semibold text-slate-200">
                          {comment.user.firstName} {comment.user.lastName}
                        </span>
                        <Badge variant="default" className="text-[10px] py-0">
                          {comment.user.role}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap pl-8">
                      {comment.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic text-center py-4">
                  No triage notes logged yet.
                </div>
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Log diagnostic findings, mitigation steps, or status updates..."
                className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <Button type="submit" size="sm" variant="danger" isLoading={isSubmittingComment} icon={<Send className="w-3.5 h-3.5" />}>
                Send
              </Button>
            </form>
          </Card>
        </div>

        {/* Sidebar Column (SLA & Response Details) */}
        <div className="space-y-6">
          {/* SLA Clock */}
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle>SLA Target Clock</CardTitle>
              <Clock className="w-4 h-4 text-rose-400" />
            </CardHeader>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">SLA Target Duration:</span>
                <span className="font-mono font-semibold text-slate-200">{incident.slaHours} Hours</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">SLA Deadline:</span>
                <span className="font-mono text-slate-200">{formatDateTime(incident.slaDeadline)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SLA Status:</span>
                <Badge
                  variant={
                    incident.slaStatus === 'BREACHED'
                      ? 'danger'
                      : incident.slaStatus === 'AT_RISK'
                      ? 'warning'
                      : 'success'
                  }
                >
                  {incident.slaStatus === 'MET'
                    ? 'SLA Met'
                    : incident.slaStatus === 'BREACHED'
                    ? 'SLA Breached'
                    : incident.remainingMinutes !== null && incident.remainingMinutes !== undefined
                    ? `${incident.remainingMinutes}m remaining`
                    : 'On Track'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Responding Team */}
          <Card>
            <CardHeader>
              <CardTitle>Responding Team</CardTitle>
              <User className="w-4 h-4 text-purple-400" />
            </CardHeader>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">On-Call Engineer</span>
                {incident.assignedEmployee ? (
                  <div
                    className="flex items-center gap-2.5 p-2 bg-slate-950/60 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700"
                    onClick={() => navigate(`/employees/${incident.assignedEmployee?.id}`)}
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-rose-400">
                      {incident.assignedEmployee.firstName[0]}
                    </div>
                    <div>
                      <div className="font-medium text-slate-200">
                        {incident.assignedEmployee.firstName} {incident.assignedEmployee.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400">{incident.assignedEmployee.designation}</div>
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Unassigned (Triage Pool)</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Department</span>
                <div className="font-medium text-slate-200 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {incident.department?.name || 'Operations'}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Resolve Incident Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Resolve Operational Incident"
        description="Provide resolution notes and root-cause findings before closing the incident."
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-slate-300">Resolution Summary *</label>
            <textarea
              required
              rows={4}
              placeholder="Detail root cause, remediation steps applied, and preventative measures..."
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isResolving}>
              Mark as Resolved
            </Button>
          </div>
        </form>
      </Modal>

      {/* SRE Incident Postmortem Modal */}
      {postmortemData && (
        <PostmortemModal
          isOpen={isPostmortemOpen}
          onClose={() => setIsPostmortemOpen(false)}
          data={postmortemData}
        />
      )}

      {/* Live Incident War Room Modal */}
      <IncidentWarRoomModal
        isOpen={isWarRoomOpen}
        onClose={() => setIsWarRoomOpen(false)}
        incident={incident}
      />
    </div>
  );
}
