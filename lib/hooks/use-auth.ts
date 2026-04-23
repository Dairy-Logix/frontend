import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authService } from '@/lib/api/services/auth.service';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useTenantStore } from '@/lib/stores/tenant-store';
import type { LoginCredentials, RegisterInput } from '@/lib/types';
import { handleApiError } from '@/lib/api/client';

// Query keys
export const authKeys = {
  currentUser: ['auth', 'currentUser'] as const,
};

/**
 * Hook to get the current authenticated user
 */
export function useCurrentUser() {
  const { setUser, setLoading } = useAuthStore();

  return useQuery({
    queryKey: authKeys.currentUser,
    queryFn: async () => {
      setLoading(true);
      try {
        const response = await authService.getCurrentUser();
        if (response.success && response.data) {
          setUser(response.data);
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch user');
      } finally {
        setLoading(false);
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('accessToken'),
  });
}

/**
 * Hook to handle user login
 */
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, setTokens } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await authService.login(credentials);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Login failed');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Store tokens
      setTokens(data.accessToken, data.refreshToken);

      // Store user
      setUser(data.user);

      // Set tenant store context for API calls
      if (data.user.role === 'super_admin') {
        useTenantStore.getState().setContext('super_admin');
        useTenantStore.getState().setSlug(null);
      } else if (data.user.tenantSlug) {
        useTenantStore.getState().setContext('tenant');
        useTenantStore.getState().setSlug(data.user.tenantSlug);
      }

      // Update query cache
      queryClient.setQueryData(authKeys.currentUser, data.user);

      toast.success('Login successful!');

      // Redirect based on role
      if (data.user.role === 'super_admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to handle user registration
 */
export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, setTokens } = useAuthStore();

  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const response = await authService.register(input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Registration failed');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Store tokens
      setTokens(data.accessToken, data.refreshToken);

      // Store user
      setUser(data.user);

      // Set tenant store context for API calls
      if (data.user.role === 'super_admin') {
        useTenantStore.getState().setContext('super_admin');
        useTenantStore.getState().setSlug(null);
      } else if (data.user.tenantSlug) {
        useTenantStore.getState().setContext('tenant');
        useTenantStore.getState().setSlug(data.user.tenantSlug);
      }

      // Update query cache
      queryClient.setQueryData(authKeys.currentUser, data.user);

      toast.success('Registration successful!');

      // Redirect based on role
      if (data.user.role === 'super_admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to handle user logout
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout: clearAuthState } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      try {
        await authService.logout();
      } catch (error) {
        // Proceed with logout even if API call fails
        console.error('Logout API error:', error);
      }
    },
    onSuccess: () => {
      // Clear auth state
      clearAuthState();

      // Clear all queries
      queryClient.clear();

      toast.success('Logged out successfully');

      // Redirect to login
      router.push('/auth/login');
    },
    onError: () => {
      // Clear auth state even on error
      clearAuthState();
      queryClient.clear();
      router.push('/auth/login');
    },
  });
}

/**
 * Hook to refresh the access token
 */
export function useRefreshToken() {
  const { setTokens } = useAuthStore();

  return useMutation({
    mutationFn: async (refreshToken: string) => {
      const response = await authService.refreshToken(refreshToken);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Token refresh failed');
      }
      return response.data;
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
    },
    onError: () => {
      // If refresh fails, logout
      const { logout } = useAuthStore.getState();
      logout();
      window.location.href = '/auth/login';
    },
  });
}
