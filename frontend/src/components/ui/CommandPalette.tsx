import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  CheckSquare,
  AlertCircle,
  Users,
  Building2,
  BarChart3,
  Bell,
  ShieldCheck,
  Settings,
  Plus,
  Flame,
  FileCode,
  ExternalLink,
  Sparkles,
  Command,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'Live Tasks' | 'Live Incidents';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  badge?: string;
  action: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onOpenTaskModal,
  onOpenIncidentModal,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenTaskModal?: () => void;
  onOpenIncidentModal?: () => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch recent tasks & incidents for instant jumping in command palette
  const { data: recentTasks } = useQuery({
    queryKey: ['recent-tasks-palette'],
    queryFn: async () => (await api.get('/tasks?limit=5')).data.data || [],
    enabled: isOpen,
  });

  const { data: recentIncidents } = useQuery({
    queryKey: ['recent-incidents-palette'],
    queryFn: async () => (await api.get('/incidents?limit=5')).data.data || [],
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or state
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Base command list
  const baseItems: CommandItem[] = [
    // Actions
    {
      id: 'action-create-task',
      category: 'Actions',
      title: 'Create New Task',
      subtitle: 'Assign work with SLA deadline and attribution',
      icon: Plus,
      badge: 'Action',
      action: () => {
        onClose();
        if (onOpenTaskModal) onOpenTaskModal();
      },
    },
    {
      id: 'action-report-incident',
      category: 'Actions',
      title: 'Report Operational Incident',
      subtitle: 'Trigger P1-P4 emergency incident response',
      icon: Flame,
      badge: 'P1-P4',
      action: () => {
        onClose();
        if (onOpenIncidentModal) onOpenIncidentModal();
      },
    },
    {
      id: 'action-api-docs',
      category: 'Actions',
      title: 'View REST API Specifications',
      subtitle: 'Interactive Swagger OpenAPI documentation',
      icon: FileCode,
      badge: 'Docs',
      action: () => {
        onClose();
        window.open('/api-docs', '_blank');
      },
    },

    // Navigation
    {
      id: 'nav-dashboard',
      category: 'Navigation',
      title: 'Executive Dashboard',
      subtitle: 'Real-time telemetry, SLA ratings & KPIs',
      icon: LayoutDashboard,
      action: () => {
        onClose();
        navigate('/dashboard');
      },
    },
    {
      id: 'nav-tasks',
      category: 'Navigation',
      title: 'Task Management',
      subtitle: 'Table and Kanban workload board',
      icon: CheckSquare,
      action: () => {
        onClose();
        navigate('/tasks');
      },
    },
    {
      id: 'nav-incidents',
      category: 'Navigation',
      title: 'Incident Command',
      subtitle: 'Triage, SLA timers, and outage logs',
      icon: AlertCircle,
      action: () => {
        onClose();
        navigate('/incidents');
      },
    },
    {
      id: 'nav-employees',
      category: 'Navigation',
      title: 'Employee Directory',
      subtitle: 'Workforce capacity, skills & manager hierarchy',
      icon: Users,
      action: () => {
        onClose();
        navigate('/employees');
      },
    },
    {
      id: 'nav-departments',
      category: 'Navigation',
      title: 'Departments & Teams',
      subtitle: 'Organizational units and active rosters',
      icon: Building2,
      action: () => {
        onClose();
        navigate('/departments');
      },
    },
    {
      id: 'nav-analytics',
      category: 'Navigation',
      title: 'Power BI & Operational Analytics',
      subtitle: 'Star-schema dimensional reports & CSV exports',
      icon: BarChart3,
      action: () => {
        onClose();
        navigate('/analytics');
      },
    },
    {
      id: 'nav-notifications',
      category: 'Navigation',
      title: 'Notifications Center',
      subtitle: 'Real-time system alerts & mentions',
      icon: Bell,
      action: () => {
        onClose();
        navigate('/notifications');
      },
    },
    {
      id: 'nav-audit',
      category: 'Navigation',
      title: 'Audit Logs & Compliance',
      subtitle: 'Immutable record of security and data events',
      icon: ShieldCheck,
      action: () => {
        onClose();
        navigate('/audit-logs');
      },
    },
    {
      id: 'nav-settings',
      category: 'Navigation',
      title: 'Organization Settings',
      subtitle: 'Tenant configuration, SLA policies & API keys',
      icon: Settings,
      action: () => {
        onClose();
        navigate('/settings');
      },
    },
  ];

  // Dynamic live tasks items
  const taskItems: CommandItem[] = (recentTasks || []).map((t: any) => ({
    id: `task-${t.id}`,
    category: 'Live Tasks',
    title: `${t.taskCode}: ${t.title}`,
    subtitle: `Status: ${t.status} • Priority: ${t.priority}`,
    icon: CheckSquare,
    badge: t.priority,
    action: () => {
      onClose();
      navigate(`/tasks/${t.id}`);
    },
  }));

  // Dynamic live incidents items
  const incidentItems: CommandItem[] = (recentIncidents || []).map((inc: any) => ({
    id: `inc-${inc.id}`,
    category: 'Live Incidents',
    title: `${inc.incidentCode}: ${inc.title}`,
    subtitle: `Severity: ${inc.severity} • Status: ${inc.status}`,
    icon: Flame,
    badge: inc.severity,
    action: () => {
      onClose();
      navigate(`/incidents/${inc.id}`);
    },
  }));

  const allItems = [...baseItems, ...taskItems, ...incidentItems];

  const filteredItems = query.trim()
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden z-10 animate-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <Search className="w-5 h-5 text-brand-500 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, task code, incident, or search..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none font-medium"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/40">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Command className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No matching commands or resources found</p>
              <p className="text-xs text-slate-500 mt-1">Try typing "task", "incident", or "dashboard"</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, index) => {
                const isSelected = index === selectedIndex;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors group',
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-600/15 border border-brand-200 dark:border-brand-500/30 text-brand-900 dark:text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                          isSelected
                            ? 'bg-brand-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                          <span className="truncate">{item.title}</span>
                          {item.badge && (
                            <span
                              className={cn(
                                'text-[10px] px-1.5 py-0.2 rounded font-mono font-bold',
                                item.badge === 'CRITICAL' || item.badge === 'P1-P4'
                                  ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                                  : 'bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30'
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.subtitle && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">{item.subtitle}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 shrink-0 ml-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-semibold hidden sm:inline">
                        {item.category}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 mr-1">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 mr-1">↵</kbd> Select
            </span>
          </div>
          <span className="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> OpsFlow Spotlight
          </span>
        </div>
      </div>
    </div>
  );
}
