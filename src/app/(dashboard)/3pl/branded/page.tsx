'use client';

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/auth';
import { getBrandedVehicles } from '@/lib/api';
import type { BrandedVehicle } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import Table from '@/components/ui/Table';

export default function ThreePLBrandedPage() {
  const [vehicles, setVehicles] = useState<BrandedVehicle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    const user = getUser();
    if (!user) return;
    getBrandedVehicles({ companyCode: user.companyCode, role: '3PL' })
      .then((res: unknown) => {
        const r = res as { success: boolean; vehicles?: BrandedVehicle[]; error?: string };
        if (r.success) setVehicles(r.vehicles ?? []);
        else setError(r.error || 'Failed to load');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error)   return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <PageHeader title="Branded Vehicles" subtitle="All successfully branded vehicles for your fleet" count={vehicles.length} />

      <Table
        data={vehicles as unknown as Record<string, unknown>[]}
        keyField="PlateNumber"
        emptyMessage="No branded vehicles yet."
        columns={[
          { key: 'PlateNumber', header: 'Plate No.',   className: 'font-medium' },
          { key: 'DriverID',    header: 'Driver ID' },
          { key: 'DriverName',  header: 'Driver Name' },
          { key: 'DriverPhone', header: 'Mobile' },
          { key: 'CompanyCode', header: '3PL Code' },
          { key: 'CompanyName', header: '3PL Name' },
          { key: 'FleetType',   header: 'Fleet' },
          { key: 'CarBrand',    header: 'Brand' },
          { key: 'CarModel',    header: 'Model' },
          { key: 'CarYear',     header: 'Year' },
          { key: 'BrandedDate', header: 'Branded Date' },
        ]}
      />
    </div>
  );
}
