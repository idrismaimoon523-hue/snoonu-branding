interface Props { fleet: string | undefined | null }

export default function FleetBadge({ fleet }: Props) {
  if (!fleet) return <span className="text-zinc-400 text-xs">—</span>;
  const isBike = String(fleet).toLowerCase() === 'bike';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${
        isBike ? 'bg-orange-50 text-orange-700' : 'bg-sky-50 text-sky-700'
      }`}
    >
      {isBike ? (
        <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="5.5" cy="17.5" r="3.5" />
          <circle cx="18.5" cy="17.5" r="3.5" />
          <path d="M15 6h-3l-3 5.5H3m12 0l-2-5.5m2 5.5l3.5-1.5" />
        </svg>
      ) : (
        <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2l2-3h12l2 3h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
          <circle cx="7.5" cy="17.5" r="1.5" />
          <circle cx="16.5" cy="17.5" r="1.5" />
          <path d="M5 17h9" />
        </svg>
      )}
      {fleet}
    </span>
  );
}
