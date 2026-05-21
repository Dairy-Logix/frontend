import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Notification,
  NotificationPreference,
  SentNotification,
} from '@/lib/types';

export interface SentNotificationsParams extends PaginationParams {
  isRead?: boolean;
  type?: string;
  search?: string;
}

interface RawSentNotificationsResponse {
  notifications: unknown[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

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

  async getSentNotifications(
    params?: SentNotificationsParams
  ): Promise<ApiResponse<{ data: SentNotification[]; total: number; page: number; pageSize: number; totalPages: number }>> {
    const { data } = await apiClient.get<RawSentNotificationsResponse>(
      '/notifications/sent',
      { params }
    );
    return {
      success: true,
      data: {
        data: (data.notifications ?? []) as SentNotification[],
        total: data.pagination?.total ?? 0,
        page: data.pagination?.page ?? 1,
        pageSize: data.pagination?.limit ?? 0,
        totalPages: data.pagination?.totalPages ?? 0,
      },
      message: 'Sent notifications fetched successfully',
    };
  },

  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    const { data } = await apiClient.patch<Notification>(
      `/notifications/${id}/mark-read`
    );
    return {
      success: true,
      data,
      message: 'Notification marked as read',
    };
  },

  async markAllAsRead(): Promise<ApiResponse<void>> {
    await apiClient.patch(
      '/notifications/mark-all-read'
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
