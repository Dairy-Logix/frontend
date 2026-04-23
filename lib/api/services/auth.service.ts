import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  RegisterInput,
  User,
} from '@/lib/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const { data } = await apiClient.post<AuthResponse>(
      '/auth/login',
      credentials
    );
    return {
      success: true,
      data,
      message: 'Login successful',
    };
  },

  async register(input: RegisterInput): Promise<ApiResponse<AuthResponse>> {
    const { data } = await apiClient.post<AuthResponse>(
      '/auth/register',
      input
    );
    return {
      success: true,
      data,
      message: 'Registration successful',
    };
  },

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    const { data } = await apiClient.post<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      { refreshToken }
    );
    return {
      success: true,
      data,
      message: 'Token refreshed',
    };
  },

  async logout(): Promise<ApiResponse<void>> {
    const { data } = await apiClient.post<{ message: string }>('/auth/logout');
    return {
      success: true,
      data: undefined,
      message: data.message || 'Logout successful',
    };
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const { data } = await apiClient.get<{ user: User }>('/auth/me');
    return {
      success: true,
      data: data.user,
      message: 'User fetched successfully',
    };
  },
};
