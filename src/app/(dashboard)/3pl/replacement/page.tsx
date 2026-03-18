'use client';

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/auth';
import { getReplacementRequests, createReplacementRequest, getBrandedVehicles, getDriver } from '@/lib/api';
import type { ReplacementRequest, BrandedVehicle, Driver } from '@/types';
import { formatDate, shortID } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import Table from '@/components/ui/Table';

export default function ReplacementPage() {
  const [requests, setRequests]   = useState<ReplacementRequest[]>([]);
  const [vehicles, setVehicles]   = useState<BrandedVehicle[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [plateNumber, setPlateNumber]       = useState('');
  const [newDriverID, setNewDriverID]       = useState('');
  const [newDriverName, setNewDriverName]   = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [driverError, setDriverError]       = useState('');
  const [fetchingDriver, setFetchingDriver] = useState(false);

  const user = getUser();

  function loadData() {
    if (!user) return;
    Promise.all([
      getReplacementRequests(user.companyCode, '3PL'),
      getBrandedVehicles({ companyCode: user.companyCode, role: '3PL' }),
    ]).then(([rr, bv]) => {
      const r1 = rr as { success: boolean; requests?: ReplacementRequest[] };
      const r2 = bv as { success: boolean; vehicles?: BrandedVehicle[] };
      if (r1.success) setRequests(r1.requests ?? []);
      if (r2.success) setVehicles(r2.vehicles ?? []);
    }).catch(() => setError('Network error')).finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []); // eslint-disable-line

  async function fetchNewDriver() {
    if (!newDriverID.trim()) return;
    setFetchingDriver(true);
    setDriverError('');
    try {
      const res = await getDriver(newDriverID.trim()) as { success: boolean; error?: string; driver?: Driver };
      if (!res.success || !res.driver) {
        setDriverError(res.error || 'Driver not found');
        setNewDriverName(''); setNewDriverPhone('');
      } else {
        // Restrict to own company drivers
        if (res.driver.companyCode !== user?.companyCode) {
          setDriverError('This driver does not belong to your company.');
          setNewDriverName(''); setNewDriverPhone('');
        } else {
          setNewDriverName(res.driver.driverName);
          setNewDriverPhone(res.driver.driverPhone);
        }
      }
    } catch { setDriverError('Error fetching driver'); }
    finally { setFetchingDriver(false); }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setSuccessMsg(''); setError('');
    if (!plateNumber) { setError('Please select a vehicle'); return; }
    if (!newDriverID || !newDriverName) { setError('Please fetch a valid new driver'); return; }
    if (driverError) { setError('Please resolve the driver error before submitting'); return; }
    setSubmitting(true);
    try {
      const res = await createReplacementRequest({
        plateNumber, newDriverID, newDriverName, newDriverPhone,
        companyCode: user?.companyCode,
      }) as { success: boolean; error?: string };
      if (!res.success) { setError(res.error || 'Failed'); }
      else {
        setSuccessMsg('Replacement request submitted!');
        setModalOpen(false);
        setPlateNumber(''); setNewDriverID(''); setNewDriverName(''); setNewDriverPhone('');
        loadData();
      }
    } catch { setError('Network error'); }
    finally { setSubmitting(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Replacement Requests"
        subtitle="Transfer a branded vehicle to a new driver"
        count={requests.length}
        action={
          <Button onClick={() => { setModalOpen(true); setError(''); setSuccessMsg(''); }}>
            + New Replacement
          </Button>
        }
      />

      {successMsg && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          ✅ {successMsg}
        </div>
      )}

      <Table
        data={requests as unknown as Record<string, unknown>[]}
        keyField="ReplacementID"
        emptyMessage="No replacement requests yet."
        columns={[
          { key: 'ReplacementID', header: 'ID',          render: r => <span className="font-mono text-xs text-zinc-500">{shortID(String(r.ReplacementID))}</span> },
          { key: 'PlateNumber',   header: 'Plate No.',   className: 'font-medium' },
          { key: 'OldDriverID',   header: 'Old Driver ID' },
          { key: 'OldDriverName', header: 'Old Driver' },
          { key: 'NewDriverID',   header: 'New Driver ID' },
          { key: 'NewDriverName', header: 'New Driver' },
          { key: 'RequestedAt',   header: 'Requested',   render: r => <span className="text-zinc-500 text-xs">{formatDate(String(r.RequestedAt))}</span> },
          { key: 'Status',        header: 'Status',      render: r => <Badge status={String(r.Status)} /> },
          { key: 'ReviewedAt',    header: 'Reviewed',    render: r => <span className="text-zinc-500 text-xs">{formatDate(String(r.ReviewedAt))}</span> },
        ]}
      />

      {/* Create Replacement Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Replacement Request"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={submitting} onClick={() => handleSubmit()}>Submit</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-1.5">
              Select Branded Vehicle <span className="text-brand">*</span>
            </label>
            <select
              className="flex h-9 w-full appearance-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand hover:border-zinc-300"
              value={plateNumber}
              onChange={e => setPlateNumber(e.target.value)}
              required
            >
              <option value="">Select a vehicle…</option>
              {vehicles.map(v => (
                <option key={v.PlateNumber} value={v.PlateNumber}>
                  {v.PlateNumber} — {v.DriverName} ({v.CarBrand} {v.CarModel})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                label="New Driver ID"
                placeholder="e.g. DRV002"
                value={newDriverID}
                onChange={e => { setNewDriverID(e.target.value); setDriverError(''); }}
                onBlur={fetchNewDriver}
                required
              />
            </div>
            <Button type="button" variant="secondary" onClick={fetchNewDriver} loading={fetchingDriver} className="mb-[1px]">
              Fetch
            </Button>
          </div>
          {driverError && <p className="text-xs text-red-600">{driverError}</p>}

          <div className="grid grid-cols-2 gap-3">
            <Input label="New Driver Name"  value={newDriverName}  readOnly placeholder="Auto-filled" />
            <Input label="New Driver Phone" value={newDriverPhone} readOnly placeholder="Auto-filled" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
