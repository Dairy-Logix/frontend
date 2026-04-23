import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Notification,
  NotificationPreference,
} from '@/lib/types';

export const notificationService = {
  async getNotifications(
    params?: PaginationParams & { read?: boolean }
  ): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    const { data } = await apiClient.get<PaginatedResponse<Notification>>(
      '/notifications',
      { params }
    );
    return {
      success: true,
      data,
      message: 'Notifications fetched successfully',
    };
  },

  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    const { data } = await apiClient.patch<Notification>(
      `/notifications/${id}/read`
    );
    return {
      success: true,
      data,
      message: 'Notification marked as read',
    };
  },

  async markAllAsRead(): Promise<ApiResponse<void>> {
    await apiClient.patch(
      '/notifications/read-all'
    );
    return {
      success: true,
      message: 'All notifications marked as read',
    };
  },

  async getNotificationPreferences(): Promise<ApiResponse<NotificationPreference[]>> {
    const { data } = await apiClient.get<NotificationPreference[]>(
      '/notifications/preferences'
    );
    return {
      success: true,
      data,
      message: 'Notification preferences fetched successfully',
    };
  },

  async updateNotificationPreferences(
    preferences: Partial<NotificationPreference>[]
  ): Promise<ApiResponse<NotificationPreference[]>> {
    const { data } = await apiClient.put<NotificationPreference[]>(
      '/notifications/preferences',
      { preferences }
    );
    return {
      success: true,
      data,
      message: 'Notification preferences updated successfully',
    };
  },
};
