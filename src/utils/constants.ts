// Application constants
export const APP_CONFIG = {
  name: 'NepLife',
  version: '1.0.0',
  description: 'Smart Driving License Management for Nepal',
  author: 'NepLife Team',
  website: 'https://neplife.com',
  supportEmail: 'support@neplife.com',
};

export const STORAGE_KEYS = {
  USER: 'user',
  LICENSES: 'licenses',
  SHARED_LINKS: 'sharedLinks',
  REMINDERS: 'reminders',
  SETTINGS: 'settings',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

export const LICENSE_TYPES = {
  MOTORCYCLE: 'Motorcycle',
  CAR: 'Car',
  HEAVY_VEHICLE: 'Heavy Vehicle',
  PUBLIC_TRANSPORT: 'Public Transport',
  INTERNATIONAL: 'International',
} as const;

export const ISSUING_AUTHORITIES = {
  NEPAL: 'Department of Transport Management',
  MAHARASHTRA: 'Maharashtra State Transport Department',
  KARNATAKA: 'Karnataka State Transport Department',
  DELHI: 'Delhi Transport Department',
  GENERIC: 'Regional Transport Office',
} as const;

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  FULL: 'EEEE, MMMM do, yyyy',
  SHORT: 'MM/dd/yyyy',
} as const;

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

export const REMINDER_INTERVALS = [30, 14, 7, 3, 1] as const;

export const FILE_CONSTRAINTS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
} as const;

export const VALIDATION_RULES = {
  LICENSE_NUMBER: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 20,
    PATTERNS: {
      NEPAL: /^(NP-\d{2}-\d{3}-\d{3}|\d{10,15})$/i,
      INDIA: /^[A-Z]{2}-\d{2}-\d{4}-\d{7}$/i,
    },
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z\s.'-]+$/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PHONE: {
    PATTERN: /^\+?[\d\s\-\(\)]{10,}$/,
  },
} as const;

export const SECURITY_CONFIG = {
  TOKEN_LENGTH: 64,
  HASH_ALGORITHM: 'SHA-256',
  ENCRYPTION_ALGORITHM: 'AES-GCM',
  KEY_DERIVATION_ITERATIONS: 100000,
} as const;

export const UI_CONFIG = {
  ANIMATION_DURATION: 200,
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
  TOAST_DURATION: 5000,
  LOADING_DELAY: 500,
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  UPLOAD: '/upload',
  ALL_LICENSES: '/all-licenses',
  SHARED_LINKS: '/shared-links',
  SHARED_LICENSE: '/shared/:shareToken',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  ANALYTICS: '/analytics',
  HELP: '/help',
  NOT_FOUND: '*',
} as const;

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

export const COLORS = {
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  SUCCESS: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  WARNING: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  ERROR: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
} as const;

export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: true,
  ENABLE_CLOUD_SYNC: false,
  ENABLE_BIOMETRIC_AUTH: false,
  ENABLE_DARK_MODE: true,
  ENABLE_MULTI_LANGUAGE: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_ADVANCED_OCR: true,
  ENABLE_BACKUP_RESTORE: true,
} as const;

export const API_ENDPOINTS = {
  BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  LONG_TTL: 60 * 60 * 1000, // 1 hour
  SHORT_TTL: 30 * 1000, // 30 seconds
} as const;