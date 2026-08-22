"use client";

import { toast } from "sonner";
import { queryClient } from "@/components/providers/query-provider";
import { handleApiError } from "@/lib/api/client";
import { mobileAppsService, type MobileAppSlot } from "@/lib/api/services/mobile-apps.service";

const slotLabels: Record<MobileAppSlot, string> = {
  "store-android": "Store Android",
  "store-ios": "Store iOS",
  "field-android": "Field Android",
  "field-ios": "Field iOS",
};

const activeUploads = new Set<MobileAppSlot>();
const uploadStatusEvent = "mobile-app-upload-status";

function notifyUploadStatusChanged() {
  window.dispatchEvent(new Event(uploadStatusEvent));
}

export function subscribeToMobileAppUploadStatus(listener: () => void) {
  window.addEventListener(uploadStatusEvent, listener);
  return () => window.removeEventListener(uploadStatusEvent, listener);
}

export function isMobileAppUploadRunning(slot: MobileAppSlot) {
  return activeUploads.has(slot);
}

export function startMobileAppUpload(slot: MobileAppSlot, version: string, file: File) {
  if (activeUploads.has(slot)) {
    toast.info(`${slotLabels[slot]} upload is already running.`);
    return false;
  }

  activeUploads.add(slot);
  notifyUploadStatusChanged();
  const label = slotLabels[slot];
  const toastId = toast.loading(`${label} upload started. You can continue working.`);

  void mobileAppsService
    .upload(slot, version, file, (progress) => {
      const percent = Math.max(0, Math.min(100, Math.round(progress)));
      toast.loading(`${label} uploading... ${percent}%`, { id: toastId });
    })
    .then(() => {
      toast.success(`${label} app uploaded successfully.`, { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["admin-mobile-apps"] });
      queryClient.invalidateQueries({ queryKey: ["public-mobile-apps"] });
    })
    .catch((error) => {
      toast.error(handleApiError(error), { id: toastId });
    })
    .finally(() => {
      activeUploads.delete(slot);
      notifyUploadStatusChanged();
    });

  return true;
}
