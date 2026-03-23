'use client';

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/auth';
import { getScheduleJobs } from '@/lib/api';
import type { ScheduleJob } from '@/types';
import { formatDate, formatTime, shortID } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import FleetBadge from '@/components/ui/FleetBadge';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import Table from '@/components/ui/Table';

export default function ThreePLSchedulePage() {
  const [jobs, setJobs]     = useState<ScheduleJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'scheduled'>('pending');

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
  if (error)   return <p className="text-red-600 px-6 py-4">{error}</p>;

  const pendingJobs = jobs.filter(j => j.Status === 'Pending');
  const scheduledJobs = jobs.filter(j => j.Status !== 'Pending');
  const displayedJobs = activeTab === 'pending' ? pendingJobs : scheduledJobs;

  return (
    <div>
      <PageHeader title="Schedule" subtitle="Track and manage your vehicle branding appointments" count={jobs.length} />

      <div className="mb-6 flex gap-1 p-1 bg-zinc-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'pending'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Pending ({pendingJobs.length})
        </button>
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'scheduled'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Scheduled ({scheduledJobs.length})
        </button>
      </div>

      <Table
        data={displayedJobs as unknown as Record<string, unknown>[]}
        keyField="JobID"
        emptyMessage={activeTab === 'pending' ? "No pending jobs found." : "No scheduled jobs found."}
        columns={[
          { key: 'JobID',           header: 'Job ID',    render: r => <span className="font-mono text-xs text-zinc-500">{shortID(String(r.JobID))}</span> },
          { key: 'JobType',         header: 'Job Type',  render: r => <Badge status={String(r.JobType)} /> },
          { key: 'PlateNumber',     header: 'Plate No.', className: 'font-medium' },
          { key: 'DriverName',      header: 'Driver' },
          { key: 'DriverPhone',     header: 'Phone' },
          { key: 'FleetType',       header: 'Fleet',     render: r => <FleetBadge fleet={String(r.FleetType)} /> },
          { key: 'CarBrand',        header: 'Brand' },
          { key: 'CarModel',        header: 'Model' },
          { key: 'CarYear',         header: 'Year' },
          { key: 'Status',          header: 'Status',    render: r => <Badge status={String(r.Status)} /> },
          { key: 'SupplierName',    header: 'Supplier' },
          { key: 'Area',            header: 'Area' },
          { key: 'AppointmentDate', header: 'Date',      render: r => <span className="text-zinc-500 text-xs">{formatDate(String(r.AppointmentDate))}</span> },
          { key: 'AppointmentTime', header: 'Time',      render: r => <span className="text-zinc-500 text-xs">{formatTime(String(r.AppointmentTime))}</span> },
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
