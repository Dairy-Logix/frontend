import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  ReportFilter,
} from '@/lib/types';

export interface SalesReportData {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: { productId: string; productName: string; quantity: number; revenue: number }[];
  topShops: { shopId: string; shopName: string; orderCount: number; revenue: number }[];
  dailyBreakdown: { date: string; orders: number; revenue: number }[];
  /** All orders in the window regardless of status (pipeline view) */
  statusBreakdown: { status: string; count: number; value: number }[];
}

export interface CollectionReportData {
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
  totalPayments: number;
  employeeBreakdown: { employeeId: string; employeeName: string; collected: number; paymentCount: number }[];
  shopkeeperBreakdown: { shopkeeperId: string; shopkeeperName: string; collected: number; paymentCount: number }[];
  paymentTypeBreakdown: { paymentType: string; collected: number; count: number }[];
  dailyBreakdown: { date: string; collected: number; count: number }[];
}

export interface CustomerReportData {
  activeCustomers: number;
  totalRevenue: number;
  topCustomers: {
    _id: string;
    shopkeeperName: string;
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  }[];
}

export interface PurchasesByProductRow {
  productId: string;
  productName: string;
  productCode: string;
  category?: 'Crate' | 'Piece' | null;
  piecesPerBox: number;
  /** Whole boxes as typed on the sheet (0 for non-boxed products). */
  boxes: number;
  loosePieces: number;
  /** Selling units (pieces / crates). */
  units: number;
  lines: number;
  /** units × current purchase price. */
  amount: number;
}

export interface PurchasesReportData {
  summary: {
    count: number;
    basicAmount: number;
    taxAmount: number;
    subsidy: number;
    netAmount: number;
  };
  byAgency: {
    agencyId: string;
    agencyName?: string;
    count: number;
    basicAmount: number;
    taxAmount: number;
    subsidy: number;
    netAmount: number;
  }[];
  byProduct: PurchasesByProductRow[];
}

export interface PurchasedVsSoldRow {
  productId: string;
  productName: string;
  productCode: string;
  category?: 'Crate' | 'Piece' | null;
  piecesPerBox: number;
  /** Selling units bought from the dairy. */
  purchased: number;
  purchasedBoxes: number;
  purchasedLoosePieces: number;
  /** Selling units ordered by stores (business day). */
  ordered: number;
  /** purchased − ordered: > 0 leftover, < 0 short. */
  difference: number;
  purchasedBoxEquivalent: number | null;
  orderedBoxEquivalent: number | null;
  /** ceil(ordered ÷ piecesPerBox) — null for non-boxed products. */
  boxesToBuy: number | null;
  purchasedAmount: number;
  orderedAmount: number;
}

export interface PurchasedVsSoldData {
  agencyId: string | null;
  rows: PurchasedVsSoldRow[];
  totals: {
    purchased: number;
    ordered: number;
    difference: number;
    purchasedAmount: number;
    orderedAmount: number;
    shortProducts: number;
    leftoverProducts: number;
  };
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

/** Map frontend dateFrom/dateTo → backend startDate/endDate (+ optional agency) */
function toApiParams(filters: ReportFilter) {
  return {
    startDate: filters.dateFrom,
    endDate: filters.dateTo,
    ...(filters.agencyId ? { agencyId: filters.agencyId } : {}),
  };
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

  async getFinancialReport(filters: ReportFilter): Promise<ApiResponse<FinancialReportData>> {
    const { data } = await apiClient.get<FinancialReportData>(
      '/reports/financial',
      { params: toApiParams(filters) }
    );
    return { success: true, data, message: 'Financial report fetched successfully' };
  },

  async getCustomerReport(filters: ReportFilter): Promise<ApiResponse<CustomerReportData>> {
    const { data } = await apiClient.get<CustomerReportData>(
      '/reports/customers',
      { params: toApiParams(filters) }
    );
    return { success: true, data, message: 'Customer report fetched successfully' };
  },

  async getPurchasedVsSoldReport(
    filters: ReportFilter,
  ): Promise<ApiResponse<PurchasedVsSoldData>> {
    const { data } = await apiClient.get<PurchasedVsSoldData>(
      '/reports/purchased-vs-sold',
      { params: toApiParams(filters) },
    );
    return { success: true, data, message: 'Purchased vs sold report generated' };
  },

  async getPurchasesReport(filters: ReportFilter): Promise<ApiResponse<PurchasesReportData>> {
    const { data } = await apiClient.get<PurchasesReportData>(
      '/reports/purchases',
      { params: toApiParams(filters) }
    );
    return { success: true, data, message: 'Purchases report fetched successfully' };
  },
};
