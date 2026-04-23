import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  CreateUserInput,
  UpdateUserInput,
  QueryUsersParams,
  ResetPasswordInput,
} from '@/lib/types';

export const userService = {
  async getUsers(params?: QueryUsersParams): Promise<ApiResponse<PaginatedResponse<User>>> {
    const { data } = await apiClient.get<{ users: User[]; pagination: any }>(
      '/users',
      { params }
    );
    return {
      success: true,
      data: {
        data: data.users,
        pagination: data.pagination,
      },
      message: 'Users fetched successfully',
    };
  },

  async getUserById(id: string): Promise<ApiResponse<User>> {
    const { data } = await apiClient.get<User>(`/users/${id}`);
    return {
      success: true,
      data,
      message: 'User fetched successfully',
    };
  },

  async getUsersByTenant(
    tenantId: string,
    params?: QueryUsersParams
  ): Promise<ApiResponse<PaginatedResponse<User>>> {
    const { data } = await apiClient.get<{ users: User[]; pagination: any }>(
      `/users/tenant/${tenantId}`,
      { params }
    );
    return {
      success: true,
      data: {
        data: data.users,
        pagination: data.pagination,
      },
      message: 'Users fetched successfully',
    };
  },

  async createUser(input: CreateUserInput): Promise<ApiResponse<User>> {
    const { data } = await apiClient.post<User>('/users', input);
    return {
      success: true,
      data,
      message: 'User created successfully',
    };
  },

  async updateUser(id: string, input: UpdateUserInput): Promise<ApiResponse<User>> {
    const { data } = await apiClient.patch<User>(`/users/${id}`, input);
    return {
      success: true,
      data,
      message: 'User updated successfully',
    };
  },

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    const { data } = await apiClient.delete<{ message: string }>(`/users/${id}`);
    return {
      success: true,
      data: undefined,
      message: data.message || 'User deleted successfully',
    };
  },

  async resetPassword(id: string, input: ResetPasswordInput): Promise<ApiResponse<void>> {
    const { data } = await apiClient.post<{ message: string }>(`/users/${id}/reset-password`, input);
    return {
      success: true,
      data: undefined,
      message: data.message || 'Password reset successfully',
    };
  },
};
