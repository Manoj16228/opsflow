import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckSquare,
  Clock,
  User,
  Calendar,
  Building,
  Send,
  Paperclip,
  History,
  CheckCircle2,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Skeleton, ErrorState } from '../components/ui/EmptyState';
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  getPriorityBadgeColor,
  getStatusBadgeColor,
  isDateOverdue,
} from '../lib/utils';
import { Task, TaskStatus } from '../types';

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinTaskRoom, leaveTaskRoom, socket } = useSocket();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Subscribe to real-time task room
  useEffect(() => {
    if (id) {
      joinTaskRoom(id);
      return () => leaveTaskRoom(id);
    }
  }, [id]);

  // Real-time event listeners for this task
  useEffect(() => {
    if (!socket || !id) return;

    const handleTaskUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
    };

    const handleCommentAdded = () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
    };

    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:status_changed', handleTaskUpdated);
    socket.on('task:comment_added', handleCommentAdded);

    return () => {
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:status_changed', handleTaskUpdated);
      socket.off('task:comment_added', handleCommentAdded);
    };
  }, [socket, id, queryClient]);

  // Fetch task details
  const {
    data: task,
    isLoading,
    error,
    refetch,
  } = useQuery<Task>({
    queryKey: ['task', id],
    queryFn: async () => (await api.get(`/tasks/${id}`)).data.data,
    enabled: !!id,
  });

  // Fetch task attachments
  const { data: attachments = [], refetch: refetchAttachments } = useQuery({
    queryKey: ['task-attachments', id],
    queryFn: async () => (await api.get(`/attachments/entity/TASK/${id}`)).data.data,
    enabled: !!id,
  });

  if (error) {
    return <ErrorState title="Task not found" message="The requested task could not be loaded." onRetry={() => refetch()} />;
  }

  if (isLoading || !task) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      await api.patch(`/tasks/${id}/status`, { status: newStatus });
      showToast('Task status updated', 'success');
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to update status', 'error');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await api.post(`/tasks/${id}/comments`, { content: commentText.trim() });
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['task', id] });
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to add comment', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'TASK');
    formData.append('entityId', id!);

    setIsUploadingFile(true);
    try {
      await api.post('/attachments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('File uploaded successfully', 'success', file.name);
      refetchAttachments();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Upload failed', 'error');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const overdue = isDateOverdue(task.dueDate, task.status === 'COMPLETED');

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tasks')}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-brand-400 font-bold bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                {task.taskCode}
              </span>
              <h1 className="text-xl font-bold text-white">{task.title}</h1>
            </div>
            <span className="text-xs text-slate-400 mt-0.5 block">
              Created {formatRelativeTime(task.createdAt)} by {task.createdBy?.firstName}{' '}
              {task.createdBy?.lastName}
            </span>
          </div>
        </div>

        {/* Status Transition Control */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          <div className="w-44">
            <Select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              options={[
                { label: 'Backlog', value: 'BACKLOG' },
                { label: 'Assigned', value: 'ASSIGNED' },
                { label: 'In Progress', value: 'IN_PROGRESS' },
                { label: 'In Review', value: 'IN_REVIEW' },
                { label: 'Completed', value: 'COMPLETED' },
                { label: 'Cancelled', value: 'CANCELLED' },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details Column (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Operational Overview</CardTitle>
              <span
                className={`text-xs px-2 py-0.5 rounded font-semibold border ${getPriorityBadgeColor(
                  task.priority
                )}`}
              >
                {task.priority} Priority
              </span>
            </CardHeader>
            <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
              {task.description}
            </div>

            {task.tags && task.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Tags:</span>
                <div className="flex flex-wrap gap-1.5">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 font-mono border border-slate-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <Badge variant="default" className="text-xs font-mono">
                {task.histories?.length || 0} Events
              </Badge>
            </CardHeader>
            <div className="space-y-4">
              {task.histories && task.histories.length > 0 ? (
                task.histories.map((hist) => (
                  <div key={hist.id} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="text-slate-300">
                        <span className="font-semibold text-slate-200">
                          {hist.user?.firstName || 'System'}
                        </span>{' '}
                        {hist.action.replace('_', ' ').toLowerCase()}{' '}
                        {hist.newValue && (
                          <span className="text-brand-400 font-mono">({hist.newValue})</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatDateTime(hist.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic">No history records logged yet.</div>
              )}
            </div>
          </Card>

          {/* Comments Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Team Discussion</CardTitle>
              <Badge variant="purple" className="text-xs">
                Real-Time
              </Badge>
            </CardHeader>

            <div className="space-y-4 mb-6">
              {task.comments && task.comments.length > 0 ? (
                task.comments.map((comment) => (
                  <div key={comment.id} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-brand-400">
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
                  No comments yet. Start the conversation below.
                </div>
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type your response or update..."
                className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <Button type="submit" size="sm" isLoading={isSubmittingComment} icon={<Send className="w-3.5 h-3.5" />}>
                Post
              </Button>
            </form>
          </Card>
        </div>

        {/* Sidebar Column (Metadata & SLA) */}
        <div className="space-y-6">
          {/* SLA Card */}
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle>SLA Target & Timeline</CardTitle>
              <Clock className="w-4 h-4 text-brand-400" />
            </CardHeader>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">SLA Standard:</span>
                <span className="font-mono font-semibold text-slate-200">{task.slaHours || 24} Hours</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Target Due Date:</span>
                <span className={`font-mono ${overdue ? 'text-amber-400 font-semibold' : 'text-slate-200'}`}>
                  {formatDate(task.dueDate)}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Estimated Effort:</span>
                <span className="font-mono text-slate-200">{task.estimatedHours || 0} Hours</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Actual Hours Logged:</span>
                <span className="font-mono text-slate-200">{task.actualHours || 0} Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SLA Status:</span>
                <Badge variant={task.isSlaBreached ? 'danger' : 'success'}>
                  {task.isSlaBreached ? 'BREACHED' : 'ON TRACK'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Allocation Details */}
          <Card>
            <CardHeader>
              <CardTitle>Allocation Details</CardTitle>
              <User className="w-4 h-4 text-purple-400" />
            </CardHeader>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Assigned Engineer</span>
                {task.assignedTo ? (
                  <div
                    className="flex items-center gap-2.5 p-2 bg-slate-950/60 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700"
                    onClick={() => navigate(`/employees/${task.assignedTo?.id}`)}
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-brand-400">
                      {task.assignedTo.firstName[0]}
                    </div>
                    <div>
                      <div className="font-medium text-slate-200">
                        {task.assignedTo.firstName} {task.assignedTo.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400">{task.assignedTo.designation}</div>
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Unassigned</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Department</span>
                <div className="font-medium text-slate-200 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {task.department?.name || 'General Operations'}
                </div>
              </div>
            </div>
          </Card>

          {/* Attachments Section */}
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploadingFile}
                />
                <Button size="sm" variant="outline" icon={<Upload className="w-3.5 h-3.5" />} isLoading={isUploadingFile}>
                  Attach
                </Button>
              </label>
            </CardHeader>

            <div className="space-y-2">
              {attachments.length > 0 ? (
                attachments.map((att: any) => (
                  <a
                    key={att.id}
                    href={att.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{att.originalName}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {Math.round(att.fileSize / 1024)} KB
                    </span>
                  </a>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic text-center py-2">
                  No files attached.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
