// ============================================================
// Mock Data for the Super Admin Dashboard
// ============================================================

export const mockPlatformStats = {
  totalTenants: 7,
  activeTenants: 5,
  totalShopkeepers: 1842,
  totalOrders: 12650,
  totalRevenue: 4875000,
  totalDeliveries: 11230,
  collectionRate: 87.5,
};

export const mockTenantGrowthData: { month: string; tenants: number }[] = [
  { month: 'Sep 2025', tenants: 2 },
  { month: 'Oct 2025', tenants: 3 },
  { month: 'Nov 2025', tenants: 4 },
  { month: 'Dec 2025', tenants: 6 },
  { month: 'Jan 2026', tenants: 7 },
  { month: 'Feb 2026', tenants: 7 },
];

export const mockRevenueData: { month: string; revenue: number }[] = [
  { month: 'Sep 2025', revenue: 520000 },
  { month: 'Oct 2025', revenue: 645000 },
  { month: 'Nov 2025', revenue: 710000 },
  { month: 'Dec 2025', revenue: 890000 },
  { month: 'Jan 2026', revenue: 1025000 },
  { month: 'Feb 2026', revenue: 1085000 },
];

export const mockRecentActivity: {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  tenantName: string;
}[] = [
  {
    id: 'activity-1',
    type: 'tenant_signup',
    message: 'New tenant registered on the platform.',
    timestamp: '2026-02-09T16:30:00.000Z',
    tenantName: 'Parag Milk Foods',
  },
  {
    id: 'activity-2',
    type: 'order_placed',
    message: 'Bulk order of 250 units placed by store in Anand.',
    timestamp: '2026-02-09T14:15:00.000Z',
    tenantName: 'Gujarat Milk Co',
  },
  {
    id: 'activity-3',
    type: 'payment_collected',
    message: 'Payment of INR 45,000 collected from Route A stores.',
    timestamp: '2026-02-09T11:45:00.000Z',
    tenantName: 'Shree Krishna Dairy',
  },
  {
    id: 'activity-4',
    type: 'delivery_completed',
    message: '18 deliveries completed across Bengaluru South zone.',
    timestamp: '2026-02-08T17:20:00.000Z',
    tenantName: 'Nandini Dairy Products',
  },
  {
    id: 'activity-5',
    type: 'plan_upgrade',
    message: 'Subscription upgraded from Standard to Premium.',
    timestamp: '2026-02-08T10:00:00.000Z',
    tenantName: 'Parag Milk Foods',
  },
  {
    id: 'activity-6',
    type: 'tenant_suspended',
    message: 'Tenant account suspended due to overdue payment.',
    timestamp: '2026-02-07T09:30:00.000Z',
    tenantName: 'Verka Punjab Dairy',
  },
  {
    id: 'activity-7',
    type: 'order_placed',
    message: 'New recurring order set up for 30 shops on MG Road route.',
    timestamp: '2026-02-06T13:10:00.000Z',
    tenantName: 'Nandini Dairy Products',
  },
  {
    id: 'activity-8',
    type: 'payment_collected',
    message: 'Outstanding balance of INR 1,20,000 settled by store cluster.',
    timestamp: '2026-02-06T08:50:00.000Z',
    tenantName: 'Amul Fresh Distributors',
  },
  {
    id: 'activity-9',
    type: 'employee_added',
    message: '3 new delivery employees onboarded for Anand district.',
    timestamp: '2026-02-05T15:40:00.000Z',
    tenantName: 'Gujarat Milk Co',
  },
  {
    id: 'activity-10',
    type: 'invoice_generated',
    message: 'Monthly invoices generated for 120 stores.',
    timestamp: '2026-02-01T06:00:00.000Z',
    tenantName: 'Shree Krishna Dairy',
  },
];

export const mockTenantStats: {
  tenantId: string;
  tenantName: string;
  orders: number;
  revenue: number;
  shopkeepers: number;
  status: 'active' | 'inactive' | 'suspended';
}[] = [
  {
    tenantId: 'tenant-1',
    tenantName: 'Shree Krishna Dairy',
    orders: 2340,
    revenue: 985000,
    shopkeepers: 320,
    status: 'active',
  },
  {
    tenantId: 'tenant-2',
    tenantName: 'Gujarat Milk Co',
    orders: 4120,
    revenue: 1620000,
    shopkeepers: 580,
    status: 'active',
  },
  {
    tenantId: 'tenant-3',
    tenantName: 'Amul Fresh Distributors',
    orders: 1560,
    revenue: 540000,
    shopkeepers: 175,
    status: 'active',
  },
  {
    tenantId: 'tenant-4',
    tenantName: 'Nandini Dairy Products',
    orders: 2890,
    revenue: 1120000,
    shopkeepers: 410,
    status: 'active',
  },
  {
    tenantId: 'tenant-5',
    tenantName: 'Mother Dairy Express',
    orders: 230,
    revenue: 78000,
    shopkeepers: 42,
    status: 'inactive',
  },
  {
    tenantId: 'tenant-6',
    tenantName: 'Verka Punjab Dairy',
    orders: 680,
    revenue: 215000,
    shopkeepers: 115,
    status: 'suspended',
  },
  {
    tenantId: 'tenant-7',
    tenantName: 'Parag Milk Foods',
    orders: 830,
    revenue: 317000,
    shopkeepers: 200,
    status: 'active',
  },
];
