// ============================================================
// Mock Report & Analytics Data for "Shree Krishna Dairy" (tenant-1)
// ============================================================

// --- Daily Sales Report (last 30 days: Jan 12 - Feb 10, 2026) ---

export const mockSalesReportData: {
  date: string;
  orders: number;
  revenue: number;
}[] = [
  { date: '2026-01-12', orders: 14, revenue: 18200 },
  { date: '2026-01-13', orders: 11, revenue: 14800 },
  { date: '2026-01-14', orders: 16, revenue: 21300 },
  { date: '2026-01-15', orders: 13, revenue: 17500 },
  { date: '2026-01-16', orders: 18, revenue: 24100 },
  { date: '2026-01-17', orders: 10, revenue: 13200 },
  { date: '2026-01-18', orders: 7, revenue: 9400 },
  { date: '2026-01-19', orders: 15, revenue: 20100 },
  { date: '2026-01-20', orders: 19, revenue: 25400 },
  { date: '2026-01-21', orders: 12, revenue: 16300 },
  { date: '2026-01-22', orders: 17, revenue: 22800 },
  { date: '2026-01-23', orders: 14, revenue: 18900 },
  { date: '2026-01-24', orders: 20, revenue: 26700 },
  { date: '2026-01-25', orders: 8, revenue: 10500 },
  { date: '2026-01-26', orders: 22, revenue: 29400 },
  { date: '2026-01-27', orders: 16, revenue: 21600 },
  { date: '2026-01-28', orders: 12, revenue: 16100 },
  { date: '2026-01-29', orders: 9, revenue: 12200 },
  { date: '2026-01-30', orders: 15, revenue: 20300 },
  { date: '2026-01-31', orders: 11, revenue: 14900 },
  { date: '2026-02-01', orders: 14, revenue: 18800 },
  { date: '2026-02-02', orders: 8, revenue: 10700 },
  { date: '2026-02-03', orders: 18, revenue: 24200 },
  { date: '2026-02-04', orders: 13, revenue: 17600 },
  { date: '2026-02-05', orders: 16, revenue: 21500 },
  { date: '2026-02-06', orders: 20, revenue: 26900 },
  { date: '2026-02-07', orders: 14, revenue: 18700 },
  { date: '2026-02-08', orders: 17, revenue: 22900 },
  { date: '2026-02-09', orders: 22, revenue: 29600 },
  { date: '2026-02-10', orders: 4, revenue: 5400 },
];

// --- Product-wise Sales Breakdown ---

export const mockProductSalesReport: {
  productName: string;
  quantity: number;
  revenue: number;
  percentage: number;
}[] = [
  { productName: 'Pure Cow Ghee', quantity: 95, revenue: 69825, percentage: 24.5 },
  { productName: 'Buffalo Ghee', quantity: 60, revenue: 38700, percentage: 13.6 },
  { productName: 'Full Cream Milk', quantity: 480, revenue: 28800, percentage: 10.1 },
  { productName: 'Fresh Cottage Paneer', quantity: 120, revenue: 22560, percentage: 7.9 },
  { productName: 'Salted Table Butter', quantity: 85, revenue: 20570, percentage: 7.2 },
  { productName: 'Toned Milk', quantity: 350, revenue: 16800, percentage: 5.9 },
  { productName: 'Plain Curd', quantity: 200, revenue: 14000, percentage: 4.9 },
  { productName: 'Flavoured Yoghurt', quantity: 160, revenue: 12800, percentage: 4.5 },
  { productName: 'Buttermilk (Chaas)', quantity: 320, revenue: 9600, percentage: 3.4 },
  { productName: 'Cream (Malai)', quantity: 75, revenue: 8250, percentage: 2.9 },
];

// --- Top 10 Stores by Revenue ---

export const mockStoreSalesReport: {
  storeName: string;
  orders: number;
  revenue: number;
  outstanding: number;
}[] = [
  { storeName: 'Desai Dairy Mart', orders: 28, revenue: 42500, outstanding: 5200 },
  { storeName: 'Patel Dairy & General Store', orders: 25, revenue: 38200, outstanding: 3800 },
  { storeName: 'Shah Milk Parlour', orders: 22, revenue: 34600, outstanding: 2100 },
  { storeName: 'Gajera Milk & Sweets', orders: 20, revenue: 31400, outstanding: 4500 },
  { storeName: 'Mehta Dairy Fresh', orders: 18, revenue: 28700, outstanding: 1200 },
  { storeName: 'Kanani Dairy Products', orders: 17, revenue: 25900, outstanding: 6300 },
  { storeName: 'Naik Superstore', orders: 15, revenue: 22100, outstanding: 800 },
  { storeName: 'Vohra Milk & Paneer Shop', orders: 14, revenue: 19800, outstanding: 3200 },
  { storeName: 'Jadeja Milk Centre', orders: 12, revenue: 17400, outstanding: 5600 },
  { storeName: 'Rathod Provisions', orders: 10, revenue: 14200, outstanding: 4850 },
];

// --- Agency Comparison ---

export const mockAgencyComparison: {
  agencyName: string;
  orders: number;
  revenue: number;
  employees: number;
  stores: number;
}[] = [
  { agencyName: 'Main Branch - Rajkot', orders: 98, revenue: 152400, employees: 4, stores: 8 },
  { agencyName: 'South Zone - Jamnagar', orders: 65, revenue: 89200, employees: 2, stores: 4 },
  { agencyName: 'West Hub - Junagadh', orders: 30, revenue: 43800, employees: 2, stores: 3 },
];

// --- Collection Efficiency (last 30 days) ---

export const mockCollectionReport: {
  date: string;
  target: number;
  collected: number;
  percentage: number;
}[] = [
  { date: '2026-01-12', target: 20000, collected: 17200, percentage: 86.0 },
  { date: '2026-01-13', target: 18000, collected: 15800, percentage: 87.8 },
  { date: '2026-01-14', target: 22000, collected: 19600, percentage: 89.1 },
  { date: '2026-01-15', target: 19000, collected: 16100, percentage: 84.7 },
  { date: '2026-01-16', target: 25000, collected: 22800, percentage: 91.2 },
  { date: '2026-01-17', target: 15000, collected: 12400, percentage: 82.7 },
  { date: '2026-01-18', target: 10000, collected: 8900, percentage: 89.0 },
  { date: '2026-01-19', target: 21000, collected: 18700, percentage: 89.0 },
  { date: '2026-01-20', target: 26000, collected: 24100, percentage: 92.7 },
  { date: '2026-01-21', target: 17000, collected: 14600, percentage: 85.9 },
  { date: '2026-01-22', target: 23000, collected: 21200, percentage: 92.2 },
  { date: '2026-01-23', target: 20000, collected: 17800, percentage: 89.0 },
  { date: '2026-01-24', target: 27000, collected: 25400, percentage: 94.1 },
  { date: '2026-01-25', target: 12000, collected: 9800, percentage: 81.7 },
  { date: '2026-01-26', target: 30000, collected: 28200, percentage: 94.0 },
  { date: '2026-01-27', target: 22000, collected: 19600, percentage: 89.1 },
  { date: '2026-01-28', target: 17000, collected: 14800, percentage: 87.1 },
  { date: '2026-01-29', target: 13000, collected: 11200, percentage: 86.2 },
  { date: '2026-01-30', target: 21000, collected: 18900, percentage: 90.0 },
  { date: '2026-01-31', target: 16000, collected: 13800, percentage: 86.3 },
  { date: '2026-02-01', target: 20000, collected: 17400, percentage: 87.0 },
  { date: '2026-02-02', target: 11000, collected: 9200, percentage: 83.6 },
  { date: '2026-02-03', target: 25000, collected: 23100, percentage: 92.4 },
  { date: '2026-02-04', target: 18000, collected: 15600, percentage: 86.7 },
  { date: '2026-02-05', target: 22000, collected: 20100, percentage: 91.4 },
  { date: '2026-02-06', target: 27000, collected: 25200, percentage: 93.3 },
  { date: '2026-02-07', target: 19000, collected: 16800, percentage: 88.4 },
  { date: '2026-02-08', target: 23000, collected: 20600, percentage: 89.6 },
  { date: '2026-02-09', target: 30000, collected: 28400, percentage: 94.7 },
  { date: '2026-02-10', target: 6000, collected: 4200, percentage: 70.0 },
];

// --- Employee Collection Performance ---

export const mockEmployeeCollectionReport: {
  name: string;
  collected: number;
  target: number;
  efficiency: number;
  payments: number;
}[] = [
  { name: 'Kishan Makwana', collected: 128400, target: 140000, efficiency: 91.7, payments: 62 },
  { name: 'Mahesh Solanki', collected: 98200, target: 110000, efficiency: 89.3, payments: 48 },
  { name: 'Pooja Limbani', collected: 86500, target: 95000, efficiency: 91.1, payments: 41 },
  { name: 'Arjun Thakor', collected: 72800, target: 85000, efficiency: 85.6, payments: 35 },
  { name: 'Neha Darji', collected: 64300, target: 75000, efficiency: 85.7, payments: 30 },
  { name: 'Divya Chauhan', collected: 45600, target: 60000, efficiency: 76.0, payments: 22 },
  { name: 'Raj Prajapati', collected: 38900, target: 50000, efficiency: 77.8, payments: 18 },
  { name: 'Sneha Bhatt', collected: 31200, target: 40000, efficiency: 78.0, payments: 15 },
];

// --- Aging Analysis ---

export const mockAgingReport: {
  bucket: string;
  amount: number;
  count: number;
  percentage: number;
}[] = [
  { bucket: 'Current (0-30 days)', amount: 18500, count: 12, percentage: 49.2 },
  { bucket: '31-60 days', amount: 9800, count: 6, percentage: 26.1 },
  { bucket: '61-90 days', amount: 5400, count: 4, percentage: 14.4 },
  { bucket: '90+ days', amount: 3850, count: 3, percentage: 10.3 },
];

// --- Delivery Performance (last 30 days) ---

export const mockDeliveryReport: {
  date: string;
  total: number;
  onTime: number;
  delayed: number;
  percentage: number;
  avgDeliveryTime: number;
}[] = [
  { date: '2026-01-12', total: 14, onTime: 12, delayed: 2, percentage: 85.7, avgDeliveryTime: 42 },
  { date: '2026-01-13', total: 11, onTime: 10, delayed: 1, percentage: 90.9, avgDeliveryTime: 38 },
  { date: '2026-01-14', total: 16, onTime: 14, delayed: 2, percentage: 87.5, avgDeliveryTime: 40 },
  { date: '2026-01-15', total: 13, onTime: 11, delayed: 2, percentage: 84.6, avgDeliveryTime: 44 },
  { date: '2026-01-16', total: 18, onTime: 17, delayed: 1, percentage: 94.4, avgDeliveryTime: 35 },
  { date: '2026-01-17', total: 10, onTime: 9, delayed: 1, percentage: 90.0, avgDeliveryTime: 39 },
  { date: '2026-01-18', total: 7, onTime: 7, delayed: 0, percentage: 100.0, avgDeliveryTime: 33 },
  { date: '2026-01-19', total: 15, onTime: 13, delayed: 2, percentage: 86.7, avgDeliveryTime: 41 },
  { date: '2026-01-20', total: 19, onTime: 18, delayed: 1, percentage: 94.7, avgDeliveryTime: 34 },
  { date: '2026-01-21', total: 12, onTime: 10, delayed: 2, percentage: 83.3, avgDeliveryTime: 45 },
  { date: '2026-01-22', total: 17, onTime: 15, delayed: 2, percentage: 88.2, avgDeliveryTime: 39 },
  { date: '2026-01-23', total: 14, onTime: 13, delayed: 1, percentage: 92.9, avgDeliveryTime: 36 },
  { date: '2026-01-24', total: 20, onTime: 18, delayed: 2, percentage: 90.0, avgDeliveryTime: 37 },
  { date: '2026-01-25', total: 8, onTime: 7, delayed: 1, percentage: 87.5, avgDeliveryTime: 40 },
  { date: '2026-01-26', total: 22, onTime: 21, delayed: 1, percentage: 95.5, avgDeliveryTime: 32 },
  { date: '2026-01-27', total: 16, onTime: 14, delayed: 2, percentage: 87.5, avgDeliveryTime: 41 },
  { date: '2026-01-28', total: 12, onTime: 11, delayed: 1, percentage: 91.7, avgDeliveryTime: 37 },
  { date: '2026-01-29', total: 9, onTime: 8, delayed: 1, percentage: 88.9, avgDeliveryTime: 39 },
  { date: '2026-01-30', total: 15, onTime: 14, delayed: 1, percentage: 93.3, avgDeliveryTime: 35 },
  { date: '2026-01-31', total: 11, onTime: 10, delayed: 1, percentage: 90.9, avgDeliveryTime: 38 },
  { date: '2026-02-01', total: 14, onTime: 12, delayed: 2, percentage: 85.7, avgDeliveryTime: 43 },
  { date: '2026-02-02', total: 8, onTime: 7, delayed: 1, percentage: 87.5, avgDeliveryTime: 40 },
  { date: '2026-02-03', total: 18, onTime: 17, delayed: 1, percentage: 94.4, avgDeliveryTime: 34 },
  { date: '2026-02-04', total: 13, onTime: 11, delayed: 2, percentage: 84.6, avgDeliveryTime: 44 },
  { date: '2026-02-05', total: 16, onTime: 15, delayed: 1, percentage: 93.8, avgDeliveryTime: 35 },
  { date: '2026-02-06', total: 20, onTime: 19, delayed: 1, percentage: 95.0, avgDeliveryTime: 33 },
  { date: '2026-02-07', total: 14, onTime: 12, delayed: 2, percentage: 85.7, avgDeliveryTime: 42 },
  { date: '2026-02-08', total: 17, onTime: 16, delayed: 1, percentage: 94.1, avgDeliveryTime: 34 },
  { date: '2026-02-09', total: 22, onTime: 21, delayed: 1, percentage: 95.5, avgDeliveryTime: 31 },
  { date: '2026-02-10', total: 4, onTime: 3, delayed: 1, percentage: 75.0, avgDeliveryTime: 48 },
];

// --- Monthly Profit & Loss (last 12 months) ---

export const mockProfitLossReport: {
  month: string;
  factoryCost: number;
  revenue: number;
  margin: number;
  marginPercent: number;
}[] = [
  { month: 'Mar 2025', factoryCost: 142000, revenue: 198000, margin: 56000, marginPercent: 28.3 },
  { month: 'Apr 2025', factoryCost: 155000, revenue: 216000, margin: 61000, marginPercent: 28.2 },
  { month: 'May 2025', factoryCost: 168000, revenue: 238000, margin: 70000, marginPercent: 29.4 },
  { month: 'Jun 2025', factoryCost: 172000, revenue: 245000, margin: 73000, marginPercent: 29.8 },
  { month: 'Jul 2025', factoryCost: 180000, revenue: 258000, margin: 78000, marginPercent: 30.2 },
  { month: 'Aug 2025', factoryCost: 176000, revenue: 252000, margin: 76000, marginPercent: 30.2 },
  { month: 'Sep 2025', factoryCost: 165000, revenue: 234000, margin: 69000, marginPercent: 29.5 },
  { month: 'Oct 2025', factoryCost: 185000, revenue: 268000, margin: 83000, marginPercent: 31.0 },
  { month: 'Nov 2025', factoryCost: 192000, revenue: 278000, margin: 86000, marginPercent: 30.9 },
  { month: 'Dec 2025', factoryCost: 205000, revenue: 298000, margin: 93000, marginPercent: 31.2 },
  { month: 'Jan 2026', factoryCost: 198000, revenue: 289000, margin: 91000, marginPercent: 31.5 },
  { month: 'Feb 2026', factoryCost: 112000, revenue: 164000, margin: 52000, marginPercent: 31.7 },
];

// --- Outstanding Receivables by Store ---

export const mockOutstandingReport: {
  storeName: string;
  totalDue: number;
  overdue30: number;
  overdue60: number;
  overdue90: number;
}[] = [
  { storeName: 'Kanani Dairy Products', totalDue: 6300, overdue30: 2800, overdue60: 2000, overdue90: 1500 },
  { storeName: 'Jadeja Milk Centre', totalDue: 5600, overdue30: 2200, overdue60: 1800, overdue90: 1600 },
  { storeName: 'Desai Dairy Mart', totalDue: 5200, overdue30: 3400, overdue60: 1200, overdue90: 600 },
  { storeName: 'Rathod Provisions', totalDue: 4850, overdue30: 1800, overdue60: 1600, overdue90: 1450 },
  { storeName: 'Gajera Milk & Sweets', totalDue: 4500, overdue30: 2800, overdue60: 1100, overdue90: 600 },
  { storeName: 'Patel Dairy & General Store', totalDue: 3800, overdue30: 2400, overdue60: 900, overdue90: 500 },
  { storeName: 'Vohra Milk & Paneer Shop', totalDue: 3200, overdue30: 1800, overdue60: 900, overdue90: 500 },
  { storeName: 'Shah Milk Parlour', totalDue: 2100, overdue30: 1600, overdue60: 500, overdue90: 0 },
  { storeName: 'Mehta Dairy Fresh', totalDue: 1200, overdue30: 1200, overdue60: 0, overdue90: 0 },
  { storeName: 'Naik Superstore', totalDue: 800, overdue30: 800, overdue60: 0, overdue90: 0 },
];
