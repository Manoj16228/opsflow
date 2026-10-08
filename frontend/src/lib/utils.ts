import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isPast } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | null, formatStr = 'MMM dd, yyyy'): string {
  if (!dateString) return '—';
  try {
    return format(new Date(dateString), formatStr);
  } catch {
    return '—';
  }
}

export function formatDateTime(dateString?: string | null): string {
  return formatDate(dateString, 'MMM dd, yyyy HH:mm');
}

export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return '—';
  }
}

export function isDateOverdue(dateString?: string | null, isCompleted = false): boolean {
  if (!dateString || isCompleted) return false;
  try {
    return isPast(new Date(dateString));
  } catch {
    return false;
  }
}

export function getPriorityBadgeColor(priority: string): string {
  switch (priority) {
    case 'CRITICAL':
      return 'bg-rose-50 dark:bg-red-500/10 text-rose-700 dark:text-red-400 border-rose-200 dark:border-red-500/30';
    case 'HIGH':
      return 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/30';
    case 'MEDIUM':
      return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
    case 'LOW':
    default:
      return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
  }
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'COMPLETED':
    case 'RESOLVED':
    case 'CLOSED':
      return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
    case 'IN_PROGRESS':
    case 'INVESTIGATING':
      return 'bg-sky-50 dark:bg-brand-500/10 text-sky-700 dark:text-brand-400 border-sky-200 dark:border-brand-500/30';
    case 'IN_REVIEW':
    case 'ASSIGNED':
      return 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30';
    case 'CANCELLED':
      return 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600';
    case 'BACKLOG':
    case 'OPEN':
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }
}
