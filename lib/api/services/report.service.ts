import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  ReportFilter,
  ReportType,
} from '@/lib/types';

export interface SalesReportData {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: { productId: string; productName: string; quantity: number; revenue: number }[];
  topShops: { shopId: string; shopName: string; orderCount: number; revenue: number }[];
  dailyBreakdown: { date: string; orders: number; revenue: number }[];
}

export interface CollectionReportData {
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
  employeeBreakdown: { employeeId: string; employeeName: string; collected: number; paymentCount: number }[];
  dailyBreakdown: { date: string; collected: number; outstanding: number }[];
}

export interface DeliveryReportData {
  totalDeliveries: number;
  onTimeDeliveries: number;
  failedDeliveries: number;
  onTimeRate: number;
  employeeBreakdown: { employeeId: string; employeeName: string; deliveries: number; onTime: number }[];
  dailyBreakdown: { date: string; total: number; onTime: number; failed: number }[];
}

export interface FinancialReportData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueByProduct: { productId: string; productName: string; revenue: number; cost: number; profit: number }[];
  monthlyBreakdown: { month: string; revenue: number; expenses: number; profit: number }[];
}

export type ExportFormat = 'pdf' | 'csv' | 'xlsx';

/** Map frontend dateFrom/dateTo → backend startDate/endDate */
function toApiParams(filters: ReportFilter) {
  return { startDate: filters.dateFrom, endDate: filters.dateTo };
}

export const reportService = {
  async getSalesReport(filters: ReportFilter): Promise<ApiResponse<SalesReportData>> {
    const { data } = await apiClient.get<SalesReportData>(
      '/reports/sales',
      { params: toApiParams(filters) }
    );
    return { success: true, data, message: 'Sales report fetched successfully' };
  },

  async getCollectionReport(filters: ReportFilter): Promise<ApiResponse<CollectionReportData>> {
    const { data } = await apiClient.get<CollectionReportData>(
      '/reports/collections',
      { params: toApiParams(filters) }
    );
    return { success: true, data, message: 'Collection report fetched successfully' };
  },

  async getDeliveryReport(filters: ReportFilter): Promise<ApiResponse<DeliveryReportData>> {
    const { data } = await apiClient.get<DeliveryReportData>(
      '/reports/deliveries',
      { params: toApiParams(filters) }
    );
    return { success: true, data, message: 'Delivery report fetched successfully' };
  },

  async getFinancialReport(filters: ReportFilter): Promise<ApiResponse<FinancialReportData>> {
    const { data } = await apiClient.get<FinancialReportData>(
      '/reports/financial',
      { params: toApiParams(filters) }
    );
    return { success: true, data, message: 'Financial report fetched successfully' };
  },

  async exportReport(
    type: ReportType,
    filters: ReportFilter,
    format: ExportFormat
  ): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(`/reports/export/${type}`, {
      params: { ...toApiParams(filters), format },
      responseType: 'blob',
    });
    return data;
  },
};
