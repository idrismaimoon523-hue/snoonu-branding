'use client';

import { useEffect, useState } from 'react';
import { getSupplierSlots, createSupplierSlot, updateSupplierSlot, deleteSupplierSlot } from '@/lib/api';
import type { SupplierSlot } from '@/types';
import { formatDate, formatTime, shortID } from '@/lib/utils';
import { JOB_TYPES } from '@/lib/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import Table from '@/components/ui/Table';

interface SlotForm {
  date: string; time: string; jobType: string;
  maxCapacity: string; supplierName: string; area: string;
}

const EMPTY_FORM: SlotForm = { date: '', time: '', jobType: '', maxCapacity: '', supplierName: '', area: '' };

export default function AdminSlotsPage() {
  const [slots, setSlots]         = useState<SupplierSlot[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<SupplierSlot | null>(null);
  const [form, setForm]           = useState<SlotForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]             = useState('');
  const [errors, setErrors]       = useState<Partial<SlotForm>>({});

  function loadSlots() {
    getSupplierSlots()
      .then((res: unknown) => {
        const r = res as { success: boolean; slots?: SupplierSlot[] };
        if (r.success) setSlots(r.slots ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadSlots(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setMsg(''); setErrors({});
    setModalOpen(true);
  }

  function openEdit(slot: SupplierSlot) {
    setEditing(slot);
    setForm({
      date: String(slot.Date), time: String(slot.Time),
      jobType: slot.JobType, maxCapacity: String(slot.MaxCapacity),
      supplierName: slot.SupplierName, area: slot.Area,
    });
    setMsg(''); setErrors({});
    setModalOpen(true);
  }

  function validate(): boolean {
    const e: Partial<SlotForm> = {};
    if (!form.date)         e.date         = 'Required';
    if (!form.time)         e.time         = 'Required';
    if (!form.jobType)      e.jobType      = 'Required';
    if (!form.maxCapacity || parseInt(form.maxCapacity) < 1) e.maxCapacity = 'Must be ≥ 1';
    if (!form.supplierName) e.supplierName = 'Required';
    if (!form.area)         e.area         = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSubmitting(true); setMsg('');
    const res = editing
      ? await updateSupplierSlot(editing.SlotID, { ...form }) as { success: boolean; error?: string }
      : await createSupplierSlot({ ...form }) as { success: boolean; error?: string };
    if (res.success) { setModalOpen(false); loadSlots(); }
    else setMsg(res.error || 'Failed');
    setSubmitting(false);
  }

  async function handleDelete(slotID: string) {
    if (!confirm('Delete this slot?')) return;
    await deleteSupplierSlot(slotID);
    loadSlots();
  }

  const f = (k: keyof SlotForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Supplier Slot Management"
        subtitle="Create and manage supplier availability slots"
        count={slots.length}
        action={<Button onClick={openCreate}>+ Create Slot</Button>}
      />

      <Table
        data={slots as unknown as Record<string, unknown>[]}
        keyField="SlotID"
        emptyMessage="No slots created yet."
        columns={[
          { key: 'SlotID',          header: 'Slot ID',  render: r => <span className="font-mono text-xs text-zinc-500">{shortID(String(r.SlotID))}</span> },
          { key: 'SupplierName',    header: 'Supplier' },
          { key: 'Area',            header: 'Area' },
          { key: 'Date',            header: 'Date',     render: r => <span className="text-zinc-600 text-xs">{formatDate(String(r.Date))}</span> },
          { key: 'Time',            header: 'Time',     render: r => <span className="text-zinc-600 text-xs">{formatTime(String(r.Time))}</span> },
          { key: 'JobType',         header: 'Job Type' },
          { key: 'MaxCapacity',     header: 'Capacity' },
          { key: 'CurrentBookings', header: 'Booked' },
          {
            key: 'available',
            header: 'Available',
            render: r => {
              const avail = (parseInt(String(r.MaxCapacity)) || 0) - (parseInt(String(r.CurrentBookings)) || 0);
              const color = avail === 0 ? 'text-red-600' : avail <= 2 ? 'text-amber-600' : 'text-green-600';
              return <span className={`font-semibold ${color}`}>{avail}</span>;
            },
          },
          {
            key: 'actions',
            header: 'Actions',
            render: r => (
              <div className="flex gap-1">
                <Button size="sm" variant="secondary" onClick={() => openEdit(r as unknown as SupplierSlot)}>Edit</Button>
                <Button size="sm" variant="danger"    onClick={() => handleDelete(String(r.SlotID))}>Delete</Button>
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Slot' : 'Create Slot'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={submitting} onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          {msg && <p className="text-red-600 text-sm">{msg}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={form.date} onChange={f('date')} required error={errors.date} />
            <Input label="Time" type="time" value={form.time} onChange={f('time')} required error={errors.time} />
          </div>
          <Select
            label="Job Type"
            options={[...JOB_TYPES]}
            placeholder="Select job type"
            value={form.jobType}
            onChange={f('jobType')}
            required
            error={errors.jobType}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Supplier Name" value={form.supplierName} onChange={f('supplierName')} required error={errors.supplierName} />
            <Input label="Area"          value={form.area}         onChange={f('area')}         required error={errors.area} />
          </div>
          <Input
            label="Max Capacity"
            type="number"
            min={1}
            value={form.maxCapacity}
            onChange={f('maxCapacity')}
            required
            error={errors.maxCapacity}
          />
        </div>
      </Modal>
    </div>
  );
}
