'use client';

import { useState, useEffect } from 'react';
import { getUser } from '@/lib/auth';
import { getDriver, createRequest, getBrandedVehicles } from '@/lib/api';
import { CAR_BRANDS, CAR_MODELS, FLEET_TYPES, REQUEST_TYPES, MIN_CAR_YEAR, CURRENT_YEAR } from '@/lib/constants';
import type { AuthUser, Driver, BrandedVehicle } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';

const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - MIN_CAR_YEAR + 1 }, (_, i) =>
  String(CURRENT_YEAR - i),
);

interface FormState {
  requestType: string; driverID: string; driverName: string; driverPhone: string;
  companyCode: string; companyName: string; fleetType: string; plateNumber: string;
  carBrand: string; carModel: string; carYear: string;
}
const EMPTY: FormState = {
  requestType: '', driverID: '', driverName: '', driverPhone: '',
  companyCode: '', companyName: '', fleetType: '', plateNumber: '',
  carBrand: '', carModel: '', carYear: '',
};

export default function RequestPage() {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [form, setForm]       = useState<FormState>(EMPTY);
  const [errors, setErrors]   = useState<Partial<FormState>>({});
  const [fetchingDriver, setFetchingDriver] = useState(false);
  const [driverError, setDriverError]       = useState('');
  const [submitting, setSubmitting]         = useState(false);
  const [successMsg, setSuccessMsg]         = useState('');
  const [apiError, setApiError]             = useState('');
  const [plateCheckError, setPlateCheckError] = useState('');
  const [checkingPlate, setCheckingPlate]   = useState(false);

  useEffect(() => {
    const u = getUser();
    if (u) { setUser(u); setForm(f => ({ ...f, companyCode: u.companyCode, companyName: u.companyName })); }
  }, []);

  async function fetchDriver() {
    if (!form.driverID.trim()) return;
    setFetchingDriver(true); setDriverError('');
    try {
      const res = await getDriver(form.driverID.trim()) as { success: boolean; error?: string; driver?: Driver };
      if (!res.success || !res.driver) {
        setDriverError(res.error || 'Driver not found');
        setForm(f => ({ ...f, driverName: '', driverPhone: '' }));
      } else {
        // Restrict to own company drivers
        if (res.driver.companyCode !== user?.companyCode) {
          setDriverError('This driver does not belong to your company.');
          setForm(f => ({ ...f, driverName: '', driverPhone: '' }));
        } else {
          setForm(f => ({ ...f, driverName: res.driver!.driverName, driverPhone: res.driver!.driverPhone }));
        }
      }
    } catch { setDriverError('Error fetching driver'); }
    finally { setFetchingDriver(false); }
  }

  async function checkPlateDuplicate() {
    if (!form.plateNumber.trim() || !form.requestType) return;
    // Only check duplicates for "New Branding Request"
    if (form.requestType !== 'New Branding Request') {
      setPlateCheckError('');
      return;
    }
    setCheckingPlate(true);
    setPlateCheckError('');
    try {
      const res = await getBrandedVehicles({ role: 'Admin' }) as { success: boolean; vehicles?: BrandedVehicle[] };
      if (res.success && res.vehicles) {
        const match = res.vehicles.find(
          v => String(v.PlateNumber).trim().toLowerCase() === form.plateNumber.trim().toLowerCase()
        );
        if (match) {
          // 3PL sees full details
          setPlateCheckError(
            `Duplicate: This plate is already branded — Driver: ${match.DriverName}, Company: ${match.CompanyName}, Vehicle: ${match.CarBrand} ${match.CarModel}`
          );
        }
      }
    } catch { /* silently ignore plate check errors */ }
    finally { setCheckingPlate(false); }
  }

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.requestType) e.requestType = 'Required';
    if (!form.driverID)    e.driverID    = 'Required';
    if (!form.driverName)  e.driverName  = 'Enter a valid Driver ID first';
    if (!form.fleetType)   e.fleetType   = 'Required';
    if (!form.plateNumber) e.plateNumber = 'Required';
    else if (!form.plateNumber.includes('/')) e.plateNumber = 'Must contain "/"';
    if (!form.carBrand) e.carBrand = 'Required';
    if (!form.carModel) e.carModel = 'Required';
    if (!form.carYear)  e.carYear  = 'Required';
    else if (parseInt(form.carYear) < MIN_CAR_YEAR) e.carYear = `Must be ${MIN_CAR_YEAR} or above`;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg(''); setApiError('');
    if (plateCheckError) return; // block if duplicate detected
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await createRequest({ ...form }) as { success: boolean; requestID?: string; jobID?: string; error?: string };
      if (!res.success) { setApiError(res.error || 'Submission failed'); }
      else {
        setSuccessMsg(`Request submitted successfully! Request ID: ${res.requestID}`);
        setForm({ ...EMPTY, companyCode: user?.companyCode || '', companyName: user?.companyName || '' });
        setErrors({});
        setPlateCheckError('');
      }
    } catch { setApiError('Network error. Please try again.'); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="New Request"
        subtitle="Submit a branding or sticker removal request for your fleet"
      />

      {successMsg && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <svg className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" />
          </svg>
          <p className="text-sm text-emerald-700 font-medium">{successMsg}</p>
        </div>
      )}

      {apiError && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <svg className="h-4 w-4 text-red-500 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0V5zm.75 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="space-y-6">
          {/* Request Type */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Request Details</p>
            <Select
              label="Request Type"
              options={REQUEST_TYPES}
              placeholder="Select request type…"
              value={form.requestType}
              onChange={e => {
                setForm(f => ({ ...f, requestType: e.target.value }));
                setPlateCheckError('');
              }}
              required
              error={errors.requestType}
            />
          </div>

          <div className="border-t border-zinc-100 pt-5">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Driver Information</p>

            <div className="flex gap-2 items-end mb-4">
              <div className="flex-1">
                <Input
                  label="Driver ID"
                  placeholder="e.g. DRV001"
                  value={form.driverID}
                  onChange={e => { setForm(f => ({ ...f, driverID: e.target.value })); setDriverError(''); }}
                  onBlur={fetchDriver}
                  required
                  error={errors.driverID}
                />
              </div>
              <Button type="button" variant="secondary" size="md" onClick={fetchDriver} loading={fetchingDriver}>
                Fetch
              </Button>
            </div>

            {driverError && (
              <p className="text-xs text-red-600 -mt-2 mb-3 flex items-center gap-1">
                <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0V5zm.75 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                {driverError}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input label="Driver Name"    value={form.driverName}  readOnly placeholder="Auto-filled" error={errors.driverName} />
              <Input label="Driver Phone"   value={form.driverPhone} readOnly placeholder="Auto-filled" />
              <Input label="Company Code"   value={form.companyCode} readOnly />
              <Input label="Company Name"   value={form.companyName} readOnly />
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-5">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Vehicle Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Fleet Type" options={FLEET_TYPES} placeholder="Select…" value={form.fleetType}
                onChange={e => setForm(f => ({ ...f, fleetType: e.target.value }))} required error={errors.fleetType} />
              <div>
                <Input label="Plate Number"
                  placeholder={form.fleetType === 'Bike' ? '7/1298' : '11/11111'}
                  value={form.plateNumber}
                  onChange={e => { setForm(f => ({ ...f, plateNumber: e.target.value })); setPlateCheckError(''); }}
                  onBlur={checkPlateDuplicate}
                  required hint='Must contain "/" e.g. 11/11111' error={errors.plateNumber} />
                {checkingPlate && <p className="text-xs text-zinc-400 mt-1">Checking plate…</p>}
                {plateCheckError && (
                  <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                    <svg className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0V5zm.75 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                    <p className="text-xs text-red-700">{plateCheckError}</p>
                  </div>
                )}
              </div>
              <Select label="Car Brand" options={CAR_BRANDS} placeholder="Select brand…" value={form.carBrand}
                onChange={e => setForm(f => ({ ...f, carBrand: e.target.value }))} required error={errors.carBrand} />
              <Select label="Car Model" options={CAR_MODELS} placeholder="Select model…" value={form.carModel}
                onChange={e => setForm(f => ({ ...f, carModel: e.target.value }))} required error={errors.carModel} />
              <Select label="Car Year" options={YEAR_OPTIONS} placeholder="Select year…" value={form.carYear}
                onChange={e => setForm(f => ({ ...f, carYear: e.target.value }))} required error={errors.carYear} />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-zinc-100">
            <Button type="submit" size="lg" loading={submitting} disabled={!!plateCheckError}>
              Submit Request
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
