'use client';

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/auth';
import { getStickerRemoved } from '@/lib/api';
import type { StickerRemovedRecord } from '@/types';
import { formatDate } from '@/lib/utils';
import FleetBadge from '@/components/ui/FleetBadge';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import Table from '@/components/ui/Table';

export default function ThreePLStickerRemovedPage() {
  const [records, setRecords] = useState<StickerRemovedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const user = getUser();
    if (!user) return;
    getStickerRemoved({ companyCode: user.companyCode, role: '3PL' })
      .then((res: unknown) => {
        const r = res as { success: boolean; records?: StickerRemovedRecord[]; error?: string };
        if (r.success) setRecords(r.records ?? []);
        else setError(r.error || 'Failed to load');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error)   return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <PageHeader title="Sticker Removed" subtitle="Vehicles whose stickers have been removed" count={records.length} />

      <Table
        data={records as unknown as Record<string, unknown>[]}
        keyField="PlateNumber"
        emptyMessage="No sticker removal records yet."
        columns={[
          { key: 'PlateNumber',        header: 'Plate No.',    className: 'font-medium' },
          { key: 'DriverID',           header: 'Driver ID' },
          { key: 'DriverName',         header: 'Driver Name' },
          { key: 'DriverPhone',        header: 'Mobile' },
          { key: 'CompanyCode',        header: '3PL Code' },
          { key: 'CompanyName',        header: '3PL Name' },
          { key: 'FleetType',          header: 'Fleet',        render: r => <FleetBadge fleet={String(r.FleetType)} /> },
          { key: 'CarBrand',           header: 'Brand' },
          { key: 'CarModel',           header: 'Model' },
          { key: 'CarYear',            header: 'Year' },
          { key: 'StickerRemovedDate', header: 'Removed Date', render: r => <span className="text-zinc-500 text-xs">{formatDate(String(r.StickerRemovedDate))}</span> },
          { key: 'BySupplier',         header: 'By Supplier' },
        ]}
      />
    </div>
  );
}
