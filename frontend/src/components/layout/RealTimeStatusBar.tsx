import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  Zap,
  Activity,
  Flame,
  CheckSquare,
  TrendingUp,
  RefreshCw,
  Pause,
  Play,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  ShieldAlert,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useSocket, RealTimeEvent } from '../../context/SocketContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

export function RealTimeStatusBar() {
  const { isConnected, latencyMs, lastEvent, eventHistory, isStreamingPaused, toggleStreaming, reconnect } = useSocket();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  // Load live quick counts
  const { data: overview } = useQuery({
    queryKey: ['analytics-overview-bar'],
    queryFn: async () => (await api.get('/analytics/overview')).data.data,
    refetchInterval: 15000,
  });

  const kpi = overview?.kpi || {
    totalTasks: 60,
    openIncidents: 3,
    criticalIncidents: 1,
    slaComplianceRate: 98.4,
  };

  return (
    <div className="w-full bg-slate-50/95 dark:bg-[#090e1a]/95 border-b border-slate-200 dark:border-white/[0.08] backdrop-blur-md px-4 sm:px-6 py-2.5 text-xs transition-colors select-none z-20 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Left: Stream Status & Live Latency Radar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 text-[11px] font-bold shadow-xs">
            <span className="relative flex h-2 w-2">
              {isConnected && !isStreamingPaused && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={cn(
                  'relative inline-flex rounded-full h-2 w-2',
                  !isConnected
                    ? 'bg-amber-500'
                    : isStreamingPaused
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                )}
              />
            </span>
            <span className="font-mono text-slate-800 dark:text-slate-200 tracking-tight">
              {!isConnected
                ? 'RECONNECTING...'
                : isStreamingPaused
                ? 'STREAM PAUSED'
                : 'REAL-TIME SYNC'}
            </span>
          </div>

          {/* Latency Ping Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-700 dark:text-slate-300 font-semibold shadow-xs">
            <Zap className="w-3 h-3 text-brand-500" />
            <span>{latencyMs}ms ping</span>
          </div>

          {/* Event Ticker Pill */}
          {lastEvent && (
            <div
              onClick={() => setIsDrawerOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white dark:bg-brand-950/40 border border-brand-200 dark:border-brand-500/30 text-slate-900 dark:text-brand-200 cursor-pointer hover:border-brand-400 hover:shadow-xs transition-all truncate max-w-xs sm:max-w-md md:max-w-lg group"
              title="Click to expand event stream log"
            >
              <Activity className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0 animate-pulse" />
              <span className="font-mono text-[10px] font-bold uppercase shrink-0 text-brand-700 dark:text-brand-400">
                [{lastEvent.timestamp}]
              </span>
              <span className="truncate text-[11px] font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-300">
                {lastEvent.title}: {lastEvent.message}
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick Metrics Strip & Stream Controls */}
        <div className="flex items-center gap-3 justify-between lg:justify-end flex-wrap">
          {/* Metrics summary */}
          <div className="flex items-center gap-3 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
            <div
              className="flex items-center gap-1.5 cursor-pointer hover:text-brand-600 transition-colors bg-white dark:bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs"
              onClick={() => navigate('/tasks')}
              title="View all tasks"
            >
              <CheckSquare className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>{kpi.totalTasks} Tasks</span>
            </div>

            <div
              className="flex items-center gap-1.5 cursor-pointer hover:text-rose-600 transition-colors bg-white dark:bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs"
              onClick={() => navigate('/incidents')}
              title="View all incidents"
            >
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>{kpi.openIncidents} Incidents {kpi.criticalIncidents > 0 && `(${kpi.criticalIncidents} P1)`}</span>
            </div>

            <div
              className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-600 transition-colors bg-white dark:bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs"
              onClick={() => navigate('/dashboard')}
              title="View executive telemetry"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-400">{kpi.slaComplianceRate}% SLA</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Pause / Play Stream */}
            <button
              onClick={toggleStreaming}
              title={isStreamingPaused ? 'Resume Real-Time Stream' : 'Pause Real-Time Stream'}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors shadow-xs"
            >
              {isStreamingPaused ? <Play className="w-3.5 h-3.5 text-amber-500" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            {/* Reconnect Socket */}
            <button
              onClick={reconnect}
              title="Force Telemetry Reconnect"
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* View Live Log Drawer Toggle */}
            <button
              onClick={() => setIsDrawerOpen((prev) => !prev)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-slate-700 text-brand-800 dark:text-slate-200 hover:bg-brand-100 dark:hover:bg-slate-700 text-[10px] font-bold transition-all shadow-xs"
            >
              <span>Event Stream ({eventHistory.length})</span>
              {isDrawerOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Live Event Log Drawer */}
      {isDrawerOpen && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 max-h-64 overflow-y-auto space-y-1.5 animate-in slide-in-from-top-2 duration-150 text-left">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider pb-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              Live Telemetry Event Buffer (Past 20 Socket Updates)
            </span>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {eventHistory.map((evt) => (
              <div
                key={evt.id}
                onClick={() => {
                  if (evt.link) {
                    navigate(evt.link);
                    setIsDrawerOpen(false);
                  }
                }}
                className={cn(
                  'flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors',
                  evt.link ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60' : '',
                  evt.type === 'INCIDENT'
                    ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-900 dark:text-rose-200'
                    : evt.type === 'TASK'
                    ? 'bg-sky-50 dark:bg-brand-500/10 border border-sky-200 dark:border-brand-500/20 text-sky-900 dark:text-brand-200'
                    : 'bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-300'
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 shrink-0 font-bold">
                    {evt.timestamp}
                  </span>
                  <span
                    className={cn(
                      'text-[9px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0',
                      evt.type === 'INCIDENT'
                        ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                        : evt.type === 'TASK'
                        ? 'bg-sky-100 dark:bg-brand-500/20 text-sky-700 dark:text-brand-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    {evt.badge || evt.type}
                  </span>
                  <span className="font-bold truncate text-slate-900 dark:text-white">{evt.title}</span>
                  <span className="text-slate-600 dark:text-slate-400 truncate hidden sm:inline">
                    — {evt.message}
                  </span>
                </div>

                {evt.link && (
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
