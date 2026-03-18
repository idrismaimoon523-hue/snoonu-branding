'use client';

import { useEffect, useState, useRef } from 'react';
import { getUser } from '@/lib/auth';
import { getSupplierJobs, markDidNotAppear, uploadImagesBase64, fileToBase64 } from '@/lib/api';
import type { ScheduleJob } from '@/types';
import { formatDate, formatTime, shortID } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import FleetBadge from '@/components/ui/FleetBadge';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import Table from '@/components/ui/Table';

type UploadState = { left: File | null; back: File | null; right: File | null };

export default function SupplierSchedulePage() {
  const [jobs, setJobs]         = useState<ScheduleJob[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<ScheduleJob | null>(null);
  const [modalType, setModalType] = useState<'upload' | 'dna' | null>(null);
  const [files, setFiles]       = useState<UploadState>({ left: null, back: null, right: null });
  const [previews, setPreviews] = useState<{ left: string; back: string; right: string }>({ left: '', back: '', right: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]           = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const leftRef  = useRef<HTMLInputElement>(null);
  const backRef  = useRef<HTMLInputElement>(null);
  const rightRef = useRef<HTMLInputElement>(null);

  const user = getUser();

  function loadJobs() {
    if (!user) return;
    getSupplierJobs(user.companyName)
      .then((res: unknown) => {
        const r = res as { success: boolean; jobs?: ScheduleJob[] };
        if (r.success) setJobs(r.jobs ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadJobs(); }, []); // eslint-disable-line

  function handleFileChange(side: keyof UploadState, file: File | null) {
    setFiles(f => ({ ...f, [side]: file }));
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviews(p => ({ ...p, [side]: url }));
    } else {
      setPreviews(p => ({ ...p, [side]: '' }));
    }
  }

  async function handleUpload() {
    if (!selected) return;
    if (!files.left || !files.back || !files.right) {
      setMsg('Please capture all 3 photos before uploading.');
      return;
    }
    setSubmitting(true); setMsg('');
    try {
      const [leftB64, backB64, rightB64] = await Promise.all([
        fileToBase64(files.left),
        fileToBase64(files.back),
        fileToBase64(files.right),
      ]);
      const res = await uploadImagesBase64({
        jobID:        selected.JobID,
        leftB64, backB64, rightB64,
        mimeType:     files.left.type || 'image/jpeg',
        supplierName: user?.companyName,
        plateNumber:  selected.PlateNumber,
      }) as { success: boolean; error?: string };
      if (res.success) {
        setModalType(null);
        setFiles({ left: null, back: null, right: null });
        setPreviews({ left: '', back: '', right: '' });
        loadJobs();
      } else {
        setMsg(res.error || 'Upload failed');
      }
    } catch { setMsg('Upload error. Please try again.'); }
    finally { setSubmitting(false); }
  }

  async function handleDNA() {
    if (!selected) return;
    setSubmitting(true); setMsg('');
    const res = await markDidNotAppear(selected.JobID) as { success: boolean; error?: string };
    if (res.success) { setModalType(null); loadJobs(); }
    else setMsg(res.error || 'Failed');
    setSubmitting(false);
  }

  const displayed = filterStatus ? jobs.filter(j => j.Status === filterStatus) : jobs;
  const STATUSES  = ['','Scheduled','Awaiting Admin Verification','Did Not Appear','Completed'];

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Assigned Schedule"
        subtitle="Jobs assigned to your company"
        count={jobs.length}
        action={
          <select
            className="flex h-9 appearance-none rounded-lg border border-zinc-200 bg-white px-3 py-2 pr-8 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand hover:border-zinc-300"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
        }
      />

      <Table
        data={displayed as unknown as Record<string, unknown>[]}
        keyField="JobID"
        emptyMessage="No jobs assigned to you yet."
        columns={[
          { key: 'JobID',           header: 'Job ID',    render: r => <span className="font-mono text-xs text-zinc-500">{shortID(String(r.JobID))}</span> },
          { key: 'JobType',         header: 'Type',      render: r => <Badge status={String(r.JobType)} /> },
          { key: 'PlateNumber',     header: 'Plate No.', className: 'font-medium' },
          { key: 'CompanyName',     header: 'Company' },
          { key: 'DriverName',      header: 'Driver' },
          { key: 'DriverPhone',     header: 'Phone' },
          { key: 'FleetType',       header: 'Fleet',     render: r => <FleetBadge fleet={String(r.FleetType)} /> },
          { key: 'CarBrand',        header: 'Brand' },
          { key: 'CarModel',        header: 'Model' },
          { key: 'AppointmentDate', header: 'Date',      render: r => <span className="text-zinc-600 text-xs">{formatDate(String(r.AppointmentDate))}</span> },
          { key: 'AppointmentTime', header: 'Time',      render: r => <span className="text-zinc-600 text-xs">{formatTime(String(r.AppointmentTime))}</span> },
          { key: 'Area',            header: 'Area' },
          { key: 'Status',          header: 'Status',    render: r => <Badge status={String(r.Status)} /> },
          {
            key: 'actions',
            header: 'Actions',
            render: r => {
              const job = r as unknown as ScheduleJob;
              if (job.Status === 'Completed') return <span className="text-zinc-400 text-xs">Done</span>;
              if (job.Status === 'Awaiting Admin Verification') return <span className="text-purple-600 text-xs">Awaiting verification</span>;
              return (
                <div className="flex gap-1 flex-wrap">
                  <Button size="sm" onClick={() => { setSelected(job); setModalType('upload'); setMsg(''); }}>
                    📸 Upload Photos
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => { setSelected(job); setModalType('dna'); setMsg(''); }}>
                    DNA
                  </Button>
                </div>
              );
            },
          },
        ]}
      />

      {/* Upload Photos Modal */}
      <Modal
        open={modalType === 'upload'}
        onClose={() => setModalType(null)}
        title="Upload Job Photos"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalType(null)}>Cancel</Button>
            <Button loading={submitting} onClick={handleUpload}>Upload 3 Photos</Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-sm">
              <Badge status={selected.Status} />
              <span className="text-zinc-600">{selected.PlateNumber} · {selected.DriverName} · {selected.JobType}</span>
            </div>
            {msg && <p className="text-sm text-red-600">{msg}</p>}
            <p className="text-sm text-zinc-500">Take all 3 required photos. Back photo must show the plate number clearly.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                { key: 'left',  label: 'Left Side',           ref: leftRef  },
                { key: 'back',  label: 'Back (Plate Visible)', ref: backRef  },
                { key: 'right', label: 'Right Side',          ref: rightRef },
              ] as const).map(({ key, label, ref }) => (
                <div key={key} className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                    {label} <span className="text-brand">*</span>
                  </p>
                  <div
                    className="w-full h-36 rounded-xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand transition-colors duration-150 overflow-hidden bg-zinc-50"
                    onClick={() => ref.current?.click()}
                  >
                    {previews[key] ? (
                      <img src={previews[key]} alt={key} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-zinc-400 text-xs p-3">
                        {/* Camera icon */}
                        <svg className="h-8 w-8 mx-auto mb-1.5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                          <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="font-medium">Tap to take photo</p>
                      </div>
                    )}
                  </div>
                  {/* capture="environment" forces camera on mobile */}
                  <input
                    ref={ref}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => handleFileChange(key, e.target.files?.[0] ?? null)}
                  />
                  {files[key] && (
                    <p className="text-xs text-green-600 truncate">✅ {files[key]!.name}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Did Not Appear Confirm Modal */}
      <Modal
        open={modalType === 'dna'}
        onClose={() => setModalType(null)}
        title="Mark as Did Not Appear"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalType(null)}>Cancel</Button>
            <Button variant="danger" loading={submitting} onClick={handleDNA}>Confirm DNA</Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-3 text-sm">
            {msg && <p className="text-red-600">{msg}</p>}
            <p>Are you sure the driver did not appear for this appointment?</p>
            <div className="bg-zinc-50 rounded-lg border border-zinc-200 p-3 space-y-0.5">
              <p><span className="font-medium">Job:</span> {shortID(selected.JobID)}</p>
              <p><span className="font-medium">Plate:</span> {selected.PlateNumber}</p>
              <p><span className="font-medium">Driver:</span> {selected.DriverName} ({selected.DriverPhone})</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
