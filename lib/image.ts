/**
 * Client-side image preparation for the R2 upload pipeline.
 *
 * Photos are resized in the browser before upload (aspect-preserving, long
 * edge capped) and re-encoded as WebP when the browser supports it, falling
 * back to JPEG. Keeps uploads well under the backend's 5MB presign cap.
 */

export const PHOTO_ALLOWED_INPUT_TYPES = /^image\/(jpeg|jpg|png|webp)$/;

// Reject absurdly large source files before we even try to decode them
export const PHOTO_MAX_SOURCE_BYTES = 20 * 1024 * 1024;

export interface PreparedImage {
  blob: Blob;
  contentType: string;
}

export function validatePhotoFile(file: File): string | null {
  if (!PHOTO_ALLOWED_INPUT_TYPES.test(file.type)) {
    return "Only JPEG, PNG or WebP images are allowed";
  }
  if (file.size > PHOTO_MAX_SOURCE_BYTES) {
    return "Image is too large (max 20MB)";
  }
  return null;
}

/** Aspect-preserving downscale to `maxPx` on the long edge, WebP preferred. */
export function prepareImageForUpload(
  file: File,
  maxPx = 1024,
  quality = 0.85,
): Promise<PreparedImage> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        let { width, height } = img;
        if (width > maxPx || height > maxPx) {
          const scale = maxPx / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (webpBlob) => {
            // Browsers that can't encode WebP return null (or fall back to PNG)
            if (webpBlob && webpBlob.type === "image/webp") {
              resolve({ blob: webpBlob, contentType: "image/webp" });
              return;
            }
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob) {
                  resolve({ blob: jpegBlob, contentType: "image/jpeg" });
                } else {
                  reject(new Error("Failed to encode image"));
                }
              },
              "image/jpeg",
              quality,
            );
          },
          "image/webp",
          quality,
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read the selected image"));
    };

    img.src = objectUrl;
  });
}
