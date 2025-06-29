// Application constants
export const APP_CONFIG = {
  NAME: 'NepLife',
  VERSION: '1.0.0',
  DESCRIPTION: 'Smart Driving License Management for Nepal',
  SUPPORT_EMAIL: 'support@neplife.com',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  MAX_LICENSES_FREE: 3,
  MAX_LICENSES_PRO: 100,
  SHARE_LINK_EXPIRY_HOURS: 24,
  OCR_TIMEOUT: 30000, // 30 seconds
  BACKUP_RETENTION_DAYS: 30
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  UPLOAD: '/upload',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  ANALYTICS: '/analytics',
  SHARED_LINKS: '/shared-links',
  ALL_LICENSES: '/all-licenses',
  LOADING_DEMO: '/loading-demo'
} as const;

export const STORAGE_KEYS = {
  USER: 'user',
  LICENSES: 'licenses',
  SHARED_LINKS: 'sharedLinks',
  REMINDERS: 'reminders',
  SETTINGS: 'settings',
  CUSTOM_REMINDERS: 'customReminders'
} as const;

export const LICENSE_STATUS = {
  VALID: 'valid',
  EXPIRING: 'expiring',
  EXPIRED: 'expired',
  CRITICAL: 'critical'
} as const;

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
} as const;

export const NEPAL_PROVINCES = [
  'Province No. 1',
  'Madhesh Province',
  'Bagmati Province',
  'Gandaki Province',
  'Lumbini Province',
  'Karnali Province',
  'Sudurpashchim Province'
] as const;

export const ISSUING_AUTHORITIES = [
  'Department of Transport Management',
  'Kathmandu Transport Management Office',
  'Lalitpur Transport Management Office',
  'Bhaktapur Transport Management Office',
  'Pokhara Transport Management Office',
  'Chitwan Transport Management Office',
  'Butwal Transport Management Office',
  'Nepalgunj Transport Management Office',
  'Dhangadhi Transport Management Office',
  'Biratnagar Transport Management Office'
] as const;