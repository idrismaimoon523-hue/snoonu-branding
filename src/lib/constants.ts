export const CAR_BRANDS = [
  'Bajaj', 'Changan', 'Chery', 'Chevrolet', 'Chrysler',
  'GAC', 'GEELY', 'Hero', 'Honda', 'Hyundai', 'Kia',
  'MG', 'Mitsubishi', 'Nissan', 'Renault', 'Suzuki',
  'SYM', 'Toyota', 'TVS', 'VOLKSWAGEN', 'YAMAHA',
  'Other Brand', 'Dayun',
];

export const CAR_MODELS = [
  'Boxer', 'Pulsar 150', 'Discover', 'Platina',
  'CS35 Plus', 'CS75 Plus', 'CS95', 'UNI-K',
  'Tiggo 8 Pro', 'Tiggo 7 Pro', 'Arrizo 8', 'Tiggo 4 Pro',
  'Tahoe', 'Silverado', 'Captiva', 'Groove',
  '300', 'Pacifica', '300C', '300S',
  'Emkoo', 'GS3 Emzoom', 'GS8', 'Empow',
  'Monjaro', 'Coolray', 'Tugella', 'Emgrand',
  'Hunk 160R', 'Thriller', 'Ignitor', 'Dawn',
  'Civic', 'Accord', 'CR-V', 'Pilot',
  'Tucson', 'Santa Fe', 'Elantra', 'Palisade',
  'Sportage', 'Sorento', 'Telluride', 'K5',
  'MG RX5', 'MG HS', 'MG 5', 'MG ZS',
  'Outlander', 'Montero Sport', 'Pajero', 'ASX',
  'Patrol', 'X-Trail', 'Pathfinder', 'Altima',
  'Duster', 'Koleos', 'Arkana', 'Megane',
  'Jimny', 'Vitara', 'Swift', 'Dzire',
  'Joymax Z+', 'Jet X', 'Fiddle', 'Crox',
  'Land Cruiser', 'Prado', 'Camry', 'Sunny', 'Corolla',
  'HLX 150', 'Apache RTR', 'Star HLX', 'Victor',
  'YZF-R1', 'MT-09', 'TMAX', 'NMAX', '150 CC',
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
