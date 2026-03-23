/**
 * All API calls go through our Next.js API route (/api/appscript)
 * which proxies to the Apps Script Web App (avoids CORS issues).
 */
export async function call<T = Record<string, unknown>>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch('/api/appscript', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) throw new Error('Network error: ' + res.status);
  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────
export const authenticate = (companyCode: string, phone: string) =>
  call('authenticate', { companyCode, phone });

// ── Driver ───────────────────────────────────────────────────
export const getDriver = (driverID: string) =>
  call('getDriver', { driverID });

// ── Requests ─────────────────────────────────────────────────
export const createRequest = (data: Record<string, unknown>) =>
  call('createRequest', data);

export const getRequests = (companyCode: string, role: string) =>
  call('getRequests', { companyCode, role });

// ── Schedule Jobs ─────────────────────────────────────────────
export const getScheduleJobs = (filters: Record<string, unknown>) =>
  call('getScheduleJobs', filters);

export const assignSupplierSlot = (jobID: string, slotID: string) =>
  call('assignSupplierSlot', { jobID, slotID });

export const rescheduleJob = (jobID: string, slotID: string) =>
  call('rescheduleJob', { jobID, slotID });

export const rejectJob = (jobID: string, reason?: string) =>
  call('rejectJob', { jobID, reason });

export const verifyUpload = (
  jobID: string,
  approved: boolean,
  notes?: string,
  adminCode?: string,
) => call('verifyUpload', { jobID, approved, notes, adminCode });

// ── Supplier ──────────────────────────────────────────────────
export const uploadImages = (data: Record<string, unknown>) =>
  call('uploadImages', data);

export const uploadImagesBase64 = (data: Record<string, unknown>) =>
  call('uploadImagesBase64', data);

export const markDidNotAppear = (jobID: string) =>
  call('markDidNotAppear', { jobID });

export const getSupplierJobs = (supplierName: string) =>
  call('getSupplierJobs', { supplierName });

export const getSupplierUploads = (jobID?: string) =>
  call('getSupplierUploads', { jobID });

export const getSupplierBranded = (supplierName: string) =>
  call('getSupplierBranded', { supplierName });

// ── Slots ─────────────────────────────────────────────────────
export const getSupplierSlots = (filters?: Record<string, unknown>) =>
  call('getSupplierSlots', filters || {});

export const getAvailableSlots = (date?: string, jobType?: string) =>
  call('getAvailableSlots', { date, jobType });

export const createSupplierSlot = (data: Record<string, unknown>) =>
  call('createSupplierSlot', data);

export const updateSupplierSlot = (slotID: string, data: Record<string, unknown>) =>
  call('updateSupplierSlot', { slotID, ...data });

export const deleteSupplierSlot = (slotID: string) =>
  call('deleteSupplierSlot', { slotID });

// ── Branded / Sticker Removed ─────────────────────────────────
export const getBrandedVehicles = (filters?: Record<string, unknown>) =>
  call('getBrandedVehicles', filters || {});

export const getStickerRemoved = (filters?: Record<string, unknown>) =>
  call('getStickerRemoved', filters || {});

// ── Replacement Requests ──────────────────────────────────────
export const createReplacementRequest = (data: Record<string, unknown>) =>
  call('createReplacementRequest', data);

export const getReplacementRequests = (companyCode: string, role: string) =>
  call('getReplacementRequests', { companyCode, role });

export const reviewReplacement = (
  replacementID: string,
  approved: boolean,
  adminCode?: string,
) => call('reviewReplacement', { replacementID, approved, adminCode });

// ── Image helpers ─────────────────────────────────────────────
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g. "data:image/jpeg;base64,")
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
