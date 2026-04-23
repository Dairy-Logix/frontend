// ============================================================
// Dairy Logix - Domain Types & Interfaces
// ============================================================

// --- Common Types ---

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totals?: Record<string, number>;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// --- User & Auth Types ---

export type UserRole = 'super_admin' | 'tenant_admin' | 'employee' | 'shopkeeper';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  tenantId?: string;
  tenantSlug?: string;
  agencyIds?: string[];
  language?: SupportedLocale;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface RegisterInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password?: string;
  role: UserRole;
  status?: UserStatus;
  tenantId?: string;
  tenantSlug?: string;
}

export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: UserStatus;
}

export interface QueryUsersParams extends PaginationParams {
  role?: UserRole;
  status?: UserStatus;
  tenantId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ResetPasswordInput {
  newPassword: string;
}

export interface SetupAccountInput {
  token: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface DecodedToken {
  userId: string;
  role: UserRole;
  tenantId?: string;
  agencyIds?: string[];
  exp: number;
  iat: number;
}

// --- Tenant Types ---

export type TenantStatus = 'active' | 'inactive' | 'suspended';
export type SubscriptionPlan = 'basic' | 'standard' | 'premium' | 'enterprise';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: Address;
  logo?: string;
  status: TenantStatus;
  plan: SubscriptionPlan;
  config: TenantConfig;
  agencyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantConfig {
  features: TenantFeatures;
  limits: TenantLimits;
  branding: TenantBranding;
  invoiceSettings: InvoiceSettings;
  notificationChannels: NotificationChannel[];
  defaultLanguage: SupportedLocale;
  timezone: string;
  currencyFormat: string;
}

export interface TenantFeatures {
  gpsTracking: boolean;
  pushNotifications: boolean;
  advancedAnalytics: boolean;
  bulkImport: boolean;
  photoProofDelivery: boolean;
}

export interface TenantLimits {
  maxAgencies: number;
  maxEmployees: number;
  maxShopkeepers: number;
}

export interface TenantBranding {
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string;
  favicon?: string;
}

export interface InvoiceSettings {
  taxEnabled: boolean;
  taxPercentage: number;
  invoicePrefix: string;
  invoiceNumberFormat: string;
  termsAndConditions?: string;
}

export interface CreateTenantInput {
  name: string;
  slug?: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: Address;
  plan: SubscriptionPlan;
  config?: Partial<TenantConfig>;
}

export interface UpdateTenantInput {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: Address;
  logo?: string;
  status?: TenantStatus;
  plan?: SubscriptionPlan;
  config?: Partial<TenantConfig>;
}

export interface TenantSettings {
  id: string;
  tenantId: string;
  config: TenantConfig;
  updatedAt: string;
}

export interface UpdateSettingsInput {
  features?: Partial<TenantFeatures>;
  limits?: Partial<TenantLimits>;
  branding?: Partial<TenantBranding>;
  invoiceSettings?: Partial<InvoiceSettings>;
  notificationChannels?: NotificationChannel[];
  defaultLanguage?: SupportedLocale;
  timezone?: string;
  currencyFormat?: string;
}

// --- Agency Types ---

export type AgencyType = 'AM' | 'PM';

export interface Agency {
  id: string;
  tenantId: string;
  name: string;
  location: string;
  agencyType: AgencyType;
  address?: Address;
  contactPerson?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  isAcceptingOrders: boolean;
  employeeCount: number;
  shopkeeperCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgencyInput {
  name: string;
  location: string;
  agencyType: AgencyType;
  address?: Address;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

export interface UpdateAgencyInput {
  name?: string;
  location?: string;
  agencyType?: AgencyType;
  address?: Address;
  contactPerson?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface QueryAgenciesParams extends PaginationParams {
  agencyType?: AgencyType;
  isActive?: boolean;
  search?: string;
}

// --- Product Types ---

export type ProductCategory = 'Crate' | 'Box';

export interface Product {
  id: string;
  productCode: string;
  name: string;
  shortName: string;
  category: ProductCategory;
  quantityPerUnit: number;
  purchasePricePerUnit: number;
  sellingPricePerUnit: number;
  isActive: boolean;
  tenantId: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  productCode: string;
  name: string;
  shortName: string;
  category: ProductCategory;
  quantityPerUnit: number;
  purchasePricePerUnit: number;
  sellingPricePerUnit: number;
  description?: string;
}

export interface UpdateProductInput {
  productCode?: string;
  name?: string;
  shortName?: string;
  category?: ProductCategory;
  quantityPerUnit?: number;
  purchasePricePerUnit?: number;
  sellingPricePerUnit?: number;
  isActive?: boolean;
  description?: string;
}

export interface QueryProductsParams extends PaginationParams {
  category?: ProductCategory;
  isActive?: boolean;
  search?: string;
}

// --- Shopkeeper Types ---

export interface Shop {
  id: string;
  tenantId: string;
  amAgencyId?: string;
  amAgency?: Agency;
  pmAgencyId?: string;
  pmAgency?: Agency;
  userId?: string;
  ownerName: string;
  shopName: string;
  phone: string;
  email?: string;
  address: Address;
  area: string;
  zone?: string;
  route?: ShopRoute;
  routeId?: string;
  assignedEmployeeId?: string;
  assignedEmployee?: Employee;
  openingBalance: number;
  currentBalance: number;
  walletBalance: number;
  isActive: boolean;
  hasLoginAccess: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShopRoute {
  id: string;
  tenantId: string;
  agencyId: string;
  name: string;
  description?: string;
  shopCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShopkeeperInput {
  amAgencyId?: string;
  amAgencyName?: string;
  pmAgencyId?: string;
  pmAgencyName?: string;
  ownerName: string;
  shopName: string;
  phone: string;
  email?: string;
  address: Address;
  area: string;
  zone?: string;
  routeId?: string;
  openingBalance?: number;
  password?: string;
}

export interface UpdateShopkeeperInput {
  amAgencyId?: string;
  amAgencyName?: string;
  pmAgencyId?: string;
  pmAgencyName?: string;
  ownerName?: string;
  shopName?: string;
  phone?: string;
  email?: string;
  address?: Address;
  area?: string;
  zone?: string;
  routeId?: string;
  assignedEmployeeId?: string | null;
  isActive?: boolean;
  password?: string;
}

export interface QueryShopkeepersParams extends PaginationParams {
  agencyId?: string;
  routeId?: string;
  assignedEmployeeId?: string;
  isActive?: boolean;
  area?: string;
  zone?: string;
  search?: string;
}

// --- Employee Types ---

export type EmployeeRole = 'collector' | 'delivery' | 'both';

export interface Employee {
  id: string;
  tenantId: string;
  userId: string;
  user?: User;
  name: string;
  phone: string;
  email?: string;
  employeeRole: EmployeeRole;
  assignedShopCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeAssignment {
  id: string;
  employeeId: string;
  shopId: string;
  employee?: Employee;
  shop?: Shop;
  assignedAt: string;
}

export interface CreateEmployeeInput {
  name: string;
  phone: string;
  email?: string;
  employeeRole: EmployeeRole;
  password: string;
}

export interface UpdateEmployeeInput {
  name?: string;
  phone?: string;
  email?: string;
  employeeRole?: EmployeeRole;
  isActive?: boolean;
}

export interface QueryEmployeesParams extends PaginationParams {
  employeeRole?: EmployeeRole;
  isActive?: boolean;
  search?: string;
}

// --- Order Types ---

export type OrderStatus = 'placed' | 'pending' | 'confirmed' | 'processing' | 'ready' | 'dispatched' | 'delivered' | 'completed' | 'returned';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  tenantId: string;
  agencyId: string;
  agency?: Agency;
  shopId: string;
  shop?: Shop;
  shopkeeperName?: string;
  orderNumber: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  placedAt: string;
  confirmedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  agencyId: string;
  shopId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  notes?: string;
}

export interface UpdateOrderInput {
  status?: OrderStatus;
  items?: {
    productId: string;
    quantity: number;
  }[];
  notes?: string;
}

export interface QueryOrdersParams extends PaginationParams {
  agencyId?: string;
  shopId?: string;
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// --- Invoice Types ---

export type InvoiceStatus = 'unpaid' | 'paid' | 'partially_paid';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  agencyId: string;
  agency?: Agency;
  shopId: string;
  shop?: Shop;
  shopkeeperName?: string;
  orderId?: string;
  order?: Order;
  deliveryId?: string;
  invoiceNumber: string;
  items: InvoiceItem[];
  status: InvoiceStatus;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate?: string;
  notes?: string;
  issuedAt: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceInput {
  agencyId: string;
  shopId: string;
  orderId?: string;
  deliveryId?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
  dueDate?: string;
  notes?: string;
}

export interface QueryInvoicesParams extends PaginationParams {
  agencyId?: string;
  shopId?: string;
  status?: InvoiceStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// --- Payment Types ---

export type PaymentType = 'online' | 'offline' | 'cash' | 'cheque' | 'upi' | 'card' | 'wallet';
export type PaymentStatus = 'pending' | 'confirmed' | 'completed' | 'rejected' | 'failed' | 'cancelled';

export interface Payment {
  id: string;
  tenantId: string;
  agencyId: string;
  agency?: Agency;
  agencyName?: string;
  shopId: string;
  shop?: Shop;
  shopkeeperName?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  invoice?: Invoice;
  collectedById?: string;
  collectedBy?: Employee;
  amount: number;
  paymentType: PaymentType;
  referenceNumber?: string;
  transactionId?: string;
  notes?: string;
  status: PaymentStatus;
  paymentNumber?: string;
  collectedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentCollection {
  id: string;
  employeeId: string;
  employee?: Employee;
  date: string;
  totalCollected: number;
  onlineAmount: number;
  offlineAmount: number;
  paymentCount: number;
  payments: Payment[];
}

export interface PaymentAllocation {
  paymentId: string;
  paymentNumber: string;
  invoiceNumber: string;
  invoiceId: string;
  amount: number;
}

export interface GroupedCollection {
  _id: string;
  collectionId?: string;
  collectedAt: string;
  shopkeeperId: string;
  shopkeeperName: string;
  agencyId?: string;
  agencyName?: string;
  collectedById?: string;
  collectedByName?: string;
  paymentType: PaymentType;
  notes?: string;
  walletCredited?: number;
  walletUsed?: number;
  invoiceTotal: number;
  totalAmount: number;
  allocations: PaymentAllocation[];
}

export interface CreatePaymentInput {
  agencyId: string;
  agencyName?: string;
  shopId: string;
  shopkeeperName?: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paymentType: PaymentType;
  referenceNumber?: string;
  transactionId?: string;
  notes?: string;
}

export interface QueryPaymentsParams extends PaginationParams {
  agencyId?: string;
  shopId?: string;
  invoiceId?: string;
  collectedById?: string;
  status?: PaymentStatus;
  paymentType?: PaymentType;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// --- Delivery Types ---

export type DeliveryStatus = 'pending' | 'scheduled' | 'dispatched' | 'in_transit' | 'delivered' | 'failed' | 'returned';

export interface DeliveryTracking {
  id: string;
  deliveryId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  status: DeliveryStatus;
  notes?: string;
}

export interface Delivery {
  id: string;
  tenantId: string;
  agencyId: string;
  agencyName?: string;
  agency?: Agency;
  orderId?: string;
  order?: Order;
  employeeId?: string;
  employee?: Employee;
  employeeName?: string;
  status: DeliveryStatus;
  scheduledDate: string;
  deliveredAt?: string;
  photoProof?: string;
  trackingHistory: DeliveryTracking[];
  routeShops: { shopId: string; shopName?: string; shop?: Shop; sequence: number; status?: string }[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliveryInput {
  agencyId: string;
  agencyName?: string;
  employeeId?: string;
  employeeName?: string;
  scheduledDate?: string;
  routeShops: { shopId: string; shopName?: string; sequence: number }[];
  notes?: string;
}

export interface UpdateDeliveryInput {
  status?: DeliveryStatus;
  photoProof?: string;
  notes?: string;
}

export interface QueryDeliveriesParams extends PaginationParams {
  agencyId?: string;
  orderId?: string;
  employeeId?: string;
  status?: DeliveryStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// --- Factory Types ---

export type FactoryOrderStatus = 'draft' | 'sent' | 'confirmed' | 'fulfilled' | 'cancelled';

export interface FactoryProduct {
  id: string;
  tenantId: string;
  factoryName: string;
  productId: string;
  product?: Product;
  factoryPrice: number;
  factorySku?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FactoryOrder {
  id: string;
  tenantId: string;
  agencyId?: string;
  agency?: Agency;
  poNumber: string;
  factoryName: string;
  items: FactoryOrderItem[];
  status: FactoryOrderStatus;
  totalAmount: number;
  notes?: string;
  orderedAt: string;
  confirmedAt?: string;
  fulfilledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FactoryOrderItem {
  id: string;
  factoryOrderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  factoryPrice: number;
  totalPrice: number;
}

export interface FactoryPayment {
  id: string;
  tenantId: string;
  factoryOrderId?: string;
  factoryOrder?: FactoryOrder;
  factoryName: string;
  amount: number;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFactoryOrderInput {
  agencyId?: string;
  factoryName: string;
  items: {
    productId: string;
    quantity: number;
    factoryPrice: number;
  }[];
  notes?: string;
}

export interface CreateFactoryPaymentInput {
  factoryOrderId?: string;
  factoryName: string;
  amount: number;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
}

// --- Notification Types ---

export type NotificationChannel = 'in_app' | 'push';
export type NotificationEventType =
  | 'order_placed'
  | 'order_confirmed'
  | 'delivery_dispatched'
  | 'invoice_generated'
  | 'payment_reminder'
  | 'payment_received';

export interface Notification {
  id: string;
  tenantId?: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  channel: NotificationChannel;
  eventType?: NotificationEventType;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  tenantId: string;
  eventType: NotificationEventType;
  channels: NotificationChannel[];
  templateSubject?: string;
  templateBody?: string;
  isActive: boolean;
}

export interface CreateNotificationInput {
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  channel?: NotificationChannel;
  data?: Record<string, unknown>;
}

// --- Report Types ---

export type ReportType =
  | 'sales_summary'
  | 'product_sales'
  | 'shopkeeper_sales'
  | 'agency_comparison'
  | 'collection_efficiency'
  | 'employee_collection'
  | 'aging_analysis'
  | 'delivery_performance'
  | 'profit_loss'
  | 'outstanding_receivables'
  | 'cash_flow';

export interface ReportFilter {
  dateFrom: string;
  dateTo: string;
  agencyId?: string;
  productId?: string;
  shopId?: string;
  employeeId?: string;
  status?: string;
}

export interface Report {
  id: string;
  tenantId: string;
  type: ReportType;
  title: string;
  filters: ReportFilter;
  generatedAt: string;
  data: unknown;
}

export interface AnalyticsData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }[];
}

// --- Dashboard Types ---

export interface SuperAdminDashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalShopkeepers: number;
  totalOrdersToday: number;
  totalOrdersWeek: number;
  totalOrdersMonth: number;
  revenueOverview: number;
  tenantGrowth: AnalyticsData;
  recentActivity: DashboardActivity[];
}

export interface TenantDashboardStats {
  ordersToday: number;
  pendingDeliveries: number;
  pendingCollections: number;
  totalShopkeepers: number;
  activeEmployees: number;
  revenueThisMonth: number;
  outstandingPayments: number;
  dailyOrderTrend: AnalyticsData;
  productSales: AnalyticsData;
  collectionVsOutstanding: AnalyticsData;
}

export interface DashboardActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  userId?: string;
  tenantId?: string;
}

// --- Shared Types ---

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

export type SupportedLocale = 'en' | 'hi' | 'gu';

// --- UI/Component Types ---

export interface FilterOption {
  label: string;
  value: string;
}

export interface ActiveFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: unknown;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

export interface TableColumn<T = unknown> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
}

export interface TableProps<T = unknown> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  sorting?: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSort: (sortBy: string) => void;
  };
  selection?: {
    selectedRows: Set<string>;
    onSelectionChange: (selectedRows: Set<string>) => void;
  };
  actions?: {
    view?: (row: T) => void;
    edit?: (row: T) => void;
    delete?: (row: T) => void;
  };
}
