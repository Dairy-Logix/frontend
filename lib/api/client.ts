import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '@/lib/constants';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add tenant ID header from tenant store
      try {
        const tenantStorage = localStorage.getItem('tenant-storage');
        if (tenantStorage) {
          const parsed = JSON.parse(tenantStorage);
          const slug = parsed?.state?.slug;
          if (slug && config.headers) {
            config.headers['X-Tenant-Slug'] = slug;
          }
          const tenantId = parsed?.state?.tenant?.id;
          if (tenantId && config.headers) {
            config.headers['X-Tenant-ID'] = tenantId;
          }
        }
      } catch {
        // Ignore parse errors
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

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
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        if (typeof window !== 'undefined') {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            // Handle wrapped response: { success: true, data: { accessToken, refreshToken } }
            const responseData = response.data?.data || response.data;
            const { accessToken } = responseData;
            localStorage.setItem('accessToken', accessToken);

            // Retry the original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return apiClient(originalRequest);
          }
        }
      } catch {
        // Refresh failed, clear tokens and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
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
