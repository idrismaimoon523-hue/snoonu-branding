'use client';

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/auth';
import { getScheduleJobs } from '@/lib/api';
import type { ScheduleJob } from '@/types';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import Table from '@/components/ui/Table';

export default function ThreePLSchedulePage() {
  const [jobs, setJobs]     = useState<ScheduleJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    const user = getUser();
    if (!user) return;
    getScheduleJobs({ companyCode: user.companyCode, role: '3PL' })
      .then((res: unknown) => {
        const r = res as { success: boolean; jobs?: ScheduleJob[]; error?: string };
        if (r.success) setJobs(r.jobs ?? []);
        else setError(r.error || 'Failed to load');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error)   return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <PageHeader title="Schedule" subtitle="All jobs for your fleet" count={jobs.length} />

      <Table
        data={jobs as unknown as Record<string, unknown>[]}
        keyField="JobID"
        emptyMessage="No schedule jobs yet."
        columns={[
          { key: 'JobID',           header: 'Job ID',      className: 'font-mono text-xs' },
          { key: 'JobType',         header: 'Job Type',    render: r => <Badge status={String(r.JobType)} /> },
          { key: 'PlateNumber',     header: 'Plate No.',   className: 'font-medium' },
          { key: 'DriverName',      header: 'Driver' },
          { key: 'DriverPhone',     header: 'Phone' },
          { key: 'FleetType',       header: 'Fleet' },
          { key: 'CarBrand',        header: 'Brand' },
          { key: 'CarModel',        header: 'Model' },
          { key: 'CarYear',         header: 'Year' },
          { key: 'Status',          header: 'Status',      render: r => <Badge status={String(r.Status)} /> },
          { key: 'SupplierName',    header: 'Supplier' },
          { key: 'Area',            header: 'Area' },
          { key: 'AppointmentDate', header: 'Date' },
          { key: 'AppointmentTime', header: 'Time' },
          {
            key: 'upload',
            header: 'Photos',
            render: r => {
              const upload = r.upload as { VerificationStatus?: string } | null;
              if (!upload) return <span className="text-zinc-300 text-xs">—</span>;
              return <Badge status={String(upload.VerificationStatus)} />;
            },
          },
        ]}
      />
    </div>
  );
}
