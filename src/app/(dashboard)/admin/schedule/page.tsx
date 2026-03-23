'use client';

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/auth';
import { getScheduleJobs, getAvailableSlots, assignSupplierSlot, rescheduleJob, rejectJob, verifyUpload } from '@/lib/api';
import type { ScheduleJob, SupplierSlot } from '@/types';
import { formatDate, formatTime, shortID } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import FleetBadge from '@/components/ui/FleetBadge';
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
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]               = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedJobIDs, setSelectedJobIDs] = useState<string[]>([]);

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

  const displayed = filterStatus ? jobs.filter(j => j.Status === filterStatus) : jobs;

  // Only allow selecting pending jobs for bulk assignment
  const handleSelect = (ids: string[]) => {
    const pendingIDs = jobs.filter(j => j.Status === 'Pending').map(j => String(j.JobID));
    setSelectedJobIDs(ids.filter(id => pendingIDs.includes(id)));
  };

  async function openAssign(job: ScheduleJob, mode: 'assign' | 'reschedule') {
    setSelected(job); setAction(mode); setSelectedSlot(''); setMsg('');
    setExpandedSupplier(null);
    setSlotsLoading(true);
    const res = await getAvailableSlots(undefined, job.JobType) as { success: boolean; slots?: SupplierSlot[] };
    setSlots(res.slots ?? []);
    setSlotsLoading(false);
  }

  async function openBulkAssign() {
    if (selectedJobIDs.length === 0) return;
    // We'll use the first job as a template for available slots (assuming mixed types, or we filter to same type)
    const firstJob = jobs.find(j => j.JobID === selectedJobIDs[0]);
    if (!firstJob) return;
    setSelected(null); // Indicates bulk
    setAction('assign');
    setSelectedSlot(''); setMsg('');
    setExpandedSupplier(null);
    setSlotsLoading(true);
    const res = await getAvailableSlots(undefined, firstJob.JobType) as { success: boolean; slots?: SupplierSlot[] };
    setSlots(res.slots ?? []);
    setSlotsLoading(false);
  }

  async function handleAssign() {
    if (!selectedSlot) { setMsg('Please select a slot'); return; }
    setSubmitting(true);
    
    if (selected) {
      // Single assignment
      const fn = action === 'reschedule' ? rescheduleJob : assignSupplierSlot;
      const res = await fn(selected.JobID, selectedSlot) as { success: boolean; error?: string };
      if (res.success) { setAction(null); loadJobs(); }
      else setMsg(res.error || 'Failed');
    } else {
      // Bulk assignment
      let successCount = 0;
      for (const jobID of selectedJobIDs) {
        const res = await assignSupplierSlot(jobID, selectedSlot) as { success: boolean };
        if (res.success) successCount++;
      }
      setMsg(`Successfully assigned ${successCount} of ${selectedJobIDs.length} jobs.`);
      if (successCount === selectedJobIDs.length) {
        setAction(null);
        setSelectedJobIDs([]);
        loadJobs();
      }
    }
    setSubmitting(false);
  }

  // Group slots by supplier name for the accordion UI
  const supplierGroups = slots.reduce<Record<string, SupplierSlot[]>>((acc, slot) => {
    const name = slot.SupplierName;
    if (!acc[name]) acc[name] = [];
    acc[name].push(slot);
    return acc;
  }, {});
  const supplierNames = Object.keys(supplierGroups);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Schedule"
        subtitle="Manage vehicle branding appointments and assignments"
        count={displayed.length}
        action={
          <div className="flex gap-3 items-center">
            {selectedJobIDs.length > 0 && (
              <Button size="sm" onClick={openBulkAssign}>
                Assign {selectedJobIDs.length} Jobs
              </Button>
            )}
            <Select
              options={[{ value: '', label: 'All Statuses' }, ...JOB_STATUSES.map(s => ({ value: s, label: s }))]}
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setSelectedJobIDs([]); }}
              className="w-52 text-sm"
            />
          </div>
        }
      />

      <Table
        data={displayed as unknown as Record<string, unknown>[]}
        keyField="JobID"
        onSelect={filterStatus === 'Pending' || !filterStatus ? handleSelect : undefined}
        selectedKeys={selectedJobIDs}
        emptyMessage="No jobs found."
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
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-zinc-900">{String(r.DriverName)}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">[{shortID(String(r.DriverID))}]</span>
                </div>
                <span className="text-xs text-zinc-500">{String(r.DriverPhone)}</span>
              </div>
            )
          },
          { key: 'FleetType',   header: 'Fleet',     render: r => <FleetBadge fleet={String(r.FleetType)} /> },
          { key: 'CarBrand',    header: 'Brand',     className: 'text-zinc-500 text-xs truncate max-w-[80px]' },
          { key: 'CarModel',    header: 'Model',     className: 'text-zinc-500 text-xs truncate max-w-[100px]' },
          { key: 'Status',      header: 'Status',    render: r => <Badge status={String(r.Status)} /> },
          { key: 'SupplierName',header: 'Supplier',  className: 'text-zinc-500 text-xs truncate max-w-[120px]' },
          { key: 'AppointmentDate', header: 'Date',  render: r => <span className="text-zinc-500 text-xs">{formatDate(String(r.AppointmentDate))}</span> },
          { key: 'AppointmentTime', header: 'Time',  render: r => <span className="text-zinc-500 text-xs">{formatTime(String(r.AppointmentTime))}</span> },
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

      {/* Assign / Reschedule Modal — Supplier Accordion Design */}
      <Modal
        open={action === 'assign' || action === 'reschedule'}
        onClose={() => setAction(null)}
        title={action === 'reschedule' ? 'Reschedule Job' : (selected ? 'Assign Supplier Slot' : `Bulk Assign (${selectedJobIDs.length} Jobs)`)}
        description={selected ? `${selected.JobType} · ${selected.PlateNumber}` : ''}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAction(null)}>Cancel</Button>
            <Button loading={submitting} onClick={handleAssign} disabled={!selectedSlot}>
              Confirm Assignment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Job summary - only show for single job assignment */}
          {selected && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-sm">
              <Badge status={selected.Status} />
              <span className="text-zinc-600">{selected.DriverName} — {selected.DriverPhone}</span>
            </div>
          )}
          
          {msg && <p className="text-sm text-red-600 font-medium">{msg}</p>}

          {slotsLoading ? (
            <Spinner message="Loading available slots…" />
          ) : supplierNames.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <p className="text-sm font-medium">No available slots</p>
              <p className="text-xs mt-1">Create slots in Supplier Slot Management</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Select a Supplier</p>

              {supplierNames.map(supplierName => {
                const supplierSlots = supplierGroups[supplierName];
                const isExpanded = expandedSupplier === supplierName;
                const hasSelection = supplierSlots.some(s => s.SlotID === selectedSlot);

                return (
                  <div
                    key={supplierName}
                    className={`rounded-xl border-2 overflow-hidden transition-all duration-150 ${
                      hasSelection ? 'border-brand' : 'border-zinc-200'
                    }`}
                  >
                    <button
                      type="button"
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                        isExpanded ? 'bg-zinc-50' : 'bg-white hover:bg-zinc-50'
                      }`}
                      onClick={() => setExpandedSupplier(isExpanded ? null : supplierName)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-zinc-800">{supplierName}</span>
                        <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
                          {supplierSlots.length} slot{supplierSlots.length !== 1 ? 's' : ''}
                        </span>
                        {hasSelection && <span className="text-xs text-brand font-medium">Selected</span>}
                      </div>
                      <svg
                        className={`h-4 w-4 text-zinc-400 transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-zinc-100 divide-y divide-zinc-100">
                        {supplierSlots.map(slot => {
                          const avail = Number(slot.availableCapacity ?? 0);
                          const isFull = avail === 0;
                          const isSelected = selectedSlot === slot.SlotID;
                          return (
                            <label
                              key={slot.SlotID}
                              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                                isFull ? 'opacity-40 cursor-not-allowed bg-white' : isSelected ? 'bg-brand/5' : 'bg-white hover:bg-zinc-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="slot"
                                value={slot.SlotID}
                                checked={isSelected}
                                disabled={isFull}
                                onChange={() => setSelectedSlot(slot.SlotID)}
                                className="accent-brand"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-zinc-700">
                                  <span className="font-medium">{formatDate(slot.Date)}</span>
                                  <span className="text-zinc-400 mx-1">·</span>
                                  {formatTime(slot.Time)}
                                  <span className="text-zinc-400 mx-1">·</span>
                                  {slot.Area}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className={`text-sm font-bold ${isFull ? 'text-red-500' : 'text-emerald-600'}`}>
                                  {avail} left
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
