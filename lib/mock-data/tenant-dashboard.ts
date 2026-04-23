// ============================================================
// Mock Tenant Dashboard Data for "Shree Krishna Dairy" (tenant-1)
// ============================================================

// --- Dashboard Stats ---

export const mockTenantDashboardStats = {
  ordersToday: 4,
  pendingDeliveries: 5,
  pendingCollections: 8,
  totalShopkeepers: 15,
  activeEmployees: 8,
  revenueThisMonth: 285400,
  outstandingPayments: 37550,
};

// --- Daily Order Trend (last 14 days: Jan 28 - Feb 10, 2026) ---

export const mockDailyOrderTrend: { date: string; orders: number }[] = [
  { date: '2026-01-28', orders: 12 },
  { date: '2026-01-29', orders: 9 },
  { date: '2026-01-30', orders: 15 },
  { date: '2026-01-31', orders: 11 },
  { date: '2026-02-01', orders: 14 },
  { date: '2026-02-02', orders: 8 },
  { date: '2026-02-03', orders: 18 },
  { date: '2026-02-04', orders: 13 },
  { date: '2026-02-05', orders: 16 },
  { date: '2026-02-06', orders: 20 },
  { date: '2026-02-07', orders: 14 },
  { date: '2026-02-08', orders: 17 },
  { date: '2026-02-09', orders: 22 },
  { date: '2026-02-10', orders: 4 },
];

// --- Product Sales Data (top 6 products by revenue this month) ---

export const mockProductSalesData: {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}[] = [
  {
    productId: 'product-1',
    productName: 'Full Cream Milk',
    totalQuantity: 480,
    totalRevenue: 28800,
  },
  {
    productId: 'product-8',
    productName: 'Pure Cow Ghee',
    totalQuantity: 95,
    totalRevenue: 69825,
  },
  {
    productId: 'product-10',
    productName: 'Fresh Cottage Paneer',
    totalQuantity: 120,
    totalRevenue: 22560,
  },
  {
    productId: 'product-2',
    productName: 'Toned Milk',
    totalQuantity: 350,
    totalRevenue: 16800,
  },
  {
    productId: 'product-6',
    productName: 'Salted Table Butter',
    totalQuantity: 85,
    totalRevenue: 20570,
  },
  {
    productId: 'product-9',
    productName: 'Buffalo Ghee',
    totalQuantity: 60,
    totalRevenue: 38700,
  },
];

// --- Collection Data (last 7 days: Feb 4 - Feb 10, 2026) ---

export const mockCollectionData: {
  date: string;
  collected: number;
  outstanding: number;
}[] = [
  { date: '2026-02-04', collected: 12500, outstanding: 45200 },
  { date: '2026-02-05', collected: 18300, outstanding: 42100 },
  { date: '2026-02-06', collected: 15800, outstanding: 39500 },
  { date: '2026-02-07', collected: 22100, outstanding: 36800 },
  { date: '2026-02-08', collected: 9600, outstanding: 41200 },
  { date: '2026-02-09', collected: 16400, outstanding: 38900 },
  { date: '2026-02-10', collected: 4200, outstanding: 37550 },
];

// --- Recent Activity ---

export const mockTenantRecentActivity: {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  shopName?: string;
  employeeName?: string;
  amount?: number;
}[] = [
  {
    id: 'ta-1',
    type: 'order_placed',
    message: 'New order placed for 4 items.',
    timestamp: '2026-02-10T06:30:00.000Z',
    shopName: 'Desai Dairy Mart',
  },
  {
    id: 'ta-2',
    type: 'order_placed',
    message: 'New order placed with urgent delivery request.',
    timestamp: '2026-02-10T06:15:00.000Z',
    shopName: 'Gajera Milk & Sweets',
  },
  {
    id: 'ta-3',
    type: 'order_placed',
    message: 'New order placed for ghee and curd products.',
    timestamp: '2026-02-10T05:30:00.000Z',
    shopName: 'Mehta Dairy Fresh',
  },
  {
    id: 'ta-4',
    type: 'payment_collected',
    message: 'Payment collected via UPI.',
    timestamp: '2026-02-09T16:00:00.000Z',
    shopName: 'Kanani Dairy Products',
    employeeName: 'Kishan Makwana',
    amount: 2299.5,
  },
  {
    id: 'ta-5',
    type: 'delivery_completed',
    message: 'Delivery completed for order SKD-2026-0019.',
    timestamp: '2026-02-09T14:30:00.000Z',
    shopName: 'Shah Milk Parlour',
    employeeName: 'Arjun Thakor',
  },
  {
    id: 'ta-6',
    type: 'order_confirmed',
    message: 'Order confirmed and scheduled for dispatch.',
    timestamp: '2026-02-09T08:30:00.000Z',
    shopName: 'Naik Superstore',
  },
  {
    id: 'ta-7',
    type: 'payment_collected',
    message: 'Offline cash payment collected.',
    timestamp: '2026-02-09T11:00:00.000Z',
    shopName: 'Patel Dairy & General Store',
    employeeName: 'Mahesh Solanki',
    amount: 1079.4,
  },
  {
    id: 'ta-8',
    type: 'delivery_completed',
    message: 'Delivery completed with photo proof uploaded.',
    timestamp: '2026-02-08T15:20:00.000Z',
    shopName: 'Vohra Milk & Paneer Shop',
    employeeName: 'Neha Darji',
  },
  {
    id: 'ta-9',
    type: 'employee_added',
    message: 'New delivery employee onboarded for Main Branch.',
    timestamp: '2026-02-08T10:00:00.000Z',
    employeeName: 'Divya Chauhan',
  },
  {
    id: 'ta-10',
    type: 'payment_collected',
    message: 'Outstanding balance partially settled.',
    timestamp: '2026-02-07T17:30:00.000Z',
    shopName: 'Jadeja Milk Centre',
    employeeName: 'Pooja Limbani',
    amount: 1800,
  },
];
