// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
export const API_TIMEOUT = 30000;
export const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'dairylogics.com';

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// File Upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// Date Formats
export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATETIME_FORMAT = 'MMM dd, yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

// Validation
export const PASSWORD_MIN_LENGTH = 8;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

// i18n
export const SUPPORTED_LOCALES = ['en', 'hi', 'gu'] as const;
export const DEFAULT_LOCALE = 'en';
export const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'हिन्दी',
  gu: 'ગુજરાતી',
};

// Routes - Super Admin
export const SUPER_ADMIN_ROUTES = {
  DASHBOARD: '/admin/dashboard',
  TENANTS: '/admin/tenants',
  TENANT_DETAIL: (id: string) => `/admin/tenants/${id}`,
  TENANT_CREATE: '/admin/tenants/create',
  CONFIGURATIONS: '/admin/configurations',
  NOTIFICATIONS: '/admin/notifications',
  REPORTS: '/admin/reports',
  SETTINGS: '/admin/settings',
} as const;

// Routes - Tenant Admin
export const TENANT_ROUTES = {
  DASHBOARD: '/dashboard',
  AGENCIES: '/agencies',
  AGENCY_DETAIL: (id: string) => `/agencies/${id}`,
  PRODUCTS: '/products',
  PRODUCT_CATEGORIES: '/products/categories',
  SHOPKEEPERS: '/shopkeepers',
  SHOPKEEPER_DETAIL: (id: string) => `/shopkeepers/${id}`,
  EMPLOYEES: '/employees',
  EMPLOYEE_DETAIL: (id: string) => `/employees/${id}`,
  ORDERS: '/orders',
  ORDER_DETAIL: (id: string) => `/orders/${id}`,
  INVOICES: '/invoices',
  INVOICE_DETAIL: (id: string) => `/invoices/${id}`,
  PAYMENTS: '/payments',
  PAYMENT_COLLECTIONS: '/payments/collections',
  DELIVERIES: '/deliveries',
  DELIVERY_TRACKING: '/deliveries/tracking',
  PURCHASES: '/purchases',
  REPORTS: '/reports',
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings',
} as const;

// Routes - Auth
export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
} as const;

// Order Status Flow
export const ORDER_STATUS = {
  PLACED: 'placed',
  CONFIRMED: 'confirmed',
  DISPATCHED: 'dispatched',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  completed: 'Completed',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-cyan-100 text-cyan-800',
  dispatched: 'bg-yellow-100 text-yellow-800',
  delivered: 'bg-green-100 text-green-800',
  completed: 'bg-emerald-100 text-emerald-800',
};

// Invoice Status
export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  PARTIALLY_PAID: 'partially_paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  partially_paid: 'Partially Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

// Payment Types
export const PAYMENT_TYPE = {
  ONLINE: 'online',
  OFFLINE: 'offline',
} as const;

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  online: 'Online',
  offline: 'Cash/Offline',
};

// Delivery Status
export const DELIVERY_STATUS = {
  PENDING: 'pending',
  DISPATCHED: 'dispatched',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  FAILED: 'failed',
} as const;

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  dispatched: 'Dispatched',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  failed: 'Failed',
};

// Tenant Status
export const TENANT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
} as const;

// User Roles
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  EMPLOYEE: 'employee',
  SHOPKEEPER: 'shopkeeper',
} as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  tenant_admin: 'Tenant Admin',
  employee: 'Employee',
  shopkeeper: 'Store',
};

// Employee Roles
export const EMPLOYEE_ROLES = {
  COLLECTOR: 'collector',
  DELIVERY: 'delivery',
  BOTH: 'both',
} as const;

export const EMPLOYEE_ROLE_LABELS: Record<string, string> = {
  collector: 'Collection Agent',
  delivery: 'Delivery Agent',
  both: 'Collection & Delivery',
};

// Agency Types
export const AGENCY_TYPES = {
  AM: 'AM',
  PM: 'PM',
} as const;

export const AGENCY_TYPE_LABELS: Record<string, string> = {
  AM: 'Morning Distribution',
  PM: 'Evening Distribution',
};

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  BASIC: 'basic',
  STANDARD: 'standard',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
} as const;

export const SUBSCRIPTION_PLAN_LABELS: Record<string, string> = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
  enterprise: 'Enterprise',
};

// Toast Duration
export const TOAST_DURATION = 3000;
export const TOAST_ERROR_DURATION = 5000;

// WebSocket Events
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  NEW_ORDER: 'order:new',
  ORDER_UPDATE: 'order:update',
  DELIVERY_UPDATE: 'delivery:update',
  PAYMENT_UPDATE: 'payment:update',
  NOTIFICATION: 'notification',
} as const;

// Product Categories
export const PRODUCT_CATEGORIES = ['Crate', 'Piece'] as const;
export const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  Crate: 'Crate',
  Piece: 'Piece',
};
