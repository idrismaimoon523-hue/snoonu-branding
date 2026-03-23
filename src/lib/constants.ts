export const CAR_BRANDS = [
  'Bajaj', 'Changan', 'Chery', 'Chevrolet', 'Dayun', 'GAC', 'GEELY', 'Hero', 
  'Honda', 'Hyundai', 'Kia', 'MG', 'Mitsubishi', 'Nissan', 'Renault', 
  'Suzuki', 'SYM', 'Toyota', 'TVS', 'VOLKSWAGEN', 'Other'
];

export const CAR_MODELS = [
  '3', '5', 'Accent', 'Alsvin', 'Alto', 'Apache', 'Arizzo 4', 'Arizzo 5', 
  'Arrizo 6', 'Attrage', 'Aveo', 'Boxer', 'Camry', 'Cargo', 'Celerio', 'Ciaz', 
  'City', 'Corolla', 'Dzire', 'Emgrand', 'Ertica', 'Gixxer 150', 'GS4', 'GX2', 
  'Honda', 'Hunk', 'i10', 'JETTA', 'Kiger', 'MG 5', 'Micra', 'Mirage', 
  'Pegas', 'Picanto', 'Pulsar', 'Raize', 'Sentra', 'Sonata', 'S-Presso', 
  'Sunny', 'Symbol', 'Tiggo 2 pro', 'Tiggo 3 pro', 'Unicorn', 'XS150', 
  'Yaris', 'Other'
];

export const FLEET_TYPES = ['Car', 'Bike'];

export const REQUEST_TYPES = ['New Branding Request', 'Sticker Removal Request'];

export const JOB_TYPES = ['Branding', 'Sticker Removal', 'Re-branding'] as const;

export const JOB_STATUSES = [
  'Pending',
  'Scheduled',
  'Awaiting Supplier Action',
  'Awaiting Admin Verification',
  'Did Not Appear',
  'Rejected',
  'Completed',
] as const;

export const STATUS_STYLES: Record<string, string> = {
  Pending:                       'bg-amber-100 text-amber-800',
  Scheduled:                     'bg-blue-100 text-blue-800',
  'Awaiting Supplier Action':    'bg-cyan-100 text-cyan-800',
  'Awaiting Admin Verification': 'bg-purple-100 text-purple-800',
  'Did Not Appear':              'bg-red-100 text-red-800',
  Rejected:                      'bg-red-100 text-red-800',
  Completed:                     'bg-green-100 text-green-800',
  Approved:                      'bg-green-100 text-green-800',
};

export const MIN_CAR_YEAR = 2021;
export const CURRENT_YEAR = new Date().getFullYear();
