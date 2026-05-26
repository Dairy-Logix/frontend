import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { auditService, type AuditQuery } from '@/lib/api/services/audit.service';

export const auditKeys = {
  all: ['audit'] as const,
  list: (params?: AuditQuery) => [...auditKeys.all, 'list', params] as const,
  actions: () => [...auditKeys.all, 'actions'] as const,
};

export function useAuditLog(params?: AuditQuery) {
  return useQuery({
    queryKey: auditKeys.list(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await auditService.list(params);
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useAuditActions() {
  return useQuery({
    queryKey: auditKeys.actions(),
    queryFn: async () => {
      const res = await auditService.actions();
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
