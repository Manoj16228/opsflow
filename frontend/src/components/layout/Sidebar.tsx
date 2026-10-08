import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  AlertCircle,
  Users,
  Building2,
  BarChart3,
  Bell,
  ShieldCheck,
  Settings,
  LogOut,
  Layers,
  ChevronRight,
  ShieldAlert,
  Workflow,
  Sparkles,
  Zap,
  Flame,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function Sidebar({
  onOpenCommandPalette,
  onOpenCopilot,
  onOpenShortcuts,
}: {
  onOpenCommandPalette?: () => void;
  onOpenCopilot?: () => void;
  onOpenShortcuts?: () => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Load quick count badges
  const { data: overview } = useQuery({
    queryKey: ['analytics-overview-sidebar'],
    queryFn: async () => (await api.get('/analytics/overview')).data.data,
    refetchInterval: 30000,
  });

  const kpi = overview?.kpi || {
    totalTasks: 60,
    openIncidents: 3,
  };

  const navSections = [
    {
      title: 'Operations & SRE',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, shortcut: 'GD' },
        { name: 'Tasks', href: '/tasks', icon: CheckSquare, badge: kpi.totalTasks > 0 ? `${kpi.totalTasks}` : undefined, badgeColor: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300', shortcut: 'GT' },
        { name: 'Incidents', href: '/incidents', icon: Flame, badge: kpi.openIncidents > 0 ? `${kpi.openIncidents} P1` : undefined, badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 animate-pulse', shortcut: 'GI' },
        { name: 'Automations', href: '/automations', icon: Workflow, shortcut: 'GW' },
      ],
    },
    {
      title: 'Workforce & Insights',
      items: [
        { name: 'Workforce', href: '/employees', icon: Users, shortcut: 'GE' },
        { name: 'Departments', href: '/departments', icon: Building2 },
        { name: 'Analytics', href: '/analytics', icon: BarChart3, shortcut: 'GA' },
        { name: 'Notifications', href: '/notifications', icon: Bell },
      ],
    },
    ...(user?.role === 'ADMIN'
      ? [
          {
            title: 'Governance & IAM',
            items: [
              { name: 'Audit Logs', href: '/audit-logs', icon: ShieldCheck },
              { name: 'User Access', href: '/admin/users', icon: ShieldAlert },
              { name: 'System Settings', href: '/settings', icon: Settings, shortcut: 'GS' },
            ],
          },
        ]
      : [
          {
            title: 'Configuration',
            items: [
              { name: 'System Settings', href: '/settings', icon: Settings, shortcut: 'GS' },
            ],
          },
        ]),
  ];

  return (
    <aside className="w-68 min-w-[17rem] bg-white/95 dark:bg-[#080d19]/95 border-r border-slate-200/90 dark:border-white/[0.07] backdrop-blur-2xl flex flex-col shrink-0 select-none h-screen sticky top-0 z-40 transition-colors shadow-xs">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4.5 border-b border-slate-100 dark:border-white/[0.06] justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-brand-600 via-sky-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-glow-sm relative group cursor-pointer" onClick={() => navigate('/dashboard')}>
            <Layers className="w-4.5 h-4.5 group-hover:scale-105 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-950" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">
                OPS<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-sky-400">FLOW</span>
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                v2.4
              </span>
            </div>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              Operations Management
            </span>
          </div>
        </div>

        {/* Global Quick Action Icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenShortcuts}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            title="Keyboard Shortcuts (?)"
          >
            <span className="font-mono text-xs font-bold">?</span>
          </button>
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 hover:border-brand-500/50 hover:text-brand-600 transition-all shadow-2xs"
            title="Spotlight Search (⌘K)"
          >
            <span>⌘K</span>
          </button>
        </div>
      </div>

      {/* Tenant Context Pill */}
      <div className="px-3 py-2.5 border-b border-slate-100 dark:border-white/[0.05] bg-slate-50/50 dark:bg-slate-950/30">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-2xs group hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer" onClick={() => navigate('/settings')}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
              {(user?.organizationName || 'N')[0]}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors">
                {user?.organizationName || user?.organization?.name || 'Nexus Cloud Technologies'}
              </div>
              <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">Production Cloud</span>
              </div>
            </div>
          </div>
          <Badge variant="purple" className="text-[9px] py-0 px-1 font-mono shrink-0">
            {user?.role || 'MEMBER'}
          </Badge>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2.5 mb-1.5">
              {section.title}
            </div>

            {section.items.map((item: any) => {
              const isActive = location.pathname === item.href || (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-xl transition-all group relative',
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-600/15 text-brand-700 dark:text-brand-300 font-semibold shadow-2xs border border-brand-200/80 dark:border-brand-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-850/60'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        isActive
                          ? 'text-brand-600 dark:text-brand-400'
                          : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                      )}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.badge && (
                      <span className={cn('text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md', item.badgeColor)}>
                        {item.badge}
                      </span>
                    )}
                    {item.shortcut && (
                      <span className="font-mono text-[9px] text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                        {item.shortcut}
                      </span>
                    )}
                  </div>
                </NavLink>
              );
            })}
          </div>
        ))}

        {/* Sleek AI Copilot Feature Banner Card */}
        <div className="pt-2">
          <div
            onClick={onOpenCopilot}
            className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/10 via-brand-500/10 to-sky-500/10 border border-purple-200/80 dark:border-purple-500/20 hover:border-purple-400 dark:hover:border-purple-500/40 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">AI SRE Copilot</span>
              </div>
              <kbd className="font-mono text-[9px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-1.5 py-0.5 rounded shadow-2xs">
                A
              </kbd>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight">
              Root cause analysis, smart triage & workload estimates.
            </p>
          </div>
        </div>
      </nav>

      {/* User Account / Profile Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/70 dark:bg-slate-950/50">
        <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-900/90 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all shadow-2xs">
          <div className="relative">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.firstName}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-300 dark:ring-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-sky-500 to-purple-600 text-white flex items-center justify-center text-xs font-extrabold shadow-xs">
                {user?.firstName?.[0] || 'U'}
                {user?.lastName?.[0] || ''}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950" />
          </div>

          <div
            className="flex-1 min-w-0 cursor-pointer text-left"
            onClick={() => navigate('/profile')}
          >
            <div className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</div>
          </div>

          <button
            onClick={() => logout()}
            title="Sign out of OpsFlow"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
