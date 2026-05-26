import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { API_BASE_URL, API_TIMEOUT } from '@/lib/constants';

// Pulls the backend error payload regardless of whether it's wrapped by the
// global ResponseInterceptor or thrown raw via HttpException.
function unwrapErrorPayload(data: unknown): Record<string, any> | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, any>;
  if (obj.data && typeof obj.data === 'object') return obj.data as Record<string, any>;
  return obj;
}

const RESOURCE_LABELS: Record<string, string> = {
  agencies: 'agencies',
  shopkeepers: 'stores',
  products: 'products',
  users: 'users',
  ordersPerMonth: 'orders this month',
};

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — JWT is the only tenant/auth signal
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Clear all auth state and bounce the browser to /auth/login. Used on any
// 401 that can't be recovered (no refresh token, refresh failed, retry
// still 401). Idempotent — safe to call from multiple interceptor branches.
function forceLogoutAndRedirect() {
  if (typeof window === 'undefined') return;
  // Clear raw tokens.
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  // Clear persisted zustand stores so the login page doesn't see stale
  // user/tenant state (auth-store and tenant-store from CLAUDE.md).
  localStorage.removeItem('auth-storage');
  localStorage.removeItem('tenant-storage');
  localStorage.removeItem('agency-storage');
  // Don't redirect if we're already on a marketing/auth route — prevents
  // a tight loop if the login page itself happens to hit a 401-returning
  // endpoint (e.g. the public plans listing).
  const path = window.location.pathname;
  const isPublicRoute =
    path === '/' ||
    path.startsWith('/auth/') ||
    path.startsWith('/signup') ||
    path.startsWith('/pricing');
  if (isPublicRoute) return;
  // window.location.replace so the protected page is gone from history —
  // the back button won't bring the user back to the broken view.
  window.location.replace('/auth/login');
}

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Unwrap backend ResponseInterceptor format: { success: true, data: {...} }
    // This allows frontend services to use simple `data` instead of `data.data`
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      // Already tried once — token refresh didn't save us. Bounce to login.
      if (originalRequest._retry) {
        forceLogoutAndRedirect();
        return Promise.reject(error);
      }
      originalRequest._retry = true;

      if (typeof window === 'undefined') return Promise.reject(error);

      const refreshToken = localStorage.getItem('refreshToken');
      // No refresh token at all — session is dead, bounce immediately.
      if (!refreshToken) {
        forceLogoutAndRedirect();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        // Handle wrapped response: { success: true, data: { accessToken, refreshToken } }
        const responseData = response.data?.data || response.data;
        const { accessToken, refreshToken: newRefreshToken } = responseData;
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Retry the original request with the fresh token.
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch {
        // Refresh failed — refresh token is expired or revoked.
        forceLogoutAndRedirect();
        return Promise.reject(error);
      }
    }

    // Plan-limit refusal: render an actionable toast with an Upgrade button so
    // the user understands why the create was blocked. Sonner dedupes by id so
    // calling-code toasts (handleApiError) collapse into this one.
    if (error.response?.status === 403) {
      const payload = unwrapErrorPayload(error.response.data);
      if (payload?.code === 'LIMIT_EXCEEDED') {
        const resource = String(payload.resource ?? '');
        const label = RESOURCE_LABELS[resource] ?? resource;
        toast.error(
          `You've reached your plan's limit of ${payload.limit} ${label}.`,
          {
            id: `limit-exceeded:${resource}`,
            description: 'Upgrade your plan to add more.',
            action: {
              label: 'Upgrade',
              onClick: () => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/billing';
                }
              },
            },
          },
        );
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string; data?: any }>;
    const responseData = axiosError.response?.data;

    // Handle wrapped error format from backend: { success: false, data: { message } }
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      const innerData = responseData.data;
      if (innerData && typeof innerData === 'object') {
        return (innerData as any).message || (innerData as any).error || axiosError.message || 'An error occurred';
      }
    }

    // Handle direct error format: { message, error }
    return responseData?.message || responseData?.error || axiosError.message || 'An error occurred';
  }
  return 'An unexpected error occurred';
};

export default apiClient;
