import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      icon,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary:
        'bg-brand-600 hover:bg-brand-500 text-white shadow-sm shadow-brand-600/20 active:bg-brand-700 focus-visible:ring-brand-500',
      secondary:
        'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 focus-visible:ring-slate-400',
      outline:
        'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white border border-slate-700 focus-visible:ring-slate-400',
      danger:
        'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/20 active:bg-rose-700 focus-visible:ring-rose-500',
      ghost: 'bg-transparent hover:bg-slate-800/40 text-slate-300 hover:text-white focus-visible:ring-slate-400',
    };

    const sizeStyles = {
      sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
      md: 'h-9 px-4 text-sm gap-2 rounded-lg',
      lg: 'h-11 px-6 text-base gap-2.5 rounded-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed select-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
