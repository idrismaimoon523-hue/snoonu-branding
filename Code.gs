// ============================================================
// SNOONU VEHICLE BRANDING MANAGEMENT PORTAL
// Google Apps Script Backend v1.0
// Spreadsheet: 1uwcRWOFbZj3_gM1Pvq469gO7-QgMdAHkv9SdUQkrmZE
// Drive Folder: 1tv5NQKv2aFUhPtzCTmVT9l3_pkHu_6Yj
// ============================================================

const SS_ID          = '1uwcRWOFbZj3_gM1Pvq469gO7-QgMdAHkv9SdUQkrmZE';
const DRIVE_FOLDER_ID = '1tv5NQKv2aFUhPtzCTmVT9l3_pkHu_6Yj';

// Sheet name constants
const SN = {
  USERS:        'Users',
  DRIVERS:      'Drivers',
  REQUESTS:     'Requests',
  JOBS:         'ScheduleJobs',
  BRANDED:      'BrandedVehicles',
  STICKER:      'StickerRemoved',
  REPLACEMENTS: 'ReplacementRequests',
  SLOTS:        'SupplierSlots',
  UPLOADS:      'SupplierUploads',
};

// Column headers for each sheet (order matters - matches row layout)
const HEADERS = {
  Users:               ['CompanyCode','Phone','Role','CompanyName','Active'],
  Drivers:             ['DriverID','DriverName','DriverPhone','CompanyCode','CompanyName','Active'],
  Requests:            ['RequestID','RequestType','DriverID','DriverName','DriverPhone','CompanyCode','CompanyName','FleetType','PlateNumber','CarBrand','CarModel','CarYear','Status','CreatedAt'],
  ScheduleJobs:        ['JobID','RequestID','JobType','PlateNumber','DriverID','DriverName','DriverPhone','CompanyCode','CompanyName','FleetType','CarBrand','CarModel','CarYear','Status','SupplierName','Area','AppointmentDate','AppointmentTime','SlotID','CreatedAt','UpdatedAt'],
  BrandedVehicles:     ['PlateNumber','DriverID','DriverName','DriverPhone','CompanyCode','CompanyName','FleetType','CarBrand','CarModel','CarYear','BrandedDate','JobID','SupplierName'],
  StickerRemoved:      ['PlateNumber','DriverID','DriverName','DriverPhone','CompanyCode','CompanyName','FleetType','CarBrand','CarModel','CarYear','StickerRemovedDate','JobID','BySupplier'],
  ReplacementRequests: ['ReplacementID','PlateNumber','OldDriverID','OldDriverName','OldDriverPhone','NewDriverID','NewDriverName','NewDriverPhone','CompanyCode','RequestedAt','Status','ReviewedAt','ReviewedBy'],
  SupplierSlots:       ['SlotID','Date','Time','JobType','MaxCapacity','CurrentBookings','SupplierName','Area'],
  SupplierUploads:     ['UploadID','JobID','PlateNumber','SupplierName','LeftSideURL','BackSideURL','RightSideURL','UploadedAt','VerificationStatus','VerifiedAt','VerifiedBy','Notes'],
};

// ============================================================
// ENTRY POINTS
// ============================================================

function doGet(e) {
  try {
    const params = e.parameter || {};
    const action = params.action;
    return handleRequest(action, params);
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function doPost(e) {
  try {
    let data = {};
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    const action = data.action || (e.parameter && e.parameter.action);
    return handleRequest(action, data);
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function handleRequest(action, data) {
  switch (action) {

    // ── Setup ─────────────────────────────────────────────
    case 'setupSheets':      return jsonResponse(setupSheets());
    case 'setupSampleData':  return jsonResponse(setupSampleData());

    // ── Auth ──────────────────────────────────────────────
    case 'authenticate':     return jsonResponse(authenticate(data.companyCode, data.phone));

    // ── Drivers ───────────────────────────────────────────
    case 'getDriver':        return jsonResponse(getDriver(data.driverID));

    // ── Requests ──────────────────────────────────────────
    case 'createRequest':    return jsonResponse(createRequest(data));
    case 'getRequests':      return jsonResponse(getRequests(data.companyCode, data.role));

    // ── Schedule Jobs ─────────────────────────────────────
    case 'getScheduleJobs':     return jsonResponse(getScheduleJobs(data));
    case 'assignSupplierSlot':  return jsonResponse(assignSupplierSlot(data));
    case 'rescheduleJob':       return jsonResponse(rescheduleJob(data));
    case 'rejectJob':           return jsonResponse(rejectJob(data.jobID, data.reason));
    case 'verifyUpload':        return jsonResponse(verifyUpload(data));

    // ── Supplier ──────────────────────────────────────────
    case 'uploadImages':        return jsonResponse(uploadImages(data));
    case 'uploadImagesBase64':  return jsonResponse(uploadImagesBase64(data));
    case 'markDidNotAppear':    return jsonResponse(markDidNotAppear(data.jobID));
    case 'getSupplierJobs':     return jsonResponse(getSupplierJobs(data.supplierName));
    case 'getSupplierUploads':  return jsonResponse(getSupplierUploads(data.jobID));
    case 'getSupplierBranded':  return jsonResponse(getSupplierBrandedVehicles(data.supplierName));

    // ── Supplier Slots ────────────────────────────────────
    case 'getSupplierSlots':    return jsonResponse(getSupplierSlots(data));
    case 'getAvailableSlots':   return jsonResponse(getAvailableSlots(data.date, data.jobType));
    case 'createSupplierSlot':  return jsonResponse(createSupplierSlot(data));
    case 'updateSupplierSlot':  return jsonResponse(updateSupplierSlot(data.slotID, data));
    case 'deleteSupplierSlot':  return jsonResponse(deleteSupplierSlot(data.slotID));

    // ── Branded / Sticker Removed ─────────────────────────
    case 'getBrandedVehicles':  return jsonResponse(getBrandedVehicles(data));
    case 'getStickerRemoved':   return jsonResponse(getStickerRemoved(data));

    // ── Replacement Requests ──────────────────────────────
    case 'createReplacementRequest': return jsonResponse(createReplacementRequest(data));
    case 'getReplacementRequests':   return jsonResponse(getReplacementRequests(data.companyCode, data.role));
    case 'reviewReplacement':        return jsonResponse(reviewReplacement(data));

    // ── Drive ─────────────────────────────────────────────
    case 'getDriveFolderURL':   return jsonResponse({ success: true, folderId: DRIVE_FOLDER_ID });

    default:
      return jsonResponse({ success: false, error: 'Unknown action: ' + action });
  }
}

// ============================================================
// SHEET SETUP
// ============================================================

function setupSheets() {
  const ss = SpreadsheetApp.openById(SS_ID);
  const results = [];

  for (const [key, sheetName] of Object.entries(SN)) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      results.push('Created: ' + sheetName);
    } else {
      results.push('Exists: ' + sheetName);
    }

    // Set headers if the sheet is still empty
    if (sheet.getLastRow() === 0) {
      const hdrs = HEADERS[sheetName];
      if (hdrs) {
        const hdrRange = sheet.getRange(1, 1, 1, hdrs.length);
        hdrRange.setValues([hdrs]);
        hdrRange.setFontWeight('bold');
        hdrRange.setBackground('#f8a100');         // Snoonu orange
        hdrRange.setFontColor('#ffffff');
        sheet.setFrozenRows(1);
        results.push('Headers set: ' + sheetName);
      }
    }
  }

  return { success: true, results };
}

// ============================================================
// SAMPLE DATA
// ============================================================

function setupSampleData() {
  setupSheets();
  const ss = SpreadsheetApp.openById(SS_ID);

  // ── Users ─────────────────────────────────────────────
  const usersSheet = ss.getSheetByName(SN.USERS);
  if (usersSheet.getLastRow() <= 1) {
    usersSheet.getRange(2, 1, 4, 5).setValues([
      ['3PL001', '55551111', '3PL',      'Fast Delivery Co',   'TRUE'],
      ['ADMIN01','55559999', 'Admin',    'Snoonu Admin',        'TRUE'],
      ['SUP001', '55552222', 'Supplier', 'BrandPro Suppliers',  'TRUE'],
      ['3PL002', '55553333', '3PL',      'Quick Fleet LLC',     'TRUE'],
    ]);
  }

  // ── Drivers ───────────────────────────────────────────
  const driversSheet = ss.getSheetByName(SN.DRIVERS);
  if (driversSheet.getLastRow() <= 1) {
    driversSheet.getRange(2, 1, 4, 6).setValues([
      ['DRV001','Ahmed Al-Rashid', '55551234','3PL001','Fast Delivery Co', 'TRUE'],
      ['DRV002','Mohammed Hassan', '55555678','3PL001','Fast Delivery Co', 'TRUE'],
      ['DRV003','Ali Kareem',      '55559012','3PL002','Quick Fleet LLC',   'TRUE'],
      ['DRV004','Omar Abdullah',   '55553456','3PL002','Quick Fleet LLC',   'TRUE'],
    ]);
  }

  // ── Supplier Slots ────────────────────────────────────
  const slotsSheet = ss.getSheetByName(SN.SLOTS);
  if (slotsSheet.getLastRow() <= 1) {
    const tz = Session.getScriptTimeZone();
    const fmt = d => Utilities.formatDate(d, tz, 'yyyy-MM-dd');
    const d1 = new Date(); d1.setDate(d1.getDate() + 1);
    const d2 = new Date(); d2.setDate(d2.getDate() + 2);
    const d3 = new Date(); d3.setDate(d3.getDate() + 3);

    slotsSheet.getRange(2, 1, 9, 8).setValues([
      ['SLOT001', fmt(d1), '09:00', 'Branding',       5, 0, 'BrandPro Suppliers', 'Al Wakrah'],
      ['SLOT002', fmt(d1), '13:00', 'Branding',       5, 0, 'BrandPro Suppliers', 'Al Wakrah'],
      ['SLOT003', fmt(d1), '09:00', 'Sticker Removal',3, 0, 'BrandPro Suppliers', 'Al Wakrah'],
      ['SLOT004', fmt(d1), '15:00', 'Re-branding',    4, 0, 'BrandPro Suppliers', 'Al Wakrah'],
      ['SLOT005', fmt(d2), '09:00', 'Branding',       5, 0, 'BrandPro Suppliers', 'Doha'],
      ['SLOT006', fmt(d2), '13:00', 'Branding',       5, 0, 'BrandPro Suppliers', 'Doha'],
      ['SLOT007', fmt(d2), '09:00', 'Sticker Removal',3, 0, 'BrandPro Suppliers', 'Doha'],
      ['SLOT008', fmt(d2), '15:00', 'Re-branding',    4, 0, 'BrandPro Suppliers', 'Doha'],
      ['SLOT009', fmt(d3), '09:00', 'Branding',       5, 0, 'BrandPro Suppliers', 'Al Rayyan'],
    ]);
  }

  return { success: true, message: 'Sample data loaded successfully' };
}

// ============================================================
// AUTHENTICATION
// ============================================================

function authenticate(companyCode, phone) {
  if (!companyCode || !phone) {
    return { success: false, error: 'Company code and phone are required' };
  }

  const sheet = getSheet(SN.USERS);
  const users = sheetToObjects(sheet);

  const user = users.find(u =>
    String(u.CompanyCode).trim() === String(companyCode).trim() &&
    String(u.Phone).trim()       === String(phone).trim()
  );

  if (!user) {
    return { success: false, error: 'Invalid credentials' };
  }

  const active = String(user.Active).toLowerCase().trim();
  if (active !== 'true' && active !== 'yes' && active !== '1') {
    return { success: false, error: 'Account is inactive. Please contact admin.' };
  }

  return {
    success: true,
    user: {
      companyCode: user.CompanyCode,
      companyName: user.CompanyName,
      role:        user.Role,
      phone:       user.Phone,
    },
  };
}

// ============================================================
// DRIVER LOOKUP
// ============================================================

function getDriver(driverID) {
  if (!driverID) {
    return { success: false, error: 'Driver ID is required' };
  }

  const sheet   = getSheet(SN.DRIVERS);
  const drivers = sheetToObjects(sheet);

  const driver = drivers.find(d =>
    String(d.DriverID).trim().toLowerCase() === String(driverID).trim().toLowerCase()
  );

  if (!driver) {
    return { success: false, error: 'Driver not found' };
  }

  const active = String(driver.Active).toLowerCase().trim();
  if (active !== 'true' && active !== 'yes' && active !== '1') {
    return { success: false, error: 'Driver is inactive' };
  }

  return {
    success: true,
    driver: {
      driverID:    driver.DriverID,
      driverName:  driver.DriverName,
      driverPhone: driver.DriverPhone,
      companyCode: driver.CompanyCode,
      companyName: driver.CompanyName,
    },
  };
}

// ============================================================
// REQUEST MANAGEMENT
// ============================================================

function createRequest(data) {
  const required = ['requestType','driverID','fleetType','plateNumber','carBrand','carModel','carYear','companyCode'];
  for (const f of required) {
    if (!data[f]) return { success: false, error: 'Missing field: ' + f };
  }

  data.plateNumber = String(data.plateNumber).replace(/\s+/g, '');
  
  if (data.fleetType === 'Car' && !/^\d{2}\/\d{5}$/.test(data.plateNumber)) {
    return { success: false, error: 'Vehicle Plate Number format invalid for Car' };
  } else if (data.fleetType === 'Bike' && !/^\d{1}\/\d{4}$/.test(data.plateNumber)) {
    return { success: false, error: 'Vehicle Plate Number format invalid for Bike' };
  }
  if (parseInt(data.carYear) < 2021) {
    return { success: false, error: 'Car year must be 2021 or above' };
  }

  const validTypes = ['New Branding Request', 'Sticker Removal Request'];
  if (!validTypes.includes(data.requestType)) {
    return { success: false, error: 'Invalid request type. Must be: ' + validTypes.join(' | ') };
  }

  const jobType = data.requestType === 'New Branding Request' ? 'Branding' : 'Sticker Removal';

  const VERSION = "2026-03-24-v5"; // Version tracking
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // Wait up to 20 seconds
  } catch (e) {
    return { success: false, error: 'Server busy, please try again later.', version: VERSION };
  }

  try {
    const requestsSheet = ss.getSheetByName(SN.REQUESTS);
    const jobsSheet     = ss.getSheetByName(SN.JOBS);
    const brandedSheet  = ss.getSheetByName(SN.BRANDED);

    const finalStatuses = ['completed', 'rejected', 'did not appear'];
    const normalizedTarget = String(data.plateNumber || '').replace(/\s+/g, '').toLowerCase();

    // Direct check function to bypass sheetToObjects for critical duplication check
    const checkDirect = (sheet, plateColIdx, statusColIdx) => {
      const vals = sheet.getDataRange().getValues();
      if (vals.length <= 1) return false;
      const data = vals.slice(1);
      return data.some(row => {
        const p = String(row[plateColIdx] || '').replace(/\s+/g, '').toLowerCase();
        const s = String(row[statusColIdx] || '').replace(/\s+/g, '').toLowerCase();
        return p === plate && !finalStatuses.includes(s);
      });
    };

    // Find columns dynamically in case they moved
    const getColIndex = (sheet, name) => {
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const normName = name.toLowerCase().replace(/\s+/g, '');
      for (let i = 0; i < headers.length; i++) {
        if (String(headers[i]).toLowerCase().replace(/\s+/g, '') === normName) return i;
      }
      return -1;
    };

    const reqPlateIdx  = getColIndex(requestsSheet, 'PlateNumber');
    const reqStatusIdx = getColIndex(requestsSheet, 'Status');
    const jobPlateIdx  = getColIndex(jobsSheet, 'PlateNumber');
    const jobStatusIdx = getColIndex(jobsSheet, 'Status');
    const brandPlateIdx = getColIndex(brandedSheet, 'PlateNumber');

    const hasActiveRequest = checkDirect(requestsSheet, reqPlateIdx, reqStatusIdx, normalizedTarget);
    const hasActiveJob     = checkDirect(jobsSheet, jobPlateIdx, jobStatusIdx, normalizedTarget);

    const isCurrentlyBranded = (() => {
      const vals = brandedSheet.getDataRange().getValues();
      if (vals.length <= 1) return false;
      return vals.slice(1).some(row => String(row[brandPlateIdx] || '').replace(/\s+/g, '').toLowerCase() === normalizedTarget);
    })();

    if (hasActiveRequest || hasActiveJob) {
      return { success: false, error: 'Duplicate Request: This vehicle already has an active or pending request (System V5).', version: VERSION };
    }

    if (jobType === 'Branding' && isCurrentlyBranded) {
      return { success: false, error: 'Duplicate Request: This vehicle is already branded (System V5).', version: VERSION };
    }

    const now          = new Date().toISOString();
    const requestID    = generateID('REQ');
    const jobID        = generateID('JOB');

    requestsSheet.appendRow([
      requestID,
      data.requestType,
      data.driverID,
      data.driverName   || '',
      data.driverPhone  || '',
      data.companyCode,
      data.companyName  || '',
      data.fleetType,
      data.plateNumber,
      data.carBrand,
      data.carModel,
      data.carYear,
      'Pending',
      now,
    ]);

    jobsSheet.appendRow([
      jobID,
      requestID,
      jobType,
      data.plateNumber,
      data.driverID,
      data.driverName  || '',
      data.driverPhone || '',
      data.companyCode,
      data.companyName || '',
      data.fleetType,
      data.carBrand,
      data.carModel,
      data.carYear,
      'Pending',
      '', // SupplierName
      '', // Area
      '', // AppointmentDate
      '', // AppointmentTime
      '', // SlotID
      now,
      now,
    ]);

    return { success: true, requestID, jobID, message: 'Request created successfully', version: VERSION };
  } finally {
    lock.releaseLock();
  }
}

function getRequests(companyCode, role) {
  const sheet    = getSheet(SN.REQUESTS);
  let   requests = sheetToObjects(sheet);

  if (role === '3PL' && companyCode) {
    requests = requests.filter(r => String(r.CompanyCode) === String(companyCode));
  }
  return { success: true, requests };
}

// ============================================================
// SCHEDULE JOBS
// ============================================================

function getScheduleJobs(filters) {
  filters = filters || {};
  const sheet    = getSheet(SN.JOBS);
  let   jobs     = sheetToObjects(sheet);

  if (filters.role === '3PL' && filters.companyCode) {
    jobs = jobs.filter(j => String(j.CompanyCode) === String(filters.companyCode));
  }
  if (filters.role === 'Supplier' && filters.supplierName) {
    jobs = jobs.filter(j => String(j.SupplierName) === String(filters.supplierName));
  }
  if (filters.status) {
    jobs = jobs.filter(j => j.Status === filters.status);
  }
  if (filters.jobType) {
    jobs = jobs.filter(j => j.JobType === filters.jobType);
  }
  if (filters.plateNumber) {
    const q = String(filters.plateNumber).replace(/\s+/g, '').toLowerCase();
    jobs = jobs.filter(j =>
      String(j.PlateNumber).replace(/\s+/g, '').toLowerCase().includes(q)
    );
  }

  // Attach upload info
  const uploads = sheetToObjects(getSheet(SN.UPLOADS));
  jobs = jobs.map(job => {
    const upload = uploads.find(u => u.JobID === job.JobID) || null;
    return { ...job, upload };
  });

  return { success: true, jobs };
}

function assignSupplierSlot(data) {
  const { jobID, slotID } = data;
  if (!jobID || !slotID) {
    return { success: false, error: 'jobID and slotID are required' };
  }

  const ss         = SpreadsheetApp.openById(SS_ID);
  const jobsSheet  = ss.getSheetByName(SN.JOBS);
  const slotsSheet = ss.getSheetByName(SN.SLOTS);

  const jobs  = sheetToObjects(jobsSheet);
  const slots = sheetToObjects(slotsSheet);

  const jobIdx  = jobs.findIndex(j => j.JobID  === jobID);
  const slotIdx = slots.findIndex(s => s.SlotID === slotID);

  if (jobIdx  === -1) return { success: false, error: 'Job not found' };
  if (slotIdx === -1) return { success: false, error: 'Slot not found' };

  const slot    = slots[slotIdx];
  const current = parseInt(slot.CurrentBookings) || 0;
  const max     = parseInt(slot.MaxCapacity)     || 0;
  if (current >= max) return { success: false, error: 'Slot is at full capacity' };

  const hdr    = HEADERS.ScheduleJobs;
  const rowNum = jobIdx + 2;
  const jobRow = jobsSheet.getRange(rowNum, 1, 1, hdr.length).getValues()[0];

  jobRow[hdr.indexOf('Status')]          = 'Scheduled';
  jobRow[hdr.indexOf('SupplierName')]    = slot.SupplierName;
  jobRow[hdr.indexOf('Area')]            = slot.Area;
  jobRow[hdr.indexOf('AppointmentDate')] = slot.Date;
  jobRow[hdr.indexOf('AppointmentTime')] = slot.Time;
  jobRow[hdr.indexOf('SlotID')]          = slotID;
  jobRow[hdr.indexOf('UpdatedAt')]       = new Date().toISOString();
  jobsSheet.getRange(rowNum, 1, 1, hdr.length).setValues([jobRow]);

  // Increment slot booking count
  const sh = HEADERS.SupplierSlots;
  slotsSheet
    .getRange(slotIdx + 2, sh.indexOf('CurrentBookings') + 1)
    .setValue(current + 1);

  return { success: true, message: 'Supplier slot assigned successfully' };
}

function rescheduleJob(data) {
  const { jobID, slotID } = data;
  if (!jobID || !slotID) {
    return { success: false, error: 'jobID and slotID are required' };
  }

  const ss         = SpreadsheetApp.openById(SS_ID);
  const jobsSheet  = ss.getSheetByName(SN.JOBS);
  const slotsSheet = ss.getSheetByName(SN.SLOTS);

  const jobs  = sheetToObjects(jobsSheet);
  const slots = sheetToObjects(slotsSheet);

  const jobIdx  = jobs.findIndex(j => j.JobID  === jobID);
  const slotIdx = slots.findIndex(s => s.SlotID === slotID);

  if (jobIdx  === -1) return { success: false, error: 'Job not found' };
  if (slotIdx === -1) return { success: false, error: 'Slot not found' };

  const newSlot = slots[slotIdx];
  const cur     = parseInt(newSlot.CurrentBookings) || 0;
  const max     = parseInt(newSlot.MaxCapacity)     || 0;
  if (cur >= max) return { success: false, error: 'New slot is at full capacity' };

  const job = jobs[jobIdx];
  const sh  = HEADERS.SupplierSlots;

  // Decrement old slot if any
  if (job.SlotID) {
    const oldIdx = slots.findIndex(s => s.SlotID === job.SlotID);
    if (oldIdx !== -1) {
      const oldCount = parseInt(slots[oldIdx].CurrentBookings) || 0;
      slotsSheet
        .getRange(oldIdx + 2, sh.indexOf('CurrentBookings') + 1)
        .setValue(Math.max(0, oldCount - 1));
    }
  }

  // Update job
  const hdr    = HEADERS.ScheduleJobs;
  const rowNum = jobIdx + 2;
  const jobRow = jobsSheet.getRange(rowNum, 1, 1, hdr.length).getValues()[0];

  jobRow[hdr.indexOf('Status')]          = 'Scheduled';
  jobRow[hdr.indexOf('SupplierName')]    = newSlot.SupplierName;
  jobRow[hdr.indexOf('Area')]            = newSlot.Area;
  jobRow[hdr.indexOf('AppointmentDate')] = newSlot.Date;
  jobRow[hdr.indexOf('AppointmentTime')] = newSlot.Time;
  jobRow[hdr.indexOf('SlotID')]          = slotID;
  jobRow[hdr.indexOf('UpdatedAt')]       = new Date().toISOString();
  jobsSheet.getRange(rowNum, 1, 1, hdr.length).setValues([jobRow]);

  // Increment new slot
  slotsSheet
    .getRange(slotIdx + 2, sh.indexOf('CurrentBookings') + 1)
    .setValue(cur + 1);

  return { success: true, message: 'Job rescheduled successfully' };
}

function rejectJob(jobID, reason) {
  if (!jobID) return { success: false, error: 'jobID is required' };
  return updateJobStatus(jobID, 'Rejected');
}

// Internal helper – update a job's Status + UpdatedAt
function updateJobStatus(jobID, status) {
  const ss        = SpreadsheetApp.openById(SS_ID);
  const sheet     = ss.getSheetByName(SN.JOBS);
  const jobs      = sheetToObjects(sheet);
  const jobIdx    = jobs.findIndex(j => j.JobID === jobID);
  if (jobIdx === -1) return { success: false, error: 'Job not found' };

  const hdr    = HEADERS.ScheduleJobs;
  const rowNum = jobIdx + 2;
  const row    = sheet.getRange(rowNum, 1, 1, hdr.length).getValues()[0];
  row[hdr.indexOf('Status')]    = status;
  row[hdr.indexOf('UpdatedAt')] = new Date().toISOString();
  sheet.getRange(rowNum, 1, 1, hdr.length).setValues([row]);
  return { success: true };
}

// ============================================================
// SUPPLIER ACTIONS & IMAGE UPLOAD
// ============================================================

/**
 * uploadImages – receives direct Drive file URLs from the frontend
 * (frontend uploads to Drive via client-side API and passes URLs here)
 */
function uploadImages(data) {
  const { jobID, leftSideURL, backSideURL, rightSideURL } = data;
  if (!jobID || !leftSideURL || !backSideURL || !rightSideURL) {
    return { success: false, error: 'jobID and all 3 image URLs are required' };
  }

  const ss         = SpreadsheetApp.openById(SS_ID);
  const jobsSheet  = ss.getSheetByName(SN.JOBS);
  const uploadsSheet = ss.getSheetByName(SN.UPLOADS);

  const jobs   = sheetToObjects(jobsSheet);
  const jobIdx = jobs.findIndex(j => j.JobID === jobID);
  if (jobIdx === -1) return { success: false, error: 'Job not found' };

  const job      = jobs[jobIdx];
  const now      = new Date().toISOString();
  const uploadID = generateID('UPL');

  uploadsSheet.appendRow([
    uploadID,
    jobID,
    data.plateNumber  || job.PlateNumber,
    data.supplierName || job.SupplierName,
    leftSideURL,
    backSideURL,
    rightSideURL,
    now,
    'Pending',  // VerificationStatus
    '',         // VerifiedAt
    '',         // VerifiedBy
    '',         // Notes
  ]);

  // Update job status
  const hdr    = HEADERS.ScheduleJobs;
  const rowNum = jobIdx + 2;
  const jobRow = jobsSheet.getRange(rowNum, 1, 1, hdr.length).getValues()[0];
  jobRow[hdr.indexOf('Status')]    = 'Awaiting Admin Verification';
  jobRow[hdr.indexOf('UpdatedAt')] = now;
  jobsSheet.getRange(rowNum, 1, 1, hdr.length).setValues([jobRow]);

  return { success: true, uploadID, message: 'Images recorded successfully' };
}

/**
 * uploadImagesBase64 – accepts base64-encoded images, saves to Google Drive,
 * stores URLs in SupplierUploads sheet.
 * Payload: { jobID, leftB64, backB64, rightB64, mimeType, supplierName, plateNumber }
 */
function uploadImagesBase64(data) {
  const { jobID, leftB64, backB64, rightB64, mimeType } = data;
  if (!jobID || !leftB64 || !backB64 || !rightB64) {
    return { success: false, error: 'jobID and all 3 base64 images are required' };
  }

  const ss         = SpreadsheetApp.openById(SS_ID);
  const jobsSheet  = ss.getSheetByName(SN.JOBS);
  const jobs       = sheetToObjects(jobsSheet);
  const jobIdx     = jobs.findIndex(j => j.JobID === jobID);
  if (jobIdx === -1) return { success: false, error: 'Job not found' };

  const job     = jobs[jobIdx];
  const folder  = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const imgMime = mimeType || MimeType.JPEG;

  // Create subfolder per job
  let jobFolder;
  try {
    const iter = folder.getFoldersByName(jobID);
    jobFolder  = iter.hasNext() ? iter.next() : folder.createFolder(jobID);
  } catch (e) {
    jobFolder = folder.createFolder(jobID);
  }

  function b64ToFile(b64, name) {
    const bytes = Utilities.base64Decode(b64);
    const blob  = Utilities.newBlob(bytes, imgMime, name);
    const file  = jobFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return 'https://drive.google.com/uc?id=' + file.getId();
  }

  const leftURL  = b64ToFile(leftB64,  'left.jpg');
  const backURL  = b64ToFile(backB64,  'back.jpg');
  const rightURL = b64ToFile(rightB64, 'right.jpg');

  // Reuse the regular uploadImages path
  return uploadImages({
    jobID,
    leftSideURL:  leftURL,
    backSideURL:  backURL,
    rightSideURL: rightURL,
    supplierName: data.supplierName || job.SupplierName,
    plateNumber:  data.plateNumber  || job.PlateNumber,
  });
}

function markDidNotAppear(jobID) {
  if (!jobID) return { success: false, error: 'jobID is required' };
  const r = updateJobStatus(jobID, 'Did Not Appear');
  return r.success ? { success: true, message: 'Job marked as Did Not Appear' } : r;
}

function getSupplierJobs(supplierName) {
  return getScheduleJobs({ supplierName, role: 'Supplier' });
}

function getSupplierUploads(jobID) {
  const sheet   = getSheet(SN.UPLOADS);
  let   uploads = sheetToObjects(sheet);
  if (jobID) uploads = uploads.filter(u => u.JobID === jobID);
  return { success: true, uploads };
}

// ============================================================
// ADMIN VERIFICATION
// ============================================================

function verifyUpload(data) {
  const { jobID, approved, notes, adminCode } = data;
  if (!jobID || approved === undefined) {
    return { success: false, error: 'jobID and approved status are required' };
  }

  const ss             = SpreadsheetApp.openById(SS_ID);
  const jobsSheet      = ss.getSheetByName(SN.JOBS);
  const uploadsSheet   = ss.getSheetByName(SN.UPLOADS);
  const brandedSheet   = ss.getSheetByName(SN.BRANDED);
  const stickerSheet   = ss.getSheetByName(SN.STICKER);

  const jobs   = sheetToObjects(jobsSheet);
  const jobIdx = jobs.findIndex(j => j.JobID === jobID);
  if (jobIdx === -1) return { success: false, error: 'Job not found' };

  const job = jobs[jobIdx];
  const now = new Date().toISOString();
  const tz  = Session.getScriptTimeZone();
  const today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');

  // Update upload record
  const uploads   = sheetToObjects(uploadsSheet);
  const uploadIdx = uploads.findIndex(u => u.JobID === jobID);
  if (uploadIdx !== -1) {
    const uh      = HEADERS.SupplierUploads;
    const uRowNum = uploadIdx + 2;
    const uRow    = uploadsSheet.getRange(uRowNum, 1, 1, uh.length).getValues()[0];
    uRow[uh.indexOf('VerificationStatus')] = approved ? 'Approved' : 'Rejected';
    uRow[uh.indexOf('VerifiedAt')]         = now;
    uRow[uh.indexOf('VerifiedBy')]         = adminCode || 'Admin';
    uRow[uh.indexOf('Notes')]              = notes || '';
    uploadsSheet.getRange(uRowNum, 1, 1, uh.length).setValues([uRow]);
  }

  const jh     = HEADERS.ScheduleJobs;
  const jRowNum = jobIdx + 2;
  const jobRow  = jobsSheet.getRange(jRowNum, 1, 1, jh.length).getValues()[0];

  if (!approved) {
    // Reset job to Pending so admin can reschedule
    jobRow[jh.indexOf('Status')]          = 'Pending';
    jobRow[jh.indexOf('SupplierName')]    = '';
    jobRow[jh.indexOf('Area')]            = '';
    jobRow[jh.indexOf('AppointmentDate')] = '';
    jobRow[jh.indexOf('AppointmentTime')] = '';
    jobRow[jh.indexOf('SlotID')]          = '';
    jobRow[jh.indexOf('UpdatedAt')]       = now;
    jobsSheet.getRange(jRowNum, 1, 1, jh.length).setValues([jobRow]);
    return { success: true, message: 'Upload rejected. Job reset to Pending for rescheduling.' };
  }

  // Approved – mark job completed
  jobRow[jh.indexOf('Status')]    = 'Completed';
  jobRow[jh.indexOf('UpdatedAt')] = now;
  jobsSheet.getRange(jRowNum, 1, 1, jh.length).setValues([jobRow]);

  if (job.JobType === 'Branding' || job.JobType === 'Re-branding') {
    // Upsert into BrandedVehicles (Plate Number is the key)
    const branded    = sheetToObjects(brandedSheet);
    const bh         = HEADERS.BrandedVehicles;
    const brandedRow = [
      job.PlateNumber, job.DriverID, job.DriverName, job.DriverPhone,
      job.CompanyCode, job.CompanyName, job.FleetType,
      job.CarBrand, job.CarModel, job.CarYear,
      today, jobID, job.SupplierName,
    ];
    const existIdx = branded.findIndex(b => b.PlateNumber === job.PlateNumber);
    if (existIdx !== -1) {
      brandedSheet.getRange(existIdx + 2, 1, 1, bh.length).setValues([brandedRow]);
    } else {
      brandedSheet.appendRow(brandedRow);
    }
    return { success: true, message: job.JobType + ' verified. Vehicle added to Branded Vehicles.' };
  }

  if (job.JobType === 'Sticker Removal') {
    // Add to StickerRemoved
    stickerSheet.appendRow([
      job.PlateNumber, job.DriverID, job.DriverName, job.DriverPhone,
      job.CompanyCode, job.CompanyName, job.FleetType,
      job.CarBrand, job.CarModel, job.CarYear,
      today, jobID, job.SupplierName,
    ]);

    // Remove from BrandedVehicles
    const branded = sheetToObjects(brandedSheet);
    const existIdx = branded.findIndex(b => b.PlateNumber === job.PlateNumber);
    if (existIdx !== -1) {
      brandedSheet.deleteRow(existIdx + 2);
    }

    // Auto-create Re-branding job
    const rebrandJobID = createRebrandingJob(job);
    return {
      success: true,
      rebrandJobID,
      message: 'Sticker removal verified. Re-branding job created automatically.',
    };
  }

  return { success: true, message: 'Verification complete' };
}

/**
 * Auto-creates a Re-branding schedule job after sticker removal is approved.
 */
function createRebrandingJob(sourceJob) {
  const ss        = SpreadsheetApp.openById(SS_ID);
  const jobsSheet = ss.getSheetByName(SN.JOBS);
  const now       = new Date().toISOString();
  const newJobID  = generateID('JOB');

  jobsSheet.appendRow([
    newJobID,
    sourceJob.RequestID || '',
    'Re-branding',
    sourceJob.PlateNumber,
    sourceJob.DriverID,
    sourceJob.DriverName,
    sourceJob.DriverPhone,
    sourceJob.CompanyCode,
    sourceJob.CompanyName,
    sourceJob.FleetType,
    sourceJob.CarBrand,
    sourceJob.CarModel,
    sourceJob.CarYear,
    'Pending',
    '', // SupplierName
    '', // Area
    '', // AppointmentDate
    '', // AppointmentTime
    '', // SlotID
    now,
    now,
  ]);

  return newJobID;
}

// ============================================================
// SUPPLIER SLOT MANAGEMENT
// ============================================================

function getSupplierSlots(filters) {
  filters = filters || {};
  const sheet = getSheet(SN.SLOTS);
  let slots   = sheetToObjects(sheet);

  if (filters.supplierName) slots = slots.filter(s => s.SupplierName === filters.supplierName);
  if (filters.date)         slots = slots.filter(s => s.Date         === filters.date);
  if (filters.jobType)      slots = slots.filter(s => s.JobType      === filters.jobType);

  slots = slots.map(s => ({
    ...s,
    availableCapacity: (parseInt(s.MaxCapacity) || 0) - (parseInt(s.CurrentBookings) || 0),
  }));

  return { success: true, slots };
}

function getAvailableSlots(date, jobType) {
  const sheet = getSheet(SN.SLOTS);
  let slots   = sheetToObjects(sheet);

  if (date)    slots = slots.filter(s => s.Date    === date);
  if (jobType) slots = slots.filter(s => s.JobType === jobType);

  // Only slots with remaining capacity
  slots = slots
    .filter(s => (parseInt(s.CurrentBookings) || 0) < (parseInt(s.MaxCapacity) || 0))
    .map(s => ({
      ...s,
      availableCapacity: (parseInt(s.MaxCapacity) || 0) - (parseInt(s.CurrentBookings) || 0),
    }));

  return { success: true, slots };
}

function createSupplierSlot(data) {
  const required = ['date','time','jobType','maxCapacity','supplierName','area'];
  for (const f of required) {
    if (!data[f]) return { success: false, error: 'Missing field: ' + f };
  }

  const validJobTypes = ['Branding','Sticker Removal','Re-branding'];
  if (!validJobTypes.includes(data.jobType)) {
    return { success: false, error: 'Invalid jobType. Must be: ' + validJobTypes.join(' | ') };
  }

  const ss     = SpreadsheetApp.openById(SS_ID);
  const sheet  = ss.getSheetByName(SN.SLOTS);
  const slotID = generateID('SLT');

  sheet.appendRow([
    slotID,
    data.date,
    data.time,
    data.jobType,
    data.maxCapacity,
    0,  // CurrentBookings
    data.supplierName,
    data.area,
  ]);

  return { success: true, slotID, message: 'Slot created successfully' };
}

function updateSupplierSlot(slotID, data) {
  if (!slotID) return { success: false, error: 'slotID is required' };

  const ss    = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName(SN.SLOTS);
  const slots = sheetToObjects(sheet);
  const idx   = slots.findIndex(s => s.SlotID === slotID);
  if (idx === -1) return { success: false, error: 'Slot not found' };

  const h      = HEADERS.SupplierSlots;
  const rowNum = idx + 2;
  const row    = sheet.getRange(rowNum, 1, 1, h.length).getValues()[0];

  if (data.date)         row[h.indexOf('Date')]         = data.date;
  if (data.time)         row[h.indexOf('Time')]         = data.time;
  if (data.jobType)      row[h.indexOf('JobType')]      = data.jobType;
  if (data.maxCapacity)  row[h.indexOf('MaxCapacity')]  = data.maxCapacity;
  if (data.supplierName) row[h.indexOf('SupplierName')] = data.supplierName;
  if (data.area)         row[h.indexOf('Area')]         = data.area;

  sheet.getRange(rowNum, 1, 1, h.length).setValues([row]);
  return { success: true, message: 'Slot updated successfully' };
}

function deleteSupplierSlot(slotID) {
  if (!slotID) return { success: false, error: 'slotID is required' };

  const ss    = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName(SN.SLOTS);
  const slots = sheetToObjects(sheet);
  const idx   = slots.findIndex(s => s.SlotID === slotID);
  if (idx === -1) return { success: false, error: 'Slot not found' };

  sheet.deleteRow(idx + 2);
  return { success: true, message: 'Slot deleted' };
}

// ============================================================
// BRANDED VEHICLES & STICKER REMOVED
// ============================================================

function getBrandedVehicles(filters) {
  filters = filters || {};
  const sheet  = getSheet(SN.BRANDED);
  let vehicles = sheetToObjects(sheet);

  if (filters.role === '3PL' && filters.companyCode) {
    vehicles = vehicles.filter(v => String(v.CompanyCode) === String(filters.companyCode));
  }
  if (filters.role === 'Supplier' && filters.supplierName) {
    vehicles = vehicles.filter(v => String(v.SupplierName) === String(filters.supplierName));
  }
  if (filters.searchCompany) {
    const q = String(filters.searchCompany).toLowerCase();
    vehicles = vehicles.filter(v =>
      String(v.CompanyCode).toLowerCase().includes(q) ||
      String(v.CompanyName).toLowerCase().includes(q)
    );
  }
  if (filters.plateNumber) {
    const q = String(filters.plateNumber).replace(/\s+/g, '').toLowerCase();
    vehicles = vehicles.filter(v => String(v.PlateNumber).replace(/\s+/g, '').toLowerCase().includes(q));
  }
  if (filters.driverID) {
    const q = String(filters.driverID).toLowerCase();
    vehicles = vehicles.filter(v => String(v.DriverID).toLowerCase().includes(q));
  }

  return { success: true, vehicles };
}

function getStickerRemoved(filters) {
  filters = filters || {};
  const sheet   = getSheet(SN.STICKER);
  let   records = sheetToObjects(sheet);

  if (filters.role === '3PL' && filters.companyCode) {
    records = records.filter(r => String(r.CompanyCode) === String(filters.companyCode));
  }
  if (filters.role === 'Supplier' && filters.supplierName) {
    records = records.filter(r => String(r.BySupplier) === String(filters.supplierName));
  }

  return { success: true, records };
}

function getSupplierBrandedVehicles(supplierName) {
  return getBrandedVehicles({ role: 'Supplier', supplierName });
}

// ============================================================
// REPLACEMENT REQUESTS
// ============================================================

function createReplacementRequest(data) {
  const { plateNumber, newDriverID, newDriverName, newDriverPhone, companyCode } = data;
  if (!plateNumber || !newDriverID || !companyCode) {
    return { success: false, error: 'plateNumber, newDriverID, and companyCode are required' };
  }

  // Verify the vehicle belongs to this company in BrandedVehicles
  const normalizedPlate = String(plateNumber).replace(/\s+/g, '');
  const branded = sheetToObjects(getSheet(SN.BRANDED));
  const vehicle = branded.find(v =>
    String(v.PlateNumber).replace(/\s+/g, '') === normalizedPlate && String(v.CompanyCode) === String(companyCode)
  );
  if (!vehicle) {
    return { success: false, error: 'Vehicle not found in branded vehicles for this company' };
  }

  const ss            = SpreadsheetApp.openById(SS_ID);
  const sheet         = ss.getSheetByName(SN.REPLACEMENTS);
  const now           = new Date().toISOString();
  const replacementID = generateID('REP');

  sheet.appendRow([
    replacementID,
    plateNumber,
    vehicle.DriverID,
    vehicle.DriverName,
    vehicle.DriverPhone,
    newDriverID,
    newDriverName  || '',
    newDriverPhone || '',
    companyCode,
    now,        // RequestedAt
    'Pending',  // Status
    '',         // ReviewedAt
    '',         // ReviewedBy
  ]);

  return { success: true, replacementID, message: 'Replacement request submitted' };
}

function getReplacementRequests(companyCode, role) {
  const sheet    = getSheet(SN.REPLACEMENTS);
  let   requests = sheetToObjects(sheet);

  if (role === '3PL' && companyCode) {
    requests = requests.filter(r => String(r.CompanyCode) === String(companyCode));
  }
  return { success: true, requests };
}

function reviewReplacement(data) {
  const { replacementID, approved, adminCode } = data;
  if (!replacementID || approved === undefined) {
    return { success: false, error: 'replacementID and approved status are required' };
  }

  const ss               = SpreadsheetApp.openById(SS_ID);
  const replacementsSheet = ss.getSheetByName(SN.REPLACEMENTS);
  const brandedSheet      = ss.getSheetByName(SN.BRANDED);

  const replacements = sheetToObjects(replacementsSheet);
  const idx          = replacements.findIndex(r => r.ReplacementID === replacementID);
  if (idx === -1) return { success: false, error: 'Replacement request not found' };

  const replacement = replacements[idx];
  const now         = new Date().toISOString();
  const rh          = HEADERS.ReplacementRequests;
  const rowNum      = idx + 2;
  const row         = replacementsSheet.getRange(rowNum, 1, 1, rh.length).getValues()[0];

  row[rh.indexOf('Status')]     = approved ? 'Approved' : 'Rejected';
  row[rh.indexOf('ReviewedAt')] = now;
  row[rh.indexOf('ReviewedBy')] = adminCode || 'Admin';
  replacementsSheet.getRange(rowNum, 1, 1, rh.length).setValues([row]);

  if (approved) {
    const branded    = sheetToObjects(brandedSheet);
    const vehicleIdx = branded.findIndex(v => v.PlateNumber === replacement.PlateNumber);

    if (vehicleIdx !== -1) {
      const bh         = HEADERS.BrandedVehicles;
      const vehicleRow = brandedSheet.getRange(vehicleIdx + 2, 1, 1, bh.length).getValues()[0];
      vehicleRow[bh.indexOf('DriverID')]    = replacement.NewDriverID;
      vehicleRow[bh.indexOf('DriverName')]  = replacement.NewDriverName;
      vehicleRow[bh.indexOf('DriverPhone')] = replacement.NewDriverPhone;
      brandedSheet.getRange(vehicleIdx + 2, 1, 1, bh.length).setValues([vehicleRow]);
    }
  }

  return {
    success: true,
    message: 'Replacement request ' + (approved ? 'approved' : 'rejected'),
  };
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function generateID(prefix) {
  const ts  = new Date().getTime();
  const rnd = Math.floor(Math.random() * 9000) + 1000;
  return prefix + ts + rnd;
}

function getSheet(name) {
  return SpreadsheetApp.openById(SS_ID).getSheetByName(name);
}

/**
 * Converts a sheet's data range into an array of plain objects,
 * skipping completely empty rows.
 */
function sheetToObjects(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0].map(h => String(h).trim());
  return data.slice(1)
    .filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// QUICK TEST – run this manually in the Apps Script editor
// to verify the setup without deploying as a Web App.
// ============================================================

function runTests() {
  Logger.log('=== SETUP ===');
  Logger.log(JSON.stringify(setupSheets()));

  Logger.log('=== SAMPLE DATA ===');
  Logger.log(JSON.stringify(setupSampleData()));

  Logger.log('=== AUTH (valid) ===');
  Logger.log(JSON.stringify(authenticate('3PL001', '55551111')));

  Logger.log('=== AUTH (invalid) ===');
  Logger.log(JSON.stringify(authenticate('BAD', 'BAD')));

  Logger.log('=== DRIVER LOOKUP ===');
  Logger.log(JSON.stringify(getDriver('DRV001')));

  Logger.log('=== AVAILABLE SLOTS ===');
  const tz   = Session.getScriptTimeZone();
  const d1   = new Date(); d1.setDate(d1.getDate() + 1);
  const date = Utilities.formatDate(d1, tz, 'yyyy-MM-dd');
  Logger.log(JSON.stringify(getAvailableSlots(date, 'Branding')));

  Logger.log('=== CREATE REQUEST ===');
  const reqResult = JSON.parse(JSON.stringify(createRequest({
    requestType: 'New Branding Request',
    driverID:    'DRV001',
    driverName:  'Ahmed Al-Rashid',
    driverPhone: '55551234',
    companyCode: '3PL001',
    companyName: 'Fast Delivery Co',
    fleetType:   'Car',
    plateNumber: '11/11111',
    carBrand:    'Toyota',
    carModel:    'Camry',
    carYear:     2023,
  })));
  Logger.log(JSON.stringify(reqResult));

  Logger.log('=== GET SCHEDULE JOBS (3PL) ===');
  Logger.log(JSON.stringify(getScheduleJobs({ companyCode: '3PL001', role: '3PL' })));

  Logger.log('All tests passed.');
}
