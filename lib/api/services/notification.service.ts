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

export interface NotificationsParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

/** The current user's notifications page — `/notifications` returns the same
 *  document shape as `/notifications/sent`, plus the user's unread count. */
export interface NotificationsPage {
  data: SentNotification[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  unreadCount: number;
}

interface RawNotificationsResponse {
  notifications: SentNotification[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  unreadCount?: number;
}

export const notificationService = {
  async getNotifications(
    params?: NotificationsParams
  ): Promise<ApiResponse<NotificationsPage>> {
    const { data } = await apiClient.get<RawNotificationsResponse>(
      '/notifications',
      { params }
    );
    return {
      success: true,
      data: {
        data: data.notifications ?? [],
        total: data.pagination?.total ?? 0,
        page: data.pagination?.page ?? 1,
        pageSize: data.pagination?.limit ?? 0,
        totalPages: data.pagination?.totalPages ?? 0,
        unreadCount: data.unreadCount ?? 0,
      },
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
