"use client";

import { useRef, useState } from "react";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { handleApiError } from "@/lib/api/client";
import { validatePhotoFile } from "@/lib/image";
import { uploadService, type UploadPurpose } from "@/lib/api/services/upload.service";

interface ImageUploadFieldProps {
  label: string;
  purpose: UploadPurpose;
  /** Existing photo URL on the entity being edited (null/undefined if none). */
  currentUrl?: string | null;
  /**
   * Called when the photo changes: a new R2 key after a successful upload,
   * or null when the user removes the photo. Not called while unchanged.
   */
  onChange: (photoKey: string | null) => void;
  /** Round preview for people, rounded-square for products/stores. */
  shape?: "circle" | "square";
  disabled?: boolean;
}

export function ImageUploadField({
  label,
  purpose,
  currentUrl,
  onChange,
  shape = "square",
  disabled,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const displayUrl = preview ?? (removed ? null : currentUrl ?? null);
  const radiusClass = shape === "circle" ? "rounded-full" : "rounded-xl";

  const handleFile = async (file: File) => {
    const validationError = validatePhotoFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);
    try {
      const { key } = await uploadService.uploadImage(purpose, file);
      setRemoved(false);
      onChange(key);
    } catch (error) {
      URL.revokeObjectURL(localPreview);
      setPreview(null);
      toast.error(handleApiError(error));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setRemoved(true);
    onChange(null);
  };

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-dashed bg-muted/40 ${radiusClass}`}
        >
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayUrl}
              alt={label}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                {displayUrl ? "Change" : "Upload"}
              </>
            )}
          </Button>
          {displayUrl && !uploading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={handleRemove}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Remove
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
