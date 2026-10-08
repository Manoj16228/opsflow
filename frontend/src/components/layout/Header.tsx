import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Plus,
  Radio,
  ExternalLink,
  ShieldCheck,
  CheckSquare,
  AlertTriangle,
  Sun,
  Moon,
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function Header({
  onQuickTask,
  onQuickIncident,
  onOpenCommandPalette,
}: {
  onQuickTask?: () => void;
  onQuickIncident?: () => void;
  onOpenCommandPalette?: () => void;
}) {
  const { isConnected } = useSocket();
  const { user } = useAuth();
  const { actualTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-[#0b1120]/75 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs dark:shadow-lg dark:shadow-black/20 transition-colors">
      {/* Global Command Palette Trigger Bar */}
      <div
        onClick={onOpenCommandPalette}
        className="flex items-center gap-2.5 w-64 sm:w-80 md:w-96 px-3.5 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/90 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-brand-500/40 hover:bg-slate-50 dark:hover:bg-slate-900/90 cursor-pointer transition-all group shadow-inner"
      >
        <Search className="w-4 h-4 text-brand-500 shrink-0 group-hover:scale-105 transition-transform" />
        <span className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 flex-1 truncate font-medium">
          Search tasks, incidents, telemetry...
        </span>
        <div className="flex items-center gap-1">
          <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-200/80 dark:bg-slate-850 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700/80 shadow-xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Action Center & Indicators */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Quick Action Buttons */}
        <div className="hidden sm:flex items-center gap-2">
          {onQuickTask && (
            <Button
              onClick={onQuickTask}
              size="sm"
              variant="outline"
              icon={<CheckSquare className="w-3.5 h-3.5 text-brand-500" />}
              className="border-slate-300 dark:border-slate-800 hover:border-brand-500/40 bg-white/90 dark:bg-slate-900/80 text-xs text-slate-700 dark:text-slate-200"
            >
              New Task
            </Button>
          )}
          {onQuickIncident && (
            <Button
              onClick={onQuickIncident}
              size="sm"
              variant="danger"
              icon={<AlertTriangle className="w-3.5 h-3.5" />}
              className="text-xs shadow-glow-rose"
            >
              Report Incident
            </Button>
          )}
        </div>

        {/* Light / Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          title={actualTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-transparent dark:hover:border-slate-800 transition-all"
        >
          {actualTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-brand-600 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Swagger Docs Link */}
        <a
          href="/api-docs"
          target="_blank"
          rel="noreferrer"
          title="Open Swagger REST API Specs"
          className="hidden md:flex p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all items-center gap-1.5 text-xs"
        >
          <ExternalLink className="w-4 h-4 text-brand-500" />
          <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">API Docs</span>
        </a>

        {/* Notifications Bell */}
        <button
          onClick={() => navigate('/notifications')}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-transparent dark:hover:border-slate-800 transition-all relative"
          title="View Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white dark:ring-slate-900 shadow-glow-sm" />
        </button>
      </div>
    </header>
  );
}
