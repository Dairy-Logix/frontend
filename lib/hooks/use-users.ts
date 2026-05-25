import { useQuery, useMutation, useQueryClient, keepPreviousData} from '@tanstack/react-query';
import { toast } from 'sonner';
import { userService } from '@/lib/api/services/user.service';
import { handleApiError } from '@/lib/api/client';
import type {
  QueryUsersParams,
  CreateUserInput,
  UpdateUserInput,
  ResetPasswordInput,
  User,
} from '@/lib/types';

// Query keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: QueryUsersParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  byTenant: (tenantId: string, params?: QueryUsersParams) =>
    [...userKeys.all, 'tenant', tenantId, params] as const,
};

/**
 * Hook to fetch paginated users (Super Admin only)
 */
export function useUsers(params?: QueryUsersParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await userService.getUsers(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch users');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single user by ID
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const response = await userService.getUserById(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch user');
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch users for a specific tenant (Tenant Admin)
 */
export function useUsersByTenant(tenantId: string, params?: QueryUsersParams) {
  return useQuery({
    queryKey: userKeys.byTenant(tenantId, params),
    queryFn: async () => {
      const response = await userService.getUsersByTenant(tenantId, params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch users');
      }
      return response.data;
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const response = await userService.createUser(input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create user');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      // If user belongs to a tenant, invalidate tenant-specific queries
      if (data.tenantId) {
        queryClient.invalidateQueries({
          queryKey: [...userKeys.all, 'tenant', data.tenantId]
        });
      }

      const userName = `${data.firstName} ${data.lastName}`;
      toast.success(`User "${userName}" created successfully`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to update an existing user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateUserInput }) => {
      const response = await userService.updateUser(id, input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update user');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update cache for this specific user
      queryClient.setQueryData(userKeys.detail(variables.id), data);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      // If user belongs to a tenant, invalidate tenant-specific queries
      if (data.tenantId) {
        queryClient.invalidateQueries({
          queryKey: [...userKeys.all, 'tenant', data.tenantId]
        });
      }

      const userName = `${data.firstName} ${data.lastName}`;
      toast.success(`User "${userName}" updated successfully`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to delete a user (Super Admin only)
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await userService.deleteUser(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete user');
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: userKeys.detail(deletedId) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'tenant'] });

      toast.success('User deleted successfully');
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to reset user password
 */
export function useResetUserPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ResetPasswordInput }) => {
      const response = await userService.resetPassword(id, input);
      if (!response.success) {
        throw new Error(response.message || 'Failed to reset password');
      }
      return id;
    },
    onSuccess: () => {
      toast.success('Password reset successfully');
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}
