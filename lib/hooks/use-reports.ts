import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/lib/api/services/report.service';
import type { ReportFilter } from '@/lib/types';

// Query keys
export const reportKeys = {
  all: ['reports'] as const,
  sales: (filters: ReportFilter) => [...reportKeys.all, 'sales', filters] as const,
  collection: (filters: ReportFilter) => [...reportKeys.all, 'collection', filters] as const,
  financial: (filters: ReportFilter) => [...reportKeys.all, 'financial', filters] as const,
  customers: (filters: ReportFilter) => [...reportKeys.all, 'customers', filters] as const,
  purchases: (filters: ReportFilter) => [...reportKeys.all, 'purchases', filters] as const,
};

/**
 * Hook to fetch sales report
 */
export function useSalesReport(filters: ReportFilter) {
  return useQuery({
    queryKey: reportKeys.sales(filters),
    queryFn: async () => {
      const response = await reportService.getSalesReport(filters);
      if (!response.success) {
        throw new Error(response.message || 'Failed to generate sales report');
      }
      return response.data;
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
    staleTime: 5 * 60 * 1000, // 5 minutes (reports are relatively static)
  });
}

/**
 * Hook to fetch collection report
 */
export function useCollectionReport(filters: ReportFilter) {
  return useQuery({
    queryKey: reportKeys.collection(filters),
    queryFn: async () => {
      const response = await reportService.getCollectionReport(filters);
      if (!response.success) {
        throw new Error(response.message || 'Failed to generate collection report');
      }
      return response.data;
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
    staleTime: 2 * 60 * 1000, // 2 minutes (collections change frequently)
  });
}

/**
 * Hook to fetch financial report
 */
export function useFinancialReport(filters: ReportFilter) {
  return useQuery({
    queryKey: reportKeys.financial(filters),
    queryFn: async () => {
      const response = await reportService.getFinancialReport(filters);
      if (!response.success) {
        throw new Error(response.message || 'Failed to generate financial report');
      }
      return response.data;
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch customer report (top stores by revenue)
 */
export function useCustomerReport(filters: ReportFilter) {
  return useQuery({
    queryKey: reportKeys.customers(filters),
    queryFn: async () => {
      const response = await reportService.getCustomerReport(filters);
      if (!response.success) {
        throw new Error(response.message || 'Failed to generate customer report');
      }
      return response.data;
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch purchases report
 */
export function usePurchasesReport(filters: ReportFilter) {
  return useQuery({
    queryKey: reportKeys.purchases(filters),
    queryFn: async () => {
      const response = await reportService.getPurchasesReport(filters);
      if (!response.success) {
        throw new Error(response.message || 'Failed to generate purchases report');
      }
      return response.data;
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
    staleTime: 5 * 60 * 1000,
  });
}
