import type { ShopShiftEntry } from '@/lib/types';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { employeeService } from '@/lib/api/services/employee.service';
import { handleApiError } from '@/lib/api/client';
import { shopkeeperKeys } from './use-shopkeepers';
import type {
  QueryEmployeesParams,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  Employee,
} from '@/lib/types';

// Query keys
export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (params?: QueryEmployeesParams) => [...employeeKeys.lists(), params] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
  assignments: (id: string) => [...employeeKeys.all, 'assignments', id] as const,
  deliveryAssignment: (id: string) =>
    [...employeeKeys.all, 'delivery-assignment', id] as const,
  collectorAssignment: (id: string) =>
    [...employeeKeys.all, 'collector-assignment', id] as const,
};

/**
 * Hook to fetch paginated employees
 */
export function useEmployees(params?: QueryEmployeesParams) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: async () => {
      const response = await employeeService.getEmployees(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch employees');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Keep showing the previous result while a new search/filter is in flight.
    // Otherwise `isLoading` flips true on every queryKey change (each new
    // search term creates a fresh key with no cached data), and pages that
    // gate on `if (isLoading)` will unmount their entire tree — including
    // the search input — making the input lose focus and the user's typing
    // gets interrupted mid-keystroke.
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook to fetch a single employee by ID
 */
export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: async () => {
      const response = await employeeService.getEmployeeById(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch employee');
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch employee shop assignments
 */
export function useEmployeeAssignments(employeeId: string) {
  return useQuery({
    queryKey: employeeKeys.assignments(employeeId),
    queryFn: async () => {
      const response = await employeeService.getEmployeeAssignments(employeeId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch assignments');
      }
      return response.data;
    },
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new employee
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEmployeeInput) => {
      const response = await employeeService.createEmployee(input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create employee');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate employees list
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });

      toast.success(`Employee "${data.name}" created successfully`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to update an existing employee
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateEmployeeInput }) => {
      const response = await employeeService.updateEmployee(id, input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update employee');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update cache for this specific employee
      queryClient.setQueryData(employeeKeys.detail(variables.id), data);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });

      toast.success(`Employee "${data.name}" updated successfully`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to flip an employee's active/inactive status.
 * Mirrored to the linked User account on the backend, so deactivating an
 * employee also blocks their mobile login.
 */
export function useUpdateEmployeeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await employeeService.updateEmployeeStatus(id, isActive);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update employee status');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(employeeKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      toast.success(
        `Employee "${data.name}" ${variables.isActive ? 'activated' : 'deactivated'} successfully`,
      );
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to delete an employee
 */
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await employeeService.deleteEmployee(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete employee');
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: employeeKeys.detail(deletedId) });
      queryClient.removeQueries({ queryKey: employeeKeys.assignments(deletedId) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });

      toast.success('Employee deleted successfully');
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to assign shops to an employee.
 * Invalidates employee + shopkeeper caches so the list counts refresh
 * everywhere.
 */
export function useAssignShops() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, shopIds }: { employeeId: string; shopIds: string[] }) => {
      const response = await employeeService.assignShops(employeeId, shopIds);
      if (!response.success) {
        throw new Error(response.message || 'Failed to assign shops');
      }
      return response.data;
    },
    onSuccess: (_data, variables) => invalidateAssignmentCaches(queryClient, variables.employeeId),
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to unassign shops from an employee.
 */
export function useUnassignShops() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, shopIds }: { employeeId: string; shopIds: string[] }) => {
      const response = await employeeService.unassignShops(employeeId, shopIds);
      if (!response.success) {
        throw new Error(response.message || 'Failed to unassign shops');
      }
      return response.data;
    },
    onSuccess: (_data, variables) => invalidateAssignmentCaches(queryClient, variables.employeeId),
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

// ---------------------------------------------------------------------------
// Delivery-person assignment (agencies + per-store split)
// ---------------------------------------------------------------------------

/**
 * Hook to fetch a delivery person's current assignment (agencies + shop ids).
 */
export function useDeliveryAssignment(employeeId: string, enabled = true) {
  return useQuery({
    queryKey: employeeKeys.deliveryAssignment(employeeId),
    queryFn: async () => {
      const response = await employeeService.getDeliveryAssignment(employeeId);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch delivery assignment');
      }
      return response.data;
    },
    enabled: !!employeeId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// Shared cache invalidation after any assignment write (collector or delivery).
// Touches the employee detail + lists (counts), both assignment queries, the
// legacy shop-assignments query, and all shopkeeper queries (store routing
// changed). Over-invalidating slightly is cheap and keeps every surface fresh.
function invalidateAssignmentCaches(queryClient: ReturnType<typeof useQueryClient>, employeeId: string) {
  queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employeeId) });
  queryClient.invalidateQueries({ queryKey: employeeKeys.assignments(employeeId) });
  queryClient.invalidateQueries({ queryKey: employeeKeys.deliveryAssignment(employeeId) });
  queryClient.invalidateQueries({ queryKey: employeeKeys.collectorAssignment(employeeId) });
  queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
  queryClient.invalidateQueries({ queryKey: shopkeeperKeys.all });
}

/** Copy another driver's agencies + stores onto this driver as a standby (duty switched off). */
export function useCopyDeliverySetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, sourceEmployeeId }: { employeeId: string; sourceEmployeeId: string }) => {
      const response = await employeeService.copyDeliverySetupFrom(employeeId, sourceEmployeeId);
      if (!response.success || !response.data) throw new Error(response.message || 'Failed to copy');
      return response.data;
    },
    onSuccess: (data, variables) => {
      invalidateAssignmentCaches(queryClient, variables.employeeId);
      toast.success(`Copied ${data.copiedFrom ?? 'that driver'}'s agencies and ${data.copied ?? 0} store shift${data.copied === 1 ? '' : 's'}. Delivery duty is now off — switch it on from the Deliveries board when needed.`, { duration: 8000 });
    },
    onError: (error) => toast.error(handleApiError(error)),
  });
}

/** Delivery duty on/off — the substitution switch. */
export function useSetDeliveryActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, active }: { employeeId: string; active: boolean }) => {
      const response = await employeeService.setDeliveryActive(employeeId, active);
      if (!response.success || !response.data) throw new Error(response.message || 'Failed to update duty');
      return response.data;
    },
    onSuccess: (data, variables) => {
      invalidateAssignmentCaches(queryClient, variables.employeeId);
      toast.success(`${data.name}: delivery duty ${variables.active ? 'on' : 'off'}`);
    },
    onError: (error) => toast.error(handleApiError(error), { duration: 8000 }),
  });
}

/**
 * Assign agencies to a delivery person (default-fills the agencies' stores).
 */
export function useAssignDeliveryAgencies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, agencyIds }: { employeeId: string; agencyIds: string[] }) => {
      const response = await employeeService.assignDeliveryAgencies(employeeId, agencyIds);
      if (!response.success) throw new Error(response.message || 'Failed to assign agencies');
      return response.data;
    },
    onSuccess: (_data, variables) => invalidateAssignmentCaches(queryClient, variables.employeeId),
    onError: (error) => toast.error(handleApiError(error)),
  });
}

/**
 * Remove agencies from a delivery person (releases their stores in those agencies).
 */
export function useUnassignDeliveryAgencies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, agencyIds }: { employeeId: string; agencyIds: string[] }) => {
      const response = await employeeService.unassignDeliveryAgencies(employeeId, agencyIds);
      if (!response.success) throw new Error(response.message || 'Failed to unassign agencies');
      return response.data;
    },
    onSuccess: (_data, variables) => invalidateAssignmentCaches(queryClient, variables.employeeId),
    onError: (error) => toast.error(handleApiError(error)),
  });
}

/**
 * Re-point specific stores to a delivery person (the per-store split).
 */
export function useAssignDeliveryShops() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, entries }: { employeeId: string; entries: ShopShiftEntry[] }) => {
      const response = await employeeService.assignDeliveryShops(employeeId, entries);
      if (!response.success) throw new Error(response.message || 'Failed to assign stores');
      return response.data;
    },
    onSuccess: (_data, variables) => invalidateAssignmentCaches(queryClient, variables.employeeId),
    onError: (error) => toast.error(handleApiError(error)),
  });
}

/**
 * Release specific stores from a delivery person.
 */
export function useUnassignDeliveryShops() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, entries }: { employeeId: string; entries: ShopShiftEntry[] }) => {
      const response = await employeeService.unassignDeliveryShops(employeeId, entries);
      if (!response.success) throw new Error(response.message || 'Failed to unassign stores');
      return response.data;
    },
    onSuccess: (_data, variables) => invalidateAssignmentCaches(queryClient, variables.employeeId),
    onError: (error) => toast.error(handleApiError(error)),
  });
}

// ---------------------------------------------------------------------------
// Collector assignment (agencies). The per-store split reuses useAssignShops /
// useUnassignShops above.
// ---------------------------------------------------------------------------

/**
 * Hook to fetch a collector's current assignment (agencies + shop ids).
 */
export function useCollectorAssignment(employeeId: string, enabled = true) {
  return useQuery({
    queryKey: employeeKeys.collectorAssignment(employeeId),
    queryFn: async () => {
      const response = await employeeService.getCollectorAssignment(employeeId);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch collector assignment');
      }
      return response.data;
    },
    enabled: !!employeeId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Assign agencies to a collector (default-fills the agencies' stores).
 */
export function useAssignCollectorAgencies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, agencyIds }: { employeeId: string; agencyIds: string[] }) => {
      const response = await employeeService.assignCollectorAgencies(employeeId, agencyIds);
      if (!response.success) throw new Error(response.message || 'Failed to assign agencies');
      return response.data;
    },
    onSuccess: (_data, variables) => invalidateAssignmentCaches(queryClient, variables.employeeId),
    onError: (error) => toast.error(handleApiError(error)),
  });
}

/**
 * Hook to fetch today's collection totals for an employee (collector).
 */
export function useCollectionsToday(employeeId: string, date: string, enabled = true) {
  return useQuery({
    queryKey: [...employeeKeys.detail(employeeId), 'collections-today', date],
    queryFn: async () => {
      const response = await employeeService.getCollectionsToday(employeeId, date);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch collections');
      }
      return response.data;
    },
    enabled: !!employeeId && enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * Remove agencies from a collector (releases their stores in those agencies).
 */
export function useUnassignCollectorAgencies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, agencyIds }: { employeeId: string; agencyIds: string[] }) => {
      const response = await employeeService.unassignCollectorAgencies(employeeId, agencyIds);
      if (!response.success) throw new Error(response.message || 'Failed to unassign agencies');
      return response.data;
    },
    onSuccess: (_data, variables) => invalidateAssignmentCaches(queryClient, variables.employeeId),
    onError: (error) => toast.error(handleApiError(error)),
  });
}
