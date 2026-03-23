import { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  keyField: keyof T;
  onSelect?: (keys: string[]) => void;
  selectedKeys?: string[];
}

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = 'No records found.',
  keyField,
  onSelect,
  selectedKeys = [],
}: TableProps<T>) {
  const allSelected = data.length > 0 && selectedKeys.length === data.length;
  const isSelected = (row: T) => selectedKeys.includes(String(row[keyField]));

  const toggleAll = () => {
    if (onSelect) {
      onSelect(allSelected ? [] : data.map(row => String(row[keyField])));
    }
  };

  const toggleRow = (key: string) => {
    if (onSelect) {
      if (selectedKeys.includes(key)) {
        onSelect(selectedKeys.filter(k => k !== key));
      } else {
        onSelect([...selectedKeys, key]);
      }
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-100 text-sm">
          <thead>
            <tr className="bg-zinc-50">
              {onSelect && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-zinc-300 text-brand focus:ring-brand accent-brand h-4 w-4"
                    checked={allSelected}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 bg-white">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onSelect ? 1 : 0)} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-zinc-400">
                    <svg className="h-10 w-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-sm font-medium text-zinc-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => {
                const key = String(row[keyField]);
                const active = isSelected(row);
                return (
                  <tr
                    key={key}
                    className={`transition-colors ${active ? 'bg-brand/[0.03]' : 'hover:bg-zinc-50/70'}`}
                  >
                    {onSelect && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="rounded border-zinc-300 text-brand focus:ring-brand accent-brand h-4 w-4"
                          checked={active}
                          onChange={() => toggleRow(key)}
                        />
                      </td>
                    )}
                    {columns.map(col => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-zinc-700 whitespace-nowrap ${col.className ?? ''}`}
                      >
                        {col.render ? col.render(row) : (
                          <span className={!row[col.key] ? 'text-zinc-300' : ''}>
                            {String(row[col.key] ?? '—')}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {(data.length > 0 || selectedKeys.length > 0) && (
        <div className="px-4 py-2.5 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            {selectedKeys.length > 0 ? (
              <span className="text-brand font-medium">{selectedKeys.length} selected</span>
            ) : (
              `${data.length} record${data.length !== 1 ? 's' : ''}`
            )}
          </p>
        </div>
      )}
    </div>
  );
}
