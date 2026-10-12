export const INCIDENT_TYPES = [
  'Equipment Failure',
  'Ingredient Shortage',
  'Kitchen Delay',
  'Fire or Safety Incident',
  'Power Failure',
  'Other',
];

export const SEVERITY_LEVELS = [
  { value: 'Low', label: 'Low', desc: 'Minor operational glitch, prep on track', color: '#3b82f6' },
  { value: 'Medium', label: 'Medium', desc: 'Short delay expected (10-15 mins)', color: '#f59e0b' },
  { value: 'High', label: 'High', desc: 'Major station slowdown, order pause likely', color: '#ea580c' },
  { value: 'Critical', label: 'Critical', desc: 'Immediate kitchen hazard / complete halt', color: '#dc2626' },
];
