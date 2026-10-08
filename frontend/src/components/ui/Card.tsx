import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export function Card({ children, className, hoverEffect = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-[#0b1120]/80 border border-slate-200 dark:border-white/[0.08] rounded-2xl p-5 text-slate-900 dark:text-slate-100 shadow-xs dark:shadow-md transition-all',
        hoverEffect && 'hover:border-brand-400/50 hover:shadow-md dark:hover:border-brand-500/30 dark:hover:shadow-glow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06] mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight', className)}>{children}</h3>;
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium', className)}>{children}</p>;
}
