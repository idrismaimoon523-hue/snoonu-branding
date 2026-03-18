'use client';

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/auth';
import { getSupplierBranded } from '@/lib/api';
import type { BrandedVehicle } from '@/types';
import { formatDate, shortID } from '@/lib/utils';
import FleetBadge from '@/components/ui/FleetBadge';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import Table from '@/components/ui/Table';

export default function SupplierBrandedPage() {
  const [vehicles, setVehicles] = useState<BrandedVehicle[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const user = getUser();
    if (!user) return;
    getSupplierBranded(user.companyName)
      .then((res: unknown) => {
        const r = res as { success: boolean; vehicles?: BrandedVehicle[] };
        if (r.success) setVehicles(r.vehicles ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Branded Vehicles" subtitle="Branding jobs completed by your company" count={vehicles.length} />

      <Table
        data={vehicles as unknown as Record<string, unknown>[]}
        keyField="PlateNumber"
        emptyMessage="No branding records yet."
        columns={[
          { key: 'PlateNumber', header: 'Plate No.',   className: 'font-medium' },
          { key: 'DriverID',    header: 'Driver ID' },
          { key: 'DriverName',  header: 'Driver' },
          { key: 'DriverPhone', header: 'Mobile' },
          { key: 'CompanyCode', header: '3PL Code' },
          { key: 'CompanyName', header: '3PL Name' },
          { key: 'FleetType',   header: 'Fleet',        render: r => <FleetBadge fleet={String(r.FleetType)} /> },
          { key: 'CarBrand',    header: 'Brand' },
          { key: 'CarModel',    header: 'Model' },
          { key: 'CarYear',     header: 'Year' },
          { key: 'BrandedDate', header: 'Branded Date', render: r => <span className="text-zinc-500 text-xs">{formatDate(String(r.BrandedDate))}</span> },
          { key: 'JobID',       header: 'Job ID',       render: r => <span className="font-mono text-xs text-zinc-500">{shortID(String(r.JobID))}</span> },
        ]}
      />
    </div>
  );
}
