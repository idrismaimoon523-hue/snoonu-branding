import clsx from 'clsx';
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base = [
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none',
    'select-none',
  ].join(' ');

  const variants = {
    primary:
      'bg-brand text-white hover:bg-brand-dark active:bg-brand-darker shadow-sm hover:shadow-brand focus-visible:ring-brand',
    secondary:
      'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 active:bg-zinc-100 shadow-sm focus-visible:ring-zinc-400',
    danger:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm focus-visible:ring-red-500',
    ghost:
      'text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200 focus-visible:ring-zinc-400',
    outline:
      'border border-brand text-brand hover:bg-brand-light active:bg-brand-muted focus-visible:ring-brand',
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs gap-1',
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
  };

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className={clsx('animate-spin shrink-0', size === 'xs' ? 'h-3 w-3' : 'h-4 w-4')}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
}
