import clsx from 'clsx';
import { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[] | string[];
  placeholder?: string;
  value?: string | number | string[];
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  disabled?: boolean;
}

export default function Select({
  label, error, hint, options, placeholder, className, id, ...props
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const normalised = options.map(o =>
    typeof o === 'string' ? { value: o, label: o } : o,
  );

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-zinc-700 leading-none">
          {label}
          {props.required && <span className="text-brand ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          className={clsx(
            'flex h-9 w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-8 text-sm text-zinc-900',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-red-400 bg-red-50/50'
              : 'border-zinc-200 hover:border-zinc-300',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {normalised.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Custom chevron */}
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </div>
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
