import React, { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  count?: number;
}

export default function PageHeader({ title, subtitle, action, count }: PageHeaderProps) {
  return (
    <div className="page-header flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="page-title">{title}</h1>
          {count !== undefined && (
            <span className="inline-flex items-center justify-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200">
              {count}
            </span>
          )}
        </div>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
