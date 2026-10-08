import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  Workflow,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Flame,
  Clock,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { playChime } from '../lib/audioAlerts';

export function AutomationsPage() {
  const queryClient = useQueryClient();
  const [selectedRuleLog, setSelectedRuleLog] = useState<any>(null);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['automations'],
    queryFn: async () => (await api.get('/automations')).data.data,
  });

  const toggleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      return (await api.patch(`/automations/${ruleId}/toggle`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });

  const executeMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      return (await api.post(`/automations/${ruleId}/execute`)).data.data;
    },
    onSuccess: (data) => {
      setSelectedRuleLog(data);
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      playChime('success');
    },
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <Workflow className="w-7 h-7 text-brand-500" /> Event-Driven Workflow Automations
            </h1>
            <Badge variant="purple" className="text-xs font-mono">
              RULES ENGINE
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Local event triggers, SLA escalation policies, auto-assignment pipelines, and broadcast telemetry hooks.
          </p>
        </div>
      </div>

      {/* Execution Alert Banner */}
      {selectedRuleLog && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 flex items-start justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                Rule Executed: {selectedRuleLog.name}
              </h4>
              <p className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300 mt-1">
                {selectedRuleLog.logs}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedRuleLog(null)}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Automation Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule: any) => (
          <div
            key={rule.id}
            className={`glass-card rounded-2xl p-5 border relative flex flex-col justify-between transition-all ${
              rule.enabled
                ? 'border-slate-200 dark:border-white/[0.08]'
                : 'border-slate-200/50 dark:border-slate-800/50 opacity-60'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{rule.name}</h3>
                    <span className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      TRIGGER: {rule.trigger}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => toggleMutation.mutate(rule.id)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    rule.enabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      rule.enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                {rule.description}
              </p>

              {/* Logic Flow Pill */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 font-mono text-[10px] space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="font-bold text-slate-700 dark:text-slate-300">IF:</span>
                  <code className="text-purple-600 dark:text-purple-400 truncate">{rule.condition}</code>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="font-bold text-slate-700 dark:text-slate-300">THEN:</span>
                  <code className="text-emerald-600 dark:text-emerald-400 truncate">{rule.action}</code>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500 font-mono font-medium">
                {rule.executionCount} executions
              </span>

              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1.5"
                onClick={() => executeMutation.mutate(rule.id)}
                isLoading={executeMutation.isPending && executeMutation.variables === rule.id}
              >
                <Play className="w-3 h-3 text-emerald-500" /> Test Run
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
