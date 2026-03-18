'use client';

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/auth';
import { getReplacementRequests, reviewReplacement } from '@/lib/api';
import type { ReplacementRequest } from '@/types';
import { formatDate, shortID } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import Table from '@/components/ui/Table';

export default function AdminDriverReplacementPage() {
  const [requests, setRequests] = useState<ReplacementRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<ReplacementRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]           = useState('');

  function loadData() {
    getReplacementRequests('', 'Admin')
      .then((res: unknown) => {
        const r = res as { success: boolean; requests?: ReplacementRequest[] };
        if (r.success) setRequests(r.requests ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  async function handleReview(approved: boolean) {
    if (!selected) return;
    const user = getUser();
    setSubmitting(true); setMsg('');
    const res = await reviewReplacement(selected.ReplacementID, approved, user?.companyCode) as { success: boolean; error?: string };
    if (res.success) { setSelected(null); loadData(); }
    else setMsg(res.error || 'Failed');
    setSubmitting(false);
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Driver Replacement" subtitle="Review and approve driver transfer requests" count={requests.length} />

      <Table
        data={requests as unknown as Record<string, unknown>[]}
        keyField="ReplacementID"
        emptyMessage="No replacement requests."
        columns={[
          { key: 'ReplacementID', header: 'ID',            render: r => <span className="font-mono text-xs text-zinc-500">{shortID(String(r.ReplacementID))}</span> },
          { key: 'PlateNumber',   header: 'Plate No.',     className: 'font-medium' },
          { key: 'CompanyCode',   header: 'Company' },
          { key: 'OldDriverID',   header: 'Old Driver ID' },
          { key: 'OldDriverName', header: 'Old Driver' },
          { key: 'NewDriverID',   header: 'New Driver ID' },
          { key: 'NewDriverName', header: 'New Driver' },
          { key: 'RequestedAt',   header: 'Requested',     render: r => <span className="text-zinc-500 text-xs">{formatDate(String(r.RequestedAt))}</span> },
          { key: 'Status',        header: 'Status',        render: r => <Badge status={String(r.Status)} /> },
          {
            key: 'review',
            header: 'Action',
            render: r => {
              const req = r as unknown as ReplacementRequest;
              if (req.Status !== 'Pending') return <span className="text-zinc-300 text-xs">—</span>;
              return (
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => { setSelected(req); setMsg(''); }}>Review</Button>
                </div>
              );
            },
          },
        ]}
      />

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Review Replacement Request"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
            <Button variant="danger"    loading={submitting} onClick={() => handleReview(false)}>Reject</Button>
            <Button                     loading={submitting} onClick={() => handleReview(true)}>Approve</Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-3 text-sm">
            {msg && <p className="text-red-600">{msg}</p>}
            <div className="bg-zinc-50 rounded-lg border border-zinc-200 p-4 space-y-1">
              <p><strong>Plate Number:</strong> {selected.PlateNumber}</p>
              <p><strong>Company:</strong> {selected.CompanyCode}</p>
              <p><strong>Requested:</strong> {formatDate(selected.RequestedAt)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 rounded-lg p-3">
                <p className="font-semibold text-red-700 mb-1 text-xs uppercase tracking-wide">Current Driver</p>
                <p>{selected.OldDriverName}</p>
                <p className="text-zinc-500">{selected.OldDriverID}</p>
                <p className="text-zinc-500">{selected.OldDriverPhone}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="font-semibold text-green-700 mb-1 text-xs uppercase tracking-wide">New Driver</p>
                <p>{selected.NewDriverName}</p>
                <p className="text-zinc-500">{selected.NewDriverID}</p>
                <p className="text-zinc-500">{selected.NewDriverPhone}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
