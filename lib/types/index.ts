// ============================================================
// BeatMitra - Domain Types & Interfaces
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
export type SubscriptionPlan = 'basic' | 'standard' | 'premium';
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'locked'
  | 'cancelled';

export interface SubscriptionFeatures {
  employees: boolean;
  deliveries: boolean;
  gpsTracking: boolean;
  photoProofDelivery: boolean;
  bulkImport: boolean;
  advancedAnalytics: boolean;
  pushNotifications: boolean;
  appNotifications: boolean;
}

export interface SubscriptionLimits {
  maxAgencies: number;
  maxShopkeepers: number;
  maxProducts: number;
  maxUsers: number;
  maxOrdersPerMonth: number;
}

export interface SubscriptionHistoryEntry {
  planSlug: SubscriptionPlan;
  startedAt: string;
  endedAt?: string;
  amountPaid: number;
  paymentReference?: string;
  activatedBy?: string;
  features?: SubscriptionFeatures;
  limits?: SubscriptionLimits;
  note?: string;
}

export interface PlanPreset {
  slug: SubscriptionPlan;
  label: string;
  description: string;
  price: number;
  currency: 'INR';
  durationDays: number | null;
  dataRetentionMinutes: number | null;
  features: SubscriptionFeatures;
  limits: SubscriptionLimits;
}

export interface FeatureCatalogEntry {
  key: keyof SubscriptionFeatures;
  label: string;
  description: string;
  category: 'Operations' | 'Productivity' | 'Reporting' | 'Notifications';
}

export interface Tenant {
  id: string;
  _id?: string;
  name: string;
  companyName?: string;
  slug: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: Address;
  logo?: string;
  status: TenantStatus;
  plan: SubscriptionPlan;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  amountPaid?: number;
  paymentReference?: string;
  features?: SubscriptionFeatures;
  limits?: SubscriptionLimits;
  subscriptionHistory?: SubscriptionHistoryEntry[];
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
  orderPrint?: OrderPrintConfig;
  orderPrintTemplates?: OrderPrintTemplate[];
}

export interface OrderPrintConfig {
  enabledProductIds: string[];
  enabledStoresByAgency: Record<string, string[]>;
}

export type PrintOrientation = 'portrait' | 'landscape';

export interface OrderPrintMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface OrderPrintTemplate {
  id: string;
  name: string;
  orientation: PrintOrientation;
  margins: OrderPrintMargins;
  showTitle: boolean;
  titleText: string;
  enabledProductIds: string[];
  enabledStoresByAgency: Record<string, string[]>;
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
  orderPrint?: Partial<OrderPrintConfig>;
  orderPrintTemplates?: OrderPrintTemplate[];
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

export type ProductCategory = 'Crate' | 'Piece';

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
  quantityPerUnit?: number;
  unitPrice: number;
  pricePerUnit?: number;
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
  adjustments?: InvoiceAdjustment[];
  source?: 'order' | 'transfer';
  status: InvoiceStatus;
  subtotal: number;
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

export interface InvoiceAdjustmentItem {
  productName: string;
  productCode: string;
  quantity: number;
  unit: string;
  quantityPerUnit?: number;
  unitPrice: number;
  price: number;
  subtotal: number;
}

export interface InvoiceAdjustment {
  type: 'transfer_in' | 'transfer_out';
  transferId: string;
  transferNumber: string;
  counterpartyShopkeeperId: string;
  counterpartyShopkeeperName: string;
  items: InvoiceAdjustmentItem[];
  amount: number;
  date: string;
  notes?: string;
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

// --- Purchase Types ---

export interface PurchaseItem {
  productId: string | { _id: string; name?: string; code?: string; price?: number; unit?: string };
  quantity: number;
}

export interface Purchase {
  _id: string;
  purchaseNumber: string;
  agencyId: string | { _id: string; name?: string; code?: string };
  purchaseDate: string;
  items: PurchaseItem[];
  basicAmount: number;
  taxAmount: number;
  subsidy: number;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseItemInput {
  productId: string;
  quantity: number;
}

export interface CreatePurchaseInput {
  purchaseNumber?: string;
  agencyId: string;
  purchaseDate: string;
  items: CreatePurchaseItemInput[];
  taxAmount?: number;
  subsidy?: number;
}

export interface BulkCreatePurchasesInput {
  purchases: CreatePurchaseInput[];
}

// --- Notification Types ---

export type NotificationChannel = 'in_app' | 'push';
export type NotificationEventType =
  | 'order_placed'
  | 'order_confirmed'
  | 'delivery_dispatched'
  | 'invoice_generated'
  | 'payment_reminder'
  | 'payment_received'
  | 'invoice_transfer_in'
  | 'invoice_transfer_out'
  | 'wallet_credit';

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

// Raw notification record returned by GET /notifications/sent — uses the
// backend wire shape (ObjectId as string `_id`, snake_case enum `type`,
// `isRead` instead of `read`, optional populated `userId`).
export type SentNotificationType =
  | 'order_created'
  | 'order_confirmed'
  | 'order_delivered'
  | 'payment_received'
  | 'invoice_generated'
  | 'invoice_overdue'
  | 'delivery_scheduled'
  | 'delivery_completed'
  | 'stock_low'
  | 'stock_out'
  | 'production_completed'
  | 'quality_check_failed'
  | 'invoice_transfer_in'
  | 'invoice_transfer_out'
  | 'wallet_credit'
  | 'system';

export type SentNotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SentNotification {
  _id: string;
  tenantId: string;
  tenantSlug: string;
  type: SentNotificationType;
  title: string;
  message: string;
  priority?: SentNotificationPriority;
  userId:
    | string
    | {
        _id: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        role?: string;
      }
    | null;
  userName?: string;
  isRead: boolean;
  readAt?: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  createdAt: string;
  updatedAt?: string;
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
  pendingPlacedOrders: number;
  pendingCollections: number;
  activeShopkeepers: number;
  activeEmployees: number;
  outstandingPayments: number;
  dailyOrderTrend: AnalyticsData;
  productSales: AnalyticsData;
  collectionVsOutstanding: AnalyticsData;
}

// --- Analytics (dashboard charts) ---

export type AnalyticsRange = 'day' | 'week' | 'month' | 'year' | 'custom';

export interface AnalyticsQuery {
  range: AnalyticsRange;
  from?: string;
  to?: string;
  agencyId?: string;
}

export interface AnalyticsAgencyOption {
  id: string;
  name: string;
  code?: string;
}

export interface DailyOrdersPoint {
  label: string;
  orders: number;
  revenue: number;
}

export interface SalesPurchaseMarginPoint {
  label: string;
  sales: number;
  purchase: number;
  profit: number;
  margin: number;
  estimated: boolean;
}

export interface TopStorePoint {
  shopkeeperId: string;
  name: string;
  revenue: number;
}

export interface ExpenseCategoryPoint {
  category: string;
  label: string;
  amount: number;
  percentage: number;
}

export interface ExpenseBreakdown {
  total: number;
  categories: ExpenseCategoryPoint[];
}

export interface ReceivablesAgingPoint {
  bucket: string;
  Paid: number;
  Partial: number;
  Unpaid: number;
  total: number;
}

export type TopProductsCriterion = 'revenue' | 'quantity' | 'profit' | 'margin';

export interface TopProductPoint {
  productId: string;
  name: string;
  code?: string;
  revenue: number;
  quantity: number;
  profit: number;
  margin: number;
}

export interface TopProductsQuery {
  criterion: TopProductsCriterion;
  days?: number;
  limit?: number;
  agencyId?: string;
}

export interface TopProductsResult {
  criterion: TopProductsCriterion;
  days: number;
  products: TopProductPoint[];
}

export interface TenantAnalytics {
  range: { type: AnalyticsRange; from: string; to: string };
  agencies: AnalyticsAgencyOption[];
  dailyOrders: DailyOrdersPoint[];
  salesPurchaseMargin: SalesPurchaseMarginPoint[];
  topStores: TopStorePoint[];
  expenseBreakdown: ExpenseBreakdown;
  receivablesAging: ReceivablesAgingPoint[];
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

// --- Expense Types ---

export type ExpenseCategory =
  | 'vehicle_fuel'
  | 'vehicle_maintenance'
  | 'employee_salary'
  | 'product_loss'
  | 'rent'
  | 'utilities'
  | 'office'
  | 'other';

export type ExpensePaymentMode = 'cash' | 'bank' | 'upi' | 'cheque';

export type ExpenseReferenceType = 'vehicle' | 'employee' | 'product';

export interface Expense {
  id: string;
  _id?: string;
  expenseNumber: string;
  category: ExpenseCategory;
  subcategory?: string;
  amount: number;
  date: string;
  paymentMode: ExpensePaymentMode;
  description?: string;
  vendorName?: string;
  agencyId?: string;
  agencyName?: string;
  referenceId?: string;
  referenceType?: ExpenseReferenceType;
  attachmentUrl?: string;
  createdById?: string;
  createdByName?: string;
  isDeleted?: boolean;
  tenantId: string;
  tenantSlug: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseInput {
  category: ExpenseCategory;
  subcategory?: string;
  amount: number;
  date: string;
  paymentMode?: ExpensePaymentMode;
  description?: string;
  vendorName?: string;
  agencyId?: string;
  agencyName?: string;
  referenceId?: string;
  referenceType?: ExpenseReferenceType;
  attachmentUrl?: string;
}

export type UpdateExpenseInput = Partial<CreateExpenseInput>;

export interface QueryExpensesParams extends PaginationParams {
  category?: ExpenseCategory;
  agencyId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ExpenseSummary {
  totalAmount: number;
  totalCount: number;
  byCategory: Array<{ _id: ExpenseCategory; count: number; totalAmount: number }>;
  byMonth: Array<{ _id: { year: number; month: number }; count: number; totalAmount: number }>;
  byAgency: Array<{ _id: string; agencyName?: string; count: number; totalAmount: number }>;
}
