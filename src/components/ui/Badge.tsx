import clsx from 'clsx';

const STATUS_MAP: Record<string, { dot: string; badge: string }> = {
  Pending:                       { dot: 'bg-amber-400',   badge: 'bg-amber-50   text-amber-700   ring-amber-600/20' },
  Scheduled:                     { dot: 'bg-blue-400',    badge: 'bg-blue-50    text-blue-700    ring-blue-600/20' },
  'Awaiting Supplier Action':    { dot: 'bg-cyan-400',    badge: 'bg-cyan-50    text-cyan-700    ring-cyan-600/20' },
  'Awaiting Admin Verification': { dot: 'bg-violet-400',  badge: 'bg-violet-50  text-violet-700  ring-violet-600/20' },
  'Did Not Appear':              { dot: 'bg-red-400',     badge: 'bg-red-50     text-red-700     ring-red-600/20' },
  Rejected:                      { dot: 'bg-red-400',     badge: 'bg-red-50     text-red-700     ring-red-600/20' },
  Completed:                     { dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  Approved:                      { dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  Branding:                      { dot: 'bg-brand',       badge: 'bg-brand-light text-brand      ring-brand/20' },
  'Re-branding':                 { dot: 'bg-orange-400',  badge: 'bg-orange-50  text-orange-700  ring-orange-600/20' },
  'Sticker Removal':             { dot: 'bg-zinc-400',    badge: 'bg-zinc-100   text-zinc-700    ring-zinc-600/20' },
};

const DEFAULT = { dot: 'bg-zinc-400', badge: 'bg-zinc-100 text-zinc-700 ring-zinc-600/20' };

interface BadgeProps {
  status: string;
  showDot?: boolean;
  className?: string;
}

export default function Badge({ status, showDot = true, className }: BadgeProps) {
  const style = STATUS_MAP[status] ?? DEFAULT;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5',
        'text-xs font-medium ring-1 ring-inset whitespace-nowrap',
        style.badge,
        className,
      )}
    >
      {showDot && (
        <span className={clsx('h-1.5 w-1.5 rounded-full shrink-0', style.dot)} />
      )}
      {status}
    </span>
  );
}
