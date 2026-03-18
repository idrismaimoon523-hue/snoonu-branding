'use client';

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/auth';
import { getStickerRemoved } from '@/lib/api';
import type { StickerRemovedRecord } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import Table from '@/components/ui/Table';

export default function SupplierStickerRemovedPage() {
  const [records, setRecords] = useState<StickerRemovedRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUser();
    if (!user) return;
    getStickerRemoved({ supplierName: user.companyName, role: 'Supplier' })
      .then((res: unknown) => {
        const r = res as { success: boolean; records?: StickerRemovedRecord[] };
        if (r.success) setRecords(r.records ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Sticker Removed" subtitle="Sticker removal jobs completed by your company" count={records.length} />

      <Table
        data={records as unknown as Record<string, unknown>[]}
        keyField="JobID"
        emptyMessage="No sticker removal records yet."
        columns={[
          { key: 'PlateNumber',        header: 'Plate No.',     className: 'font-medium' },
          { key: 'DriverID',           header: 'Driver ID' },
          { key: 'DriverName',         header: 'Driver' },
          { key: 'DriverPhone',        header: 'Mobile' },
          { key: 'CompanyCode',        header: '3PL Code' },
          { key: 'CompanyName',        header: '3PL Name' },
          { key: 'FleetType',          header: 'Fleet' },
          { key: 'CarBrand',           header: 'Brand' },
          { key: 'CarModel',           header: 'Model' },
          { key: 'CarYear',            header: 'Year' },
          { key: 'StickerRemovedDate', header: 'Removed Date' },
          { key: 'JobID',              header: 'Job ID',        className: 'font-mono text-xs' },
        ]}
      />
    </div>
  );
}
