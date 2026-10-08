import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  Sparkles,
  X,
  Zap,
  Flame,
  CheckSquare,
  ArrowRight,
  ShieldCheck,
  FileText,
  Clock,
  Layers,
  Bot,
  PlusCircle,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PostmortemModal } from '../modals/PostmortemModal';
import { playChime } from '../../lib/audioAlerts';
import { useToast } from '../../context/ToastContext';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AICopilotDrawer({ isOpen, onClose }: AICopilotDrawerProps) {
  const [activeTab, setActiveTab] = useState<'triage' | 'breakdown' | 'rca'>('triage');
  const [inputText, setInputText] = useState('');
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [postmortemData, setPostmortemData] = useState<any>(null);
  const [isPostmortemModalOpen, setIsPostmortemModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Fetch recent incidents for RCA dropdown
  const { data: incidentResponse } = useQuery({
    queryKey: ['copilot-incidents'],
    queryFn: async () => (await api.get('/incidents?limit=10')).data,
    enabled: isOpen,
  });

  const incidents = incidentResponse?.data || [];

  // Auto-select first incident for convenience
  useEffect(() => {
    if (incidents.length > 0 && !selectedIncidentId) {
      setSelectedIncidentId(incidents[0].id);
    }
  }, [incidents, selectedIncidentId]);

  // 1. Smart Triage Mutation
  const triageMutation = useMutation({
    mutationFn: async (textOverride?: string) => {
      const textToAnalyze = typeof textOverride === 'string' ? textOverride : inputText;
      return (await api.post('/copilot/smart-triage', { title: textToAnalyze })).data.data;
    },
    onSuccess: () => {
      playChime('success');
    },
  });

  // 2. Task Breakdown Mutation
  const breakdownMutation = useMutation({
    mutationFn: async (textOverride?: string) => {
      const textToAnalyze = typeof textOverride === 'string' ? textOverride : inputText;
      return (await api.post('/copilot/task-breakdown', { title: textToAnalyze })).data.data;
    },
    onSuccess: () => {
      playChime('success');
    },
  });

  // 3. Postmortem Mutation
  const postmortemMutation = useMutation({
    mutationFn: async () => {
      return (await api.post('/copilot/incident-rca', { incidentId: selectedIncidentId })).data.data;
    },
    onSuccess: (data) => {
      setPostmortemData(data);
      setIsPostmortemModalOpen(true);
      playChime('success');
    },
  });

  // 4. Quick Dispatch Task from Triage Recommendation
  const dispatchTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      return (
        await api.post('/tasks', {
          title: inputText,
          description: `Triaged via OpsFlow AI Copilot: ${data.rationale}`,
          priority: data.suggestedPriority,
          departmentId: data.suggestedDepartmentId,
          assignedToId: data.suggestedAssigneeId,
          estimatedHours: 6,
        })
      ).data;
    },
    onSuccess: (res) => {
      showToast('Task dispatched with AI triage parameters', 'success', res.data.taskCode);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      playChime('success');
      onClose();
    },
  });

  const handleTriagePreset = (prompt: string) => {
    setInputText(prompt);
    triageMutation.mutate(prompt);
  };

  const handleBreakdownPreset = (prompt: string) => {
    setInputText(prompt);
    breakdownMutation.mutate(prompt);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in duration-200">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />

        <div className="relative w-full max-w-lg bg-white dark:bg-[#0a0f1d] border-l border-slate-200 dark:border-white/[0.08] shadow-2xl h-full flex flex-col z-50 text-left">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-purple-600 via-brand-500 to-sky-400 flex items-center justify-center text-white shadow-glow-sm">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  OpsFlow AI Copilot <Badge variant="purple" className="text-[9px] py-0 px-1 font-mono">LOCAL SRE</Badge>
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Heuristic incident root cause analysis & workload intelligence
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex px-4 pt-3 border-b border-slate-200 dark:border-slate-800 gap-1 bg-slate-50/30 dark:bg-slate-950/20">
            {[
              { id: 'triage', label: 'Smart Triage', icon: Zap },
              { id: 'breakdown', label: 'Task Breakdown', icon: Layers },
              { id: 'rca', label: 'Incident RCA & Postmortem', icon: Flame },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === t.id
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeTab === 'triage' && (
              <div className="space-y-4">
                <div className="bg-sky-50 dark:bg-brand-950/20 border border-sky-200 dark:border-brand-500/20 p-3.5 rounded-xl text-xs text-sky-900 dark:text-brand-200 leading-relaxed font-medium">
                  💡 Type any task title or technical description. The local heuristic model evaluates domain keywords and live workforce queues to suggest optimal assignees and priority.
                </div>

                {/* Sample Prompt Chips */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Try quick examples (click to test):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Optimize Redis caching layer for slow multi-tenant queries',
                      'Security audit for OAuth JWT token refresh endpoint',
                      'Investigate 504 Gateway Timeouts on API router',
                      'Build real-time SLA telemetry dashboard for executives',
                    ].map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleTriagePreset(prompt)}
                        className="text-[11px] text-left px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-850 hover:bg-brand-50 dark:hover:bg-brand-950/40 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-300 border border-slate-200 dark:border-slate-800 transition-all"
                      >
                        ⚡ {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Operational Task Scope</label>
                  <textarea
                    rows={3}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="e.g. Optimize Redis caching layer for slow multi-tenant queries"
                    className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => triageMutation.mutate(inputText)}
                    isLoading={triageMutation.isPending}
                    disabled={!inputText.trim()}
                  >
                    Run Smart Triage Assessment
                  </Button>
                </div>

                {triageMutation.data && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Recommended Routing</span>
                      <Badge variant="success">{triageMutation.data.confidenceScore} Match</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Priority</span>
                        <span className="font-extrabold text-brand-600 dark:text-brand-400">{triageMutation.data.suggestedPriority}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Department</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{triageMutation.data.suggestedDepartmentName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Optimal Assignee</span>
                        <span className="font-extrabold text-purple-600 dark:text-purple-400">{triageMutation.data.suggestedAssigneeName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Current Queue</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{triageMutation.data.currentAssigneeWorkload} active tasks</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      {triageMutation.data.rationale}
                    </p>

                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full flex items-center justify-center gap-1.5"
                      onClick={() => dispatchTaskMutation.mutate(triageMutation.data)}
                      isLoading={dispatchTaskMutation.isPending}
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Dispatch Task with These Parameters
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'breakdown' && (
              <div className="space-y-4">
                <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/20 p-3.5 rounded-xl text-xs text-purple-900 dark:text-purple-200 leading-relaxed font-medium">
                  ⚡ Decompose complex engineering deliverables into subtasks with estimated hours and development milestones.
                </div>

                {/* Sample Prompt Chips */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Try quick examples (click to test):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Implement Single Sign-On (SSO) SAML 2.0 Identity Provider',
                      'Database Sharding & Automated Read Replicas Migration',
                      'Zero-Trust API Gateway with Multi-Tenant Rate Limiting',
                    ].map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleBreakdownPreset(prompt)}
                        className="text-[11px] text-left px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-850 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-800 transition-all"
                      >
                        🚀 {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Engineering Epic / Deliverable</label>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="e.g. Implement Single Sign-On (SSO) SAML 2.0 Identity Provider"
                    className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => breakdownMutation.mutate(inputText)}
                    isLoading={breakdownMutation.isPending}
                    disabled={!inputText.trim()}
                  >
                    Generate Milestone Breakdown
                  </Button>
                </div>

                {breakdownMutation.data && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Estimated Timeline</span>
                      <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        {breakdownMutation.data.recommendedTotalHours}h ({breakdownMutation.data.estimatedDeliveryDays} days)
                      </span>
                    </div>

                    <div className="space-y-2">
                      {breakdownMutation.data.subtasks.map((st: any, idx: number) => (
                        <div key={idx} className="p-2.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs gap-2">
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{st.title}</span>
                          <span className="font-mono text-[11px] font-bold text-brand-600 dark:text-brand-400 shrink-0">{st.estimatedHours}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rca' && (
              <div className="space-y-4">
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 p-3.5 rounded-xl text-xs text-rose-900 dark:text-rose-200 leading-relaxed font-medium">
                  📄 SRE Postmortem Generator: Reconstructs incident timelines, executes 5-Whys root cause analysis, and compiles an executive sign-off report.
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Active Incident Outage</label>
                  <select
                    value={selectedIncidentId}
                    onChange={(e) => setSelectedIncidentId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    {incidents.map((i: any) => (
                      <option key={i.id} value={i.id}>
                        [{i.severity}] {i.title} ({i.status})
                      </option>
                    ))}
                  </select>

                  <Button
                    size="sm"
                    variant="danger"
                    className="w-full mt-2 flex items-center justify-center gap-1.5"
                    onClick={() => postmortemMutation.mutate()}
                    isLoading={postmortemMutation.isPending}
                    disabled={!selectedIncidentId}
                  >
                    <FileText className="w-3.5 h-3.5" /> Generate SRE Postmortem Document
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SRE Postmortem Modal */}
      {postmortemData && (
        <PostmortemModal
          isOpen={isPostmortemModalOpen}
          onClose={() => setIsPostmortemModalOpen(false)}
          data={postmortemData}
        />
      )}
    </>
  );
}
