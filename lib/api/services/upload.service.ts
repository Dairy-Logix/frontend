import { apiClient } from '@/lib/api/client';
import { prepareImageForUpload } from '@/lib/image';

export type UploadPurpose = 'product' | 'shopkeeper' | 'employee' | 'branding';

interface PresignResponse {
  uploadId: string;
  key: string;
  uploadUrl: string;
  publicUrl: string;
  expiresIn: number;
  requiredHeaders: Record<string, string>;
}

export interface UploadedImage {
  key: string;
  publicUrl: string;
}

export const uploadService = {
  /**
   * Full client pipeline: resize/encode in the browser, presign via the
   * backend, then PUT the bytes directly to R2. The PUT deliberately uses
   * plain fetch (NOT apiClient) — the Authorization header must never be
   * sent to R2, and the signed headers must match exactly.
   */
  async uploadImage(purpose: UploadPurpose, file: File): Promise<UploadedImage> {
    const { blob, contentType } = await prepareImageForUpload(file);

    const { data } = await apiClient.post<PresignResponse>('/uploads/presign', {
      purpose,
      contentType,
      size: blob.size,
    });

    const res = await fetch(data.uploadUrl, {
      method: 'PUT',
      headers: data.requiredHeaders,
      body: blob,
    });

    if (!res.ok) {
      throw new Error(`Image upload failed (${res.status})`);
    }

    return { key: data.key, publicUrl: data.publicUrl };
  },
};
