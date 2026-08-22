import { apiClient } from '@/lib/api/client';

export type MobileAppSlot = 'store-android' | 'store-ios' | 'field-android' | 'field-ios';

export interface MobileAppInfo {
  id: string;
  slot: MobileAppSlot;
  version: string;
  fileSize: number;
  available: boolean;
  updatedAt: string;
  downloadUrl: string;
}

export type PublicMobileApps = Partial<Record<MobileAppSlot, MobileAppInfo>>;

function uploadToSignedUrl(
  uploadUrl: string,
  headers: Record<string, string>,
  file: File,
  onProgress?: (percent: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', uploadUrl);
    Object.entries(headers).forEach(([key, value]) => request.setRequestHeader(key, value));

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress((event.loaded / event.total) * 100);
      }
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      reject(new Error(`App upload failed (${request.status})`));
    };
    request.onerror = () => reject(new Error('App upload failed due to a network error'));
    request.onabort = () => reject(new Error('App upload was cancelled'));
    request.send(file);
  });
}

export const mobileAppsService = {
  async list(): Promise<MobileAppInfo[]> {
    const { data } = await apiClient.get<MobileAppInfo[]>('/admin/mobile-apps');
    return data;
  },
  async publicList(): Promise<PublicMobileApps> {
    const { data } = await apiClient.get<PublicMobileApps>('/public/mobile-apps');
    return data;
  },
  async upload(slot: MobileAppSlot, version: string, file: File, onProgress?: (percent: number) => void): Promise<MobileAppInfo> {
    const { data: signed } = await apiClient.post<{
      temporaryKey: string;
      uploadUrl: string;
      requiredHeaders: Record<string, string>;
    }>('/admin/mobile-apps/presign', { slot, version, size: file.size });

    await uploadToSignedUrl(signed.uploadUrl, signed.requiredHeaders, file, onProgress);

    const { data } = await apiClient.post<MobileAppInfo>('/admin/mobile-apps/complete', {
      slot, version, size: file.size, temporaryKey: signed.temporaryKey,
    });
    return data;
  },
};
