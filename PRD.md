Build a working MVP web app called “Snoonu Vehicle Branding Management Portal”.

Use Planning mode. Before coding, first produce:
1. an implementation plan
2. a page map by role
3. a Google Sheets schema
4. a workflow/state-transition map
5. a short list of assumptions you are making to resolve ambiguities

After that, proceed to implementation unless blocked by missing credentials.

Goal:
Create a Snoonu-branded portal for 3 roles:
- 3PL
- Admin
- Supplier

This is a vehicle branding operations system that manages:
- new branding requests
- sticker removal requests
- supplier scheduling
- supplier photo uploads
- admin verification
- automatic re-branding flow after sticker removal
- driver replacement on already branded vehicles

Design requirements:
- Use Snoonu branding style
- Clean, modern, dashboard-style UI
- Mobile-friendly and desktop-friendly
- If the real Snoonu logo asset is not available, use a placeholder logo/text component that is easy to replace later

Recommended stack:
- Next.js + TypeScript
- Tailwind CSS
- Clean dashboard component system
- Google Sheets as primary data source
- Google Drive for uploaded images
- If Google credentials are not available yet, keep the Google Sheets / Drive integration layer ready and implement using mock adapters or placeholder services that can be connected later without major refactoring

Important rules:
- Treat this as an MVP, but structure it cleanly
- Do not over-engineer
- Prioritize correct workflows, role permissions, and data consistency
- Vehicle Plate Number is the main vehicle source of truth
- Driver details can change later, but the vehicle identity remains the same
- Car Year must be 2021 or above
- Plate number must always include a slash "/"
- Use exact dropdown values for Car Brand and Car Model from this prompt
- Build validations into forms
- Only Active users can log in
- Request ID / Job ID should still be generated for workflow tracking, but Plate Number remains the vehicle master key

Authentication:
Users log in using:
- Company Code = username
- Owner Phone Number = password

User records come from a Google Sheet tab named Users with columns:
- CompanyCode
- Phone
- Role
- CompanyName
- Active

Login behavior:
- Only allow login when Active is true/yes
- Redirect user based on Role:
  - 3PL dashboard
  - Admin dashboard
  - Supplier dashboard

Driver data:
Driver records come from a Google Sheet tab named Drivers.
When the user enters Driver ID, auto-fetch:
- Driver Name
- Driver Phone Number
- Company Code
- Company Name

Please create a suggested Drivers schema if missing, including:
- DriverID
- DriverName
- DriverPhone
- CompanyCode
- CompanyName
- Active

Core data tabs to implement in Google Sheets:
1. Users
2. Drivers
3. Requests
4. ScheduleJobs
5. BrandedVehicles
6. StickerRemoved
7. ReplacementRequests
8. SupplierSlots
9. SupplierUploads

Define a clean schema for each tab.

Image storage:
- Store uploaded vehicle photos in Google Drive
- Store file URL, upload metadata, vehicle info, job info, and verification status in Google Sheets
- SupplierUploads sheet should hold metadata and image URLs, not binary files

Role 1: 3PL dashboard
Create these tabs:
1. Request
2. Schedule
3. Branded Vehicle
4. Sticker Removed
5. Replacement Request

3PL Tab 1: Request
Allow user to create a request by selecting Request Type:
- New Branding Request
- Sticker Removal Request

Request form fields:
- Request Type
- Driver ID
- Auto-fetch Driver Name
- Auto-fetch Driver Phone Number
- Auto-fetch Company Code
- Auto-fetch Company Name
- Fleet Type: Car / Bike
- Plate Number
- Car Brand
- Car Model
- Car Year

Plate rules:
- Car example: 11/11111
- Bike example: 7/1298
- Must always contain "/"

Car Year rule:
- 2021 and above only

After submission:
- create a request record
- create a schedule workflow entry with Status = Pending

3PL Tab 2: Schedule
Show all requests for that 3PL with:
- Request ID / Job ID
- Request Type
- Job Type
- Driver details
- Vehicle details
- Status
- Supplier Name
- Supplier Location
- Appointment Date
- Appointment Time
- Photo status / verification status if available

Allowed statuses:
- Pending
- Scheduled
- Awaiting Supplier Action
- Awaiting Admin Verification
- Did Not Appear
- Rejected
- Completed

Schedule job types must be exactly:
- Sticker Removal
- Branding
- Re-branding

Interpretation:
- New Branding Request -> Branding
- Sticker Removal Request -> Sticker Removal
- Once sticker removal is verified, system must automatically create a new pending Schedule job with Job Type = Re-branding for the same Plate Number

3PL Tab 3: Branded Vehicle
Show all successfully branded vehicles for that 3PL with columns:
- Driver ID
- Driver Name
- Mobile Number
- 3PL Code
- 3PL Name
- Fleet Type
- Car Brand
- Car Model
- Car Year
- Plate Number
- Branded Date

Behavior:
- Plate Number is the permanent vehicle identifier
- Vehicle details should remain fixed
- Driver details may change through Replacement Request

3PL Tab 4: Sticker Removed
Show all vehicles whose stickers were removed successfully with columns:
- Driver ID
- Driver Name
- Mobile Number
- 3PL Code
- 3PL Name
- Fleet Type
- Car Brand
- Car Model
- Car Year
- Plate Number
- Sticker Removed Date
- By Supplier

3PL Tab 5: Replacement Request
Reason:
Branded vehicles can be transferred to a new driver and KPI follows the assigned driver.

Flow:
- User selects an existing branded vehicle
- Enters new Driver ID
- Auto-fetch new Driver Name and Phone Number
- Submits replacement request
- Admin reviews and approves/rejects
- If approved, active driver details on the branded vehicle record are replaced
- Vehicle details and Plate Number remain unchanged

Role 2: Admin dashboard
Create these tabs:
1. Schedule
2. Driver Replacement
3. Branded Vehicle
4. Sticker Removed
5. Supplier Slot Management

Admin Tab 1: Schedule
Admin can:
- view all incoming requests
- approve or reject request
- assign supplier
- assign available slot
- reschedule if needed
- verify supplier uploads

Supplier slot source:
Google Sheet tab named SupplierSlots with columns:
- Date
- Time
- JobType
- MaxCapacity
- SupplierName
- Area

Rules:
- Different suppliers may have different capacities and slot times
- Prevent overbooking beyond MaxCapacity

Supplier verification workflow:
After branding or sticker removal, supplier uploads 3 images:
- Left side
- Back side with visible plate number
- Right side

Admin then verifies.

Verification logic:
- If Job Type = Branding and admin approves -> move vehicle to BrandedVehicles
- If Job Type = Re-branding and admin approves -> move vehicle to BrandedVehicles
- If Job Type = Sticker Removal and admin approves:
  1. move vehicle to StickerRemoved history
  2. automatically create a new Schedule job for the same Plate Number
  3. set new job type = Re-branding
  4. set new status = Pending
  5. admin can then assign a supplier slot for new branding

If admin is not satisfied with the uploaded images:
- allow reschedule
- keep workflow traceable

If supplier marks Did Not Appear:
- status becomes Did Not Appear
- admin can reschedule or reject

Admin Tab 2: Driver Replacement
Show all replacement requests.
Admin can:
- approve
- reject

If approved:
- update branded vehicle record with new driver ID, name, and phone
- old driver details should no longer be the active assignment

Admin Tab 3: Branded Vehicle
Show all branded vehicles across all companies.
Include:
- search by company
- filter by company
- search by plate number
- search by driver ID if possible

Admin Tab 4: Sticker Removed
Show all sticker removed records for tracking and supplier payment.

Admin Tab 5: Supplier Slot Management
Allow admin to:
- create slots
- edit slots
- define capacity by supplier, area, date, time, and job type

Role 3: Supplier dashboard
Create these tabs:
1. Assigned Schedule
2. Sticker Removed
3. Branded Vehicle

Supplier Tab 1: Assigned Schedule
Show all jobs assigned to that supplier, including:
- Branding jobs
- Sticker Removal jobs
- Re-branding jobs

For each assigned job, show:
- Job Type
- Driver details
- Vehicle details
- Appointment details
- Upload 3 pictures action
- Did Not Appear action

Upload behavior:
- store image files in Google Drive
- store URLs and metadata in SupplierUploads sheet
- mark upload state for admin verification

Supplier Tab 2: Sticker Removed
Show all sticker removal jobs successfully completed by that supplier.
This is used for payment tracking.

Supplier Tab 3: Branded Vehicle
Show all branding jobs successfully completed by that supplier.
This is used for payment tracking.

Workflow summary:
A. New Branding
1. 3PL submits New Branding Request
2. Request becomes pending schedule job
3. Admin assigns supplier and slot
4. Supplier performs branding and uploads 3 images
5. Admin verifies
6. Vehicle moves to BrandedVehicles

B. Sticker Removal + Re-branding
1. 3PL submits Sticker Removal Request
2. Request becomes pending Sticker Removal job
3. Admin assigns supplier and slot
4. Supplier removes sticker and uploads 3 images
5. Admin verifies
6. Vehicle moves to StickerRemoved history
7. System automatically creates a new Schedule job with Job Type = Re-branding and Status = Pending
8. Admin assigns new supplier slot
9. Supplier applies new branding and uploads 3 images
10. Admin verifies
11. Vehicle moves to BrandedVehicles

C. Did Not Appear
1. Supplier marks Did Not Appear
2. Job stays visible in admin schedule
3. Admin reschedules or rejects

D. Driver Replacement
1. 3PL submits Replacement Request
2. Admin reviews
3. If approved, branded vehicle active driver assignment is replaced

Validation rules:
- Only active users can log in
- Login uses CompanyCode + Phone
- Driver details must auto-fetch from Drivers sheet by DriverID
- Plate Number must contain "/"
- Car Year must be >= 2021
- Plate Number is the main vehicle key
- Replacement changes driver assignment only
- Sticker removal approval must automatically generate a re-branding schedule job

Car Brand options:
Bajaj
Changan
Chery
Chevrolet
Chrysler
GAC
GEELY
Hero
Honda
Hyundai
Kia
MG
Mitsubishi
Nissan
Renault
Suzuki
SYM
Toyota
TVS
VOLKSWAGEN
YAMAHA
Other Brand
Dayun

Car Model options:
Boxer
Pulsar 150
Discover
Platina
CS35 Plus
CS75 Plus
CS95
UNI-K
Tiggo 8 Pro
Tiggo 7 Pro
Arrizo 8
Tiggo 4 Pro
Tahoe
Silverado
Captiva
Groove
300
Pacifica
300C
300S
Emkoo
GS3 Emzoom
GS8
Empow
Monjaro
Coolray
Tugella
Emgrand
Hunk 160R
Thriller
Ignitor
Dawn
Civic
Accord
CR-V
Pilot
Tucson
Santa Fe
Elantra
Palisade
Sportage
Sorento
Telluride
K5
MG RX5
MG HS
MG 5
MG ZS
Outlander
Montero Sport
Pajero
ASX
Patrol
X-Trail
Pathfinder
Altima
Duster
Koleos
Arkana
Megane
Jimny
Vitara
Swift
Dzire
Joymax Z+
Jet X
Fiddle
Crox
Land Cruiser
Prado
Camry
Sunny
Corolla
HLX 150
Apache RTR
Star HLX
Victor
YZF-R1
MT-09
TMAX
NMAX
150 CC

What I want from you:
1. First show implementation plan
2. Then define Google Sheets schema
3. Then build the app screens and flows
4. Then connect the data layer
5. Then add validations and state transitions
6. Then provide a walkthrough of the main flows
7. Then give a setup guide for Google Sheets + Google Drive credentials

Acceptance criteria:
- Role-based login works
- 3PL has exactly these tabs: Request, Schedule, Branded Vehicle, Sticker Removed, Replacement Request
- 3PL can submit both request types
- Driver data auto-fetch works from Driver ID
- Admin can schedule jobs against supplier slots
- Schedule job types are exactly: Sticker Removal, Branding, Re-branding
- Supplier can upload 3 required images
- Images are stored in Google Drive and URLs/metadata are stored in Google Sheets
- Admin can verify and move records correctly
- Sticker removal automatically creates re-branding job
- Replacement request updates active driver on branded vehicle
- Admin branded vehicle page supports company filtering/search
- Supplier completed jobs are visible for payment tracking

If anything is ambiguous, make a sensible assumption, list it clearly, and continue.4