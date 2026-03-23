'use client';

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/auth';
import { getScheduleJobs, verifyUpload } from '@/lib/api';
import type { ScheduleJob } from '@/types';
import { formatDate, shortID } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import FleetBadge from '@/components/ui/FleetBadge';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import Table from '@/components/ui/Table';
import Input from '@/components/ui/Input';

export default function AdminVerificationPage() {
  const [jobs, setJobs]       = useState<ScheduleJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ScheduleJob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]         = useState('');
  const [verifyNotes, setVerifyNotes] = useState('');

  function loadJobs() {
    getScheduleJobs({ role: 'Admin' })
      .then((res: unknown) => {
        const r = res as { success: boolean; jobs?: ScheduleJob[] };
        if (r.success) {
          // Only show 'Awaiting Admin Verification'
          const awaiting = (r.jobs ?? []).filter(j => j.Status === 'Awaiting Admin Verification');
          setJobs(awaiting);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadJobs(); }, []);

  async function handleVerify(approved: boolean) {
    if (!selected) return;
    const user = getUser();
    setSubmitting(true);
    setMsg('');
    try {
      const res = await verifyUpload(selected.JobID, approved, verifyNotes, user?.companyCode) as { success: boolean; error?: string };
      if (res.success) {
        setSelected(null);
        loadJobs();
      } else {
        setMsg(res.error || 'Failed to verify');
      }
    } catch {
      setMsg('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Verification"
        subtitle="Review and approve/reject supplier branding proof uploads"
        count={jobs.length}
      />

      <Table
        data={jobs as unknown as Record<string, unknown>[]}
        keyField="JobID"
        emptyMessage="No pending verifications."
        columns={[
          { key: 'JobID',       header: 'Job ID',    render: r => <span className="font-mono text-xs text-zinc-500">{shortID(String(r.JobID))}</span> },
          { key: 'JobType',     header: 'Type',      render: r => <Badge status={String(r.JobType)} /> },
          { key: 'PlateNumber', header: 'Plate No.', className: 'font-semibold' },
          { 
            key: 'Company',      
            header: 'Company', 
            render: r => (
              <div className="flex flex-col">
                <span className="font-medium text-zinc-900">{String(r.CompanyName)}</span>
                <span className="text-[10px] text-zinc-400 font-mono tracking-tight">{String(r.CompanyCode)}</span>
              </div>
            )
          },
          { 
            key: 'Driver',       
            header: 'Driver Details', 
            render: r => (
              <div className="flex flex-col text-xs">
                <span className="font-medium text-zinc-900">{String(r.DriverName)}</span>
                <span className="text-zinc-500">{String(r.DriverPhone)}</span>
              </div>
            )
          },
          { key: 'FleetType',   header: 'Fleet',     render: r => <FleetBadge fleet={String(r.FleetType)} /> },
          { key: 'SupplierName',header: 'Supplier',  className: 'text-zinc-500 text-xs' },
          {
            key: 'actions',
            header: 'Actions',
            render: r => (
              <Button size="sm" onClick={() => { setSelected(r as unknown as ScheduleJob); setMsg(''); setVerifyNotes(''); }}>
                Review Proof
              </Button>
            ),
          },
        ]}
      />

      {/* Review Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Verify Branding Proof"
        description={selected ? `${selected.JobType} · Plate: ${selected.PlateNumber} · Job ID: ${shortID(selected.JobID)}` : ''}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
            <Button variant="danger" loading={submitting} onClick={() => handleVerify(false)}>Reject & Reset</Button>
            <Button loading={submitting} onClick={() => handleVerify(true)}>Approve Branding</Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['LeftSideURL','BackSideURL','RightSideURL'] as const).map((k, i) => {
                const labels = ['Left Side','Back (Plate Visible)','Right Side'];
                const url = (selected.upload as any)?.[k];
                return (
                  <div key={k} className="space-y-2">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{labels[i]}</p>
                    {url ? (
                      <a href={url} target="_blank" rel="noreferrer"
                        className="group relative block h-48 rounded-xl overflow-hidden border-2 border-zinc-200 hover:border-brand transition-all shadow-sm">
                        <img src={url} alt={labels[i]} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-white/90 px-3 py-1.5 rounded-full text-xs font-medium translate-y-2 group-hover:translate-y-0 transition-transform">
                            View Full Size
                          </span>
                        </div>
                      </a>
                    ) : (
                      <div className="h-48 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center text-zinc-300 gap-2">
                        <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[10px] font-medium uppercase tracking-tight">No image</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 space-y-3">
              <p className="text-sm font-semibold text-zinc-700">Verification Outcome</p>
              {msg && <p className="text-sm text-red-600 font-medium font-mono">{msg}</p>}
              <Input
                label="Decision Notes (optional)"
                placeholder="Why are you rejecting? (e.g. Photo blur, incorrect plate...)"
                value={verifyNotes}
                onChange={e => setVerifyNotes(e.target.value)}
              />
              <p className="text-[10px] text-zinc-400">
                * Note: Rejecting will reset the job status to 'Scheduled' and notify the supplier to re-upload.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
