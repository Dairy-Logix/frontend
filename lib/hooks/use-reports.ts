import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/lib/api/services/report.service';
import type { ReportFilter } from '@/lib/types';

// Query keys
export const reportKeys = {
  all: ['reports'] as const,
  sales: (filters: ReportFilter) => [...reportKeys.all, 'sales', filters] as const,
  collection: (filters: ReportFilter) => [...reportKeys.all, 'collection', filters] as const,
  delivery: (filters: ReportFilter) => [...reportKeys.all, 'delivery', filters] as const,
  financial: (filters: ReportFilter) => [...reportKeys.all, 'financial', filters] as const,
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
 * Hook to fetch delivery report
 */
export function useDeliveryReport(filters: ReportFilter) {
  return useQuery({
    queryKey: reportKeys.delivery(filters),
    queryFn: async () => {
      const response = await reportService.getDeliveryReport(filters);
      if (!response.success) {
        throw new Error(response.message || 'Failed to generate delivery report');
      }
      return response.data;
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
    staleTime: 2 * 60 * 1000,
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
