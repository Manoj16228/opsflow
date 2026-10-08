import React from 'react';
import { LucideIcon, Inbox, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/30">
      <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-slate-500 dark:text-slate-400 mb-4 ring-8 ring-slate-200/50 dark:ring-slate-800/30">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed font-medium">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while fetching information from the server.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center border border-rose-200 dark:border-rose-500/20 rounded-3xl bg-rose-50/50 dark:bg-rose-500/5">
      <div className="p-3 bg-rose-100 dark:bg-rose-500/10 rounded-2xl text-rose-600 dark:text-rose-400 mb-4 ring-8 ring-rose-200/40 dark:ring-rose-500/5">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-rose-800 dark:text-rose-300 mb-1">{title}</h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mb-6 leading-relaxed font-medium">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          Try Again
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-slate-200 dark:bg-slate-800/60 rounded-xl', className)} />;
}
