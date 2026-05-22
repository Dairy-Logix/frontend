import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
 * Hook to assign shops to an employee
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
    onSuccess: (_data, variables) => {
      // Invalidate employee data
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(variables.employeeId) });
      queryClient.invalidateQueries({ queryKey: employeeKeys.assignments(variables.employeeId) });
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });

      // Invalidate shopkeepers (assignment affects them)
      queryClient.invalidateQueries({ queryKey: shopkeeperKeys.all });

      toast.success(`${variables.shopIds.length} shop(s) assigned successfully`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}
