'use client';

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/auth';
import { getScheduleJobs, getAvailableSlots, assignSupplierSlot, rescheduleJob, rejectJob, verifyUpload } from '@/lib/api';
import type { ScheduleJob, SupplierSlot } from '@/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import Table from '@/components/ui/Table';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { JOB_STATUSES } from '@/lib/constants';

type ActionType = 'assign' | 'reschedule' | 'verify' | null;

export default function AdminSchedulePage() {
  const [jobs, setJobs]             = useState<ScheduleJob[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<ScheduleJob | null>(null);
  const [action, setAction]         = useState<ActionType>(null);
  const [slots, setSlots]           = useState<SupplierSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]               = useState('');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  function loadJobs() {
    getScheduleJobs({ role: 'Admin' })
      .then((res: unknown) => {
        const r = res as { success: boolean; jobs?: ScheduleJob[] };
        if (r.success) setJobs(r.jobs ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadJobs(); }, []);

  async function openAssign(job: ScheduleJob, mode: 'assign' | 'reschedule') {
    setSelected(job); setAction(mode); setSelectedSlot(''); setMsg('');
    setSlotsLoading(true);
    const res = await getAvailableSlots(undefined, job.JobType) as { success: boolean; slots?: SupplierSlot[] };
    setSlots(res.slots ?? []);
    setSlotsLoading(false);
  }

  async function handleAssign() {
    if (!selected || !selectedSlot) { setMsg('Please select a slot'); return; }
    setSubmitting(true);
    const fn = action === 'reschedule' ? rescheduleJob : assignSupplierSlot;
    const res = await fn(selected.JobID, selectedSlot) as { success: boolean; error?: string };
    if (res.success) { setAction(null); loadJobs(); }
    else setMsg(res.error || 'Failed');
    setSubmitting(false);
  }

  async function handleVerify(approved: boolean) {
    if (!selected) return;
    const user = getUser();
    setSubmitting(true);
    const res = await verifyUpload(selected.JobID, approved, verifyNotes, user?.companyCode) as { success: boolean; error?: string };
    if (res.success) { setAction(null); loadJobs(); }
    else setMsg(res.error || 'Failed');
    setSubmitting(false);
  }

  const displayed = filterStatus ? jobs.filter(j => j.Status === filterStatus) : jobs;

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Schedule"
        subtitle="Manage all jobs — assign slots, verify uploads, reschedule"
        count={displayed.length}
        action={
          <Select
            options={[{ value: '', label: 'All Statuses' }, ...JOB_STATUSES.map(s => ({ value: s, label: s }))]}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-52 text-sm"
          />
        }
      />

      <Table
        data={displayed as unknown as Record<string, unknown>[]}
        keyField="JobID"
        emptyMessage="No jobs found."
        columns={[
          { key: 'JobID',       header: 'Job ID',    className: 'font-mono text-xs text-zinc-500' },
          { key: 'JobType',     header: 'Type',      render: r => <Badge status={String(r.JobType)} /> },
          { key: 'PlateNumber', header: 'Plate No.', className: 'font-semibold' },
          { key: 'CompanyName', header: 'Company' },
          { key: 'DriverName',  header: 'Driver' },
          { key: 'FleetType',   header: 'Fleet',     className: 'text-zinc-500' },
          { key: 'CarBrand',    header: 'Brand',     className: 'text-zinc-500' },
          { key: 'CarModel',    header: 'Model',     className: 'text-zinc-500' },
          { key: 'Status',      header: 'Status',    render: r => <Badge status={String(r.Status)} /> },
          { key: 'SupplierName',header: 'Supplier',  className: 'text-zinc-500' },
          { key: 'AppointmentDate', header: 'Date',  className: 'text-zinc-500' },
          { key: 'AppointmentTime', header: 'Time',  className: 'text-zinc-500' },
          {
            key: 'actions',
            header: 'Actions',
            render: r => {
              const job = r as unknown as ScheduleJob;
              return (
                <div className="flex gap-1.5 flex-wrap">
                  {job.Status === 'Pending' && (
                    <Button size="xs" onClick={() => openAssign(job, 'assign')}>Assign</Button>
                  )}
                  {(job.Status === 'Scheduled' || job.Status === 'Did Not Appear') && (
                    <Button size="xs" variant="secondary" onClick={() => openAssign(job, 'reschedule')}>Reschedule</Button>
                  )}
                  {job.Status === 'Awaiting Admin Verification' && (
                    <Button size="xs" onClick={() => { setSelected(job); setAction('verify'); setMsg(''); setVerifyNotes(''); }}>
                      Verify
                    </Button>
                  )}
                  {['Pending','Scheduled','Did Not Appear'].includes(job.Status) && (
                    <Button size="xs" variant="danger" onClick={() => { if (confirm('Reject this job?')) rejectJob(job.JobID).then(() => loadJobs()); }}>
                      Reject
                    </Button>
                  )}
                </div>
              );
            },
          },
        ]}
      />

      {/* Assign / Reschedule Modal */}
      <Modal
        open={action === 'assign' || action === 'reschedule'}
        onClose={() => setAction(null)}
        title={action === 'reschedule' ? 'Reschedule Job' : 'Assign Supplier Slot'}
        description={selected ? `${selected.JobType} · ${selected.PlateNumber}` : ''}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAction(null)}>Cancel</Button>
            <Button loading={submitting} onClick={handleAssign}>Confirm Assignment</Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-sm">
              <Badge status={selected.Status} />
              <span className="text-zinc-600">{selected.DriverName} — {selected.DriverPhone}</span>
            </div>
            {msg && <p className="text-sm text-red-600">{msg}</p>}

            {slotsLoading ? <Spinner message="Loading available slots…" /> : (
              slots.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  <p className="text-sm font-medium">No available slots for {selected.JobType}</p>
                  <p className="text-xs mt-1">Create slots in Supplier Slot Management</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {slots.map(s => (
                    <label
                      key={s.SlotID}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-100 ${
                        selectedSlot === s.SlotID
                          ? 'border-brand bg-brand-light'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio" name="slot" value={s.SlotID}
                        checked={selectedSlot === s.SlotID}
                        onChange={() => setSelectedSlot(s.SlotID)}
                        className="accent-brand"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-800">{s.SupplierName}</p>
                        <p className="text-xs text-zinc-500">{s.Date} at {s.Time} · {s.Area}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${Number(s.availableCapacity) === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                          {s.availableCapacity} left
                        </p>
                        <p className="text-xs text-zinc-400">of {s.MaxCapacity}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </Modal>

      {/* Verify Modal */}
      <Modal
        open={action === 'verify'}
        onClose={() => setAction(null)}
        title="Verify Supplier Upload"
        description={selected ? `${selected.JobType} · Plate: ${selected.PlateNumber}` : ''}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAction(null)}>Cancel</Button>
            <Button variant="danger" loading={submitting} onClick={() => handleVerify(false)}>Reject & Reset</Button>
            <Button loading={submitting} onClick={() => handleVerify(true)}>Approve</Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            {selected.upload ? (
              <div className="grid grid-cols-3 gap-3">
                {(['LeftSideURL','BackSideURL','RightSideURL'] as const).map((k, i) => {
                  const labels = ['Left Side','Back (Plate Visible)','Right Side'];
                  const url = (selected.upload as unknown as Record<string, string>)[k];
                  return (
                    <div key={k}>
                      <p className="text-xs font-medium text-zinc-500 mb-1.5">{labels[i]}</p>
                      {url ? (
                        <a href={url} target="_blank" rel="noreferrer"
                          className="block h-32 rounded-xl overflow-hidden border-2 border-zinc-200 hover:border-brand transition-colors">
                          <img src={url} alt={labels[i]} className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <div className="h-32 rounded-xl border-2 border-dashed border-zinc-200 flex items-center justify-center text-zinc-300 text-xs">
                          No image
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-400">
                <p className="text-sm">No images uploaded yet for this job.</p>
              </div>
            )}
            {msg && <p className="text-sm text-red-600">{msg}</p>}
            <Input
              label="Notes (optional)"
              placeholder="Rejection reason or verification notes…"
              value={verifyNotes}
              onChange={e => setVerifyNotes(e.target.value)}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
