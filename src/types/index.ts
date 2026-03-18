export type Role = '3PL' | 'Admin' | 'Supplier';

export interface AuthUser {
  companyCode: string;
  companyName: string;
  role: Role;
  phone: string;
}

export interface Driver {
  driverID: string;
  driverName: string;
  driverPhone: string;
  companyCode: string;
  companyName: string;
}

export interface Request {
  RequestID: string;
  RequestType: string;
  DriverID: string;
  DriverName: string;
  DriverPhone: string;
  CompanyCode: string;
  CompanyName: string;
  FleetType: string;
  PlateNumber: string;
  CarBrand: string;
  CarModel: string;
  CarYear: string | number;
  Status: string;
  CreatedAt: string;
}

export interface ScheduleJob {
  JobID: string;
  RequestID: string;
  JobType: 'Branding' | 'Sticker Removal' | 'Re-branding';
  PlateNumber: string;
  DriverID: string;
  DriverName: string;
  DriverPhone: string;
  CompanyCode: string;
  CompanyName: string;
  FleetType: string;
  CarBrand: string;
  CarModel: string;
  CarYear: string | number;
  Status: JobStatus;
  SupplierName: string;
  Area: string;
  AppointmentDate: string;
  AppointmentTime: string;
  SlotID: string;
  CreatedAt: string;
  UpdatedAt: string;
  upload?: SupplierUpload | null;
}

export type JobStatus =
  | 'Pending'
  | 'Scheduled'
  | 'Awaiting Supplier Action'
  | 'Awaiting Admin Verification'
  | 'Did Not Appear'
  | 'Rejected'
  | 'Completed';

export interface BrandedVehicle {
  PlateNumber: string;
  DriverID: string;
  DriverName: string;
  DriverPhone: string;
  CompanyCode: string;
  CompanyName: string;
  FleetType: string;
  CarBrand: string;
  CarModel: string;
  CarYear: string | number;
  BrandedDate: string;
  JobID: string;
  SupplierName: string;
}

export interface StickerRemovedRecord {
  PlateNumber: string;
  DriverID: string;
  DriverName: string;
  DriverPhone: string;
  CompanyCode: string;
  CompanyName: string;
  FleetType: string;
  CarBrand: string;
  CarModel: string;
  CarYear: string | number;
  StickerRemovedDate: string;
  JobID: string;
  BySupplier: string;
}

export interface ReplacementRequest {
  ReplacementID: string;
  PlateNumber: string;
  OldDriverID: string;
  OldDriverName: string;
  OldDriverPhone: string;
  NewDriverID: string;
  NewDriverName: string;
  NewDriverPhone: string;
  CompanyCode: string;
  RequestedAt: string;
  Status: 'Pending' | 'Approved' | 'Rejected';
  ReviewedAt: string;
  ReviewedBy: string;
}

export interface SupplierSlot {
  SlotID: string;
  Date: string;
  Time: string;
  JobType: 'Branding' | 'Sticker Removal' | 'Re-branding';
  MaxCapacity: string | number;
  CurrentBookings: string | number;
  SupplierName: string;
  Area: string;
  availableCapacity?: number;
}

export interface SupplierUpload {
  UploadID: string;
  JobID: string;
  PlateNumber: string;
  SupplierName: string;
  LeftSideURL: string;
  BackSideURL: string;
  RightSideURL: string;
  UploadedAt: string;
  VerificationStatus: 'Pending' | 'Approved' | 'Rejected';
  VerifiedAt: string;
  VerifiedBy: string;
  Notes: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  [key: string]: T | boolean | string | undefined;
}
