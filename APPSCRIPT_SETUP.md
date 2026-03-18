# Apps Script Setup Guide — Snoonu Branding Portal

## 1. Open the Apps Script editor

1. Open the Google Spreadsheet:
   https://docs.google.com/spreadsheets/d/1uwcRWOFbZj3_gM1Pvq469gO7-QgMdAHkv9SdUQkrmZE/edit
2. Click **Extensions → Apps Script**
3. Delete everything in the default `Code.gs` file
4. Paste the entire contents of `Code.gs` from this project

## 2. Run the one-time setup

In the Apps Script editor:

1. Select `setupSheets` from the function dropdown
2. Click **Run** — this creates all 9 sheet tabs with correct headers + Snoonu-orange header style
3. Select `setupSampleData` from the dropdown
4. Click **Run** — this adds sample users, drivers, and supplier slots for testing

## 3. Run the test suite

1. Select `runTests` from the dropdown
2. Click **Run** and open **View → Logs** to confirm all tests pass

## 4. Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the gear icon → **Web app**
3. Set:
   - **Execute as**: Me (your Google account)
   - **Who has access**: Anyone
     *(or "Anyone with Google account" for tighter security)*
4. Click **Deploy**
5. Copy the **Web App URL** — this is your API base URL for the Next.js frontend

> Re-deploy (Deploy → Manage deployments → Edit → New version) every time you update Code.gs.

## 5. Use the API from Next.js

All requests go to the deployed Web App URL.

### GET example (read data)
```
GET {WEB_APP_URL}?action=getAvailableSlots&date=2026-03-20&jobType=Branding
```

### POST example (write data)
```
POST {WEB_APP_URL}
Content-Type: application/json

{
  "action": "authenticate",
  "companyCode": "3PL001",
  "phone": "55551111"
}
```

> **CORS note**: Apps Script web apps don't set CORS headers for cross-origin browser requests.
> Always call the Apps Script URL from a **Next.js API route** (server-side), not from the browser directly.

---

## API Reference

### Auth
| Action | Payload | Returns |
|--------|---------|---------|
| `authenticate` | `{ companyCode, phone }` | `{ success, user: { companyCode, companyName, role, phone } }` |

### Drivers
| Action | Payload | Returns |
|--------|---------|---------|
| `getDriver` | `{ driverID }` | `{ success, driver: { driverID, driverName, driverPhone, companyCode, companyName } }` |

### Requests (3PL)
| Action | Payload | Returns |
|--------|---------|---------|
| `createRequest` | `{ requestType, driverID, driverName, driverPhone, companyCode, companyName, fleetType, plateNumber, carBrand, carModel, carYear }` | `{ success, requestID, jobID }` |
| `getRequests` | `{ companyCode, role }` | `{ success, requests[] }` |

### Schedule Jobs
| Action | Payload | Returns |
|--------|---------|---------|
| `getScheduleJobs` | `{ companyCode?, role?, supplierName?, status?, jobType?, plateNumber? }` | `{ success, jobs[] }` |
| `assignSupplierSlot` | `{ jobID, slotID }` | `{ success }` |
| `rescheduleJob` | `{ jobID, slotID }` | `{ success }` |
| `rejectJob` | `{ jobID, reason? }` | `{ success }` |
| `verifyUpload` | `{ jobID, approved: bool, notes?, adminCode? }` | `{ success, rebrandJobID? }` |

### Supplier Actions
| Action | Payload | Returns |
|--------|---------|---------|
| `uploadImages` | `{ jobID, leftSideURL, backSideURL, rightSideURL, supplierName?, plateNumber? }` | `{ success, uploadID }` |
| `uploadImagesBase64` | `{ jobID, leftB64, backB64, rightB64, mimeType?, supplierName?, plateNumber? }` | `{ success, uploadID }` |
| `markDidNotAppear` | `{ jobID }` | `{ success }` |
| `getSupplierJobs` | `{ supplierName }` | `{ success, jobs[] }` |
| `getSupplierUploads` | `{ jobID? }` | `{ success, uploads[] }` |
| `getSupplierBranded` | `{ supplierName }` | `{ success, vehicles[] }` |

### Supplier Slots (Admin)
| Action | Payload | Returns |
|--------|---------|---------|
| `getSupplierSlots` | `{ supplierName?, date?, jobType? }` | `{ success, slots[] }` |
| `getAvailableSlots` | `{ date?, jobType? }` | `{ success, slots[] }` |
| `createSupplierSlot` | `{ date, time, jobType, maxCapacity, supplierName, area }` | `{ success, slotID }` |
| `updateSupplierSlot` | `{ slotID, date?, time?, jobType?, maxCapacity?, supplierName?, area? }` | `{ success }` |
| `deleteSupplierSlot` | `{ slotID }` | `{ success }` |

### Branded Vehicles
| Action | Payload | Returns |
|--------|---------|---------|
| `getBrandedVehicles` | `{ companyCode?, role?, supplierName?, searchCompany?, plateNumber?, driverID? }` | `{ success, vehicles[] }` |
| `getStickerRemoved` | `{ companyCode?, role?, supplierName? }` | `{ success, records[] }` |

### Replacement Requests
| Action | Payload | Returns |
|--------|---------|---------|
| `createReplacementRequest` | `{ plateNumber, newDriverID, newDriverName, newDriverPhone, companyCode }` | `{ success, replacementID }` |
| `getReplacementRequests` | `{ companyCode?, role? }` | `{ success, requests[] }` |
| `reviewReplacement` | `{ replacementID, approved: bool, adminCode? }` | `{ success }` |

---

## Sheet Schema Summary

| Sheet | Key Column | Notes |
|-------|-----------|-------|
| Users | CompanyCode | Login credentials |
| Drivers | DriverID | Auto-fetched on request form |
| Requests | RequestID | Created on 3PL submission |
| ScheduleJobs | JobID | Central workflow table |
| BrandedVehicles | PlateNumber | Upserted on branding/re-branding approval |
| StickerRemoved | PlateNumber | Appended on sticker removal approval |
| ReplacementRequests | ReplacementID | Driver swap workflow |
| SupplierSlots | SlotID | Capacity-controlled time slots |
| SupplierUploads | UploadID | Image URLs + verification status |

## Google Drive
- Drive Folder ID: `1tv5NQKv2aFUhPtzCTmVT9l3_pkHu_6Yj`
- Images uploaded via `uploadImagesBase64` are stored in per-job subfolders
- Images uploaded via `uploadImages` are stored externally and only their URLs are recorded
