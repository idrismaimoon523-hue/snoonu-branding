'use client';

import { useEffect, useState } from 'react';
import { getBrandedVehicles } from '@/lib/api';
import type { BrandedVehicle } from '@/types';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import Table from '@/components/ui/Table';

export default function AdminBrandedPage() {
  const [vehicles, setVehicles]       = useState<BrandedVehicle[]>([]);
  const [loading, setLoading]         = useState(true);
  const [searchCompany, setSearchCompany] = useState('');
  const [searchPlate, setSearchPlate]     = useState('');
  const [searchDriver, setSearchDriver]   = useState('');

  useEffect(() => {
    getBrandedVehicles({ role: 'Admin' })
      .then((res: unknown) => {
        const r = res as { success: boolean; vehicles?: BrandedVehicle[] };
        if (r.success) setVehicles(r.vehicles ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayed = vehicles.filter(v => {
    const c = searchCompany.toLowerCase();
    const p = searchPlate.toLowerCase();
    const d = searchDriver.toLowerCase();
    return (
      (!c || String(v.CompanyCode).toLowerCase().includes(c) || String(v.CompanyName).toLowerCase().includes(c)) &&
      (!p || String(v.PlateNumber).toLowerCase().includes(p)) &&
      (!d || String(v.DriverID).toLowerCase().includes(d) || String(v.DriverName).toLowerCase().includes(d))
    );
  });

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Branded Vehicles" subtitle="All branded vehicles across all companies" count={vehicles.length} />

      {/* Search / Filter bar */}
      <div className="card p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          placeholder="Search by company…"
          value={searchCompany}
          onChange={e => setSearchCompany(e.target.value)}
        />
        <Input
          placeholder="Search by plate number…"
          value={searchPlate}
          onChange={e => setSearchPlate(e.target.value)}
        />
        <Input
          placeholder="Search by driver ID or name…"
          value={searchDriver}
          onChange={e => setSearchDriver(e.target.value)}
        />
      </div>

      <Table
        data={displayed as unknown as Record<string, unknown>[]}
        keyField="PlateNumber"
        emptyMessage="No branded vehicles found."
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
          { key: 'SupplierName',header: 'Supplier' },
        ]}
      />
    </div>
  );
}
