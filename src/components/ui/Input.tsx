import clsx from 'clsx';
import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
}

export default function Input({ label, error, hint, prefix, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-zinc-700 leading-none">
          {label}
          {props.required && <span className="text-brand ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-sm text-zinc-400 pointer-events-none select-none">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={clsx(
            'flex h-9 w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900',
            'placeholder:text-zinc-400',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-zinc-50',
            'read-only:bg-zinc-50 read-only:text-zinc-500 read-only:cursor-default',
            error
              ? 'border-red-400 bg-red-50/50 focus-visible:ring-red-400'
              : 'border-zinc-200 hover:border-zinc-300',
            prefix && 'pl-7',
            className,
          )}
          {...props}
        />
      </div>

      {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <svg className="h-3 w-3 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0V5zm.75 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
