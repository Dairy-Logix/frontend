/**
 * Delivery trips — office side (`/api/delivery/admin/*`). The axios client
 * unwraps `{ success, data }`, so `data` here is the raw payload; we re-wrap
 * into ApiResponse to match the other services.
 */

import apiClient from '../client';
import type {
  ApiResponse,
  DeliveryBoard,
  DeliveryException,
  DeliveryExceptionAction,
  DeliveryTripDetail,
  GeoFix,
  UnverifiedStorePin,
} from '@/lib/types';

const ok = <T>(data: T, message = 'OK'): ApiResponse<T> => ({ success: true, data, message });

export const deliveryService = {
  async getBoard(date?: string, status?: string): Promise<ApiResponse<DeliveryBoard>> {
    const { data } = await apiClient.get<DeliveryBoard>('/delivery/admin/trips', { params: { date, status } });
    return ok(data);
  },

  async getTrip(tripId: string): Promise<ApiResponse<DeliveryTripDetail>> {
    const { data } = await apiClient.get<DeliveryTripDetail>(`/delivery/admin/trips/${tripId}`);
    return ok(data);
  },

  async getTripPath(tripId: string): Promise<ApiResponse<{ tripId: string; points: GeoFix[] }>> {
    const { data } = await apiClient.get<{ tripId: string; points: GeoFix[] }>(`/delivery/admin/trips/${tripId}/path`);
    return ok(data);
  },

  async forceEndTrip(tripId: string, reason?: string): Promise<ApiResponse<DeliveryTripDetail>> {
    const { data } = await apiClient.post<DeliveryTripDetail>(`/delivery/admin/trips/${tripId}/end`, { reason });
    return ok(data, 'Trip ended');
  },

  async getExceptions(from?: string, to?: string): Promise<ApiResponse<DeliveryException[]>> {
    const { data } = await apiClient.get<DeliveryException[]>('/delivery/admin/exceptions', { params: { from, to } });
    return ok(data);
  },

  async resolveException(
    tripId: string,
    shopkeeperId: string,
    input: { action: DeliveryExceptionAction; reason?: string; redeliverOn?: string },
  ): Promise<ApiResponse<{ action: string; orders: number; redeliverOn?: string }>> {
    const { data } = await apiClient.patch<{ action: string; orders: number; redeliverOn?: string }>(
      `/delivery/admin/exceptions/${tripId}/${shopkeeperId}`,
      input,
    );
    return ok(data, 'Updated');
  },

  async getUnverifiedStores(): Promise<ApiResponse<UnverifiedStorePin[]>> {
    const { data } = await apiClient.get<UnverifiedStorePin[]>('/delivery/admin/stores/unverified');
    return ok(data);
  },

  async pinStore(shopkeeperId: string, lat: number, lng: number) {
    const { data } = await apiClient.patch<{ shopkeeperId: string; location: { lat: number; lng: number }; locationVerified: boolean }>(
      `/delivery/admin/stores/${shopkeeperId}/location`,
      { lat, lng },
    );
    return ok(data, 'Store location saved');
  },

  async verifyStorePin(shopkeeperId: string) {
    const { data } = await apiClient.patch<{ shopkeeperId: string; location: { lat: number; lng: number } | null; locationVerified: boolean }>(
      `/delivery/admin/stores/${shopkeeperId}/location/verify`,
    );
    return ok(data, 'Store location confirmed');
  },

  async clearStorePin(shopkeeperId: string) {
    const { data } = await apiClient.delete<{ shopkeeperId: string; location: null; locationVerified: boolean }>(
      `/delivery/admin/stores/${shopkeeperId}/location`,
    );
    return ok(data, 'Store location removed');
  },
};
