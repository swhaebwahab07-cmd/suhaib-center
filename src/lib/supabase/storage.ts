import { createServiceRoleClient } from "./server";

const BUCKET_NAME = "linktree-images";

/**
 * Upload an image to Supabase Storage
 * @param file - File object or Blob
 * @param path - Storage path (e.g., "profile-images/{linktreeId}/profile.jpg")
 * @returns Public URL of the uploaded image
 */
export async function uploadImage(
  file: File | Blob,
  path: string
): Promise<{ url: string; path: string }> {
  const supabase = createServiceRoleClient();

  // Upload file
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true, // Replace if exists
    });

  if (error) {
    console.error("Error uploading image:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path,
  };
}

/**
 * Delete an image from Supabase Storage
 * @param path - Storage path to delete
 */
export async function deleteImage(path: string): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    console.error("Error deleting image:", error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

/**
 * Get public URL for an image
 * @param path - Storage path
 * @returns Public URL
 */
export function getImageUrl(path: string): string {
  const supabase = createServiceRoleClient();

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

  return publicUrl;
}

/**
 * Generate a unique filename for upload
 * @param originalFilename - Original filename
 * @param linktreeId - Linktree ID (optional)
 * @returns Unique filename with timestamp
 */
export function generateImageFilename(
  originalFilename: string,
  linktreeId?: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const extension = originalFilename.split(".").pop() || "jpg";
  const baseName = originalFilename.split(".").slice(0, -1).join(".") || "image";
  const sanitizedBaseName = baseName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  
  const filename = `${sanitizedBaseName}-${timestamp}-${random}.${extension}`;
  
  if (linktreeId) {
    return `profile-images/${linktreeId}/${filename}`;
  }
  
  return `uploads/${filename}`;
}

/**
 * Validate image file
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default: 0.5 for 500KB)
 * @returns Validation result
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 0.5
): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  // Check file size (convert MB to bytes)
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    const fileSizeKB = (file.size / 1024).toFixed(2);
    const maxSizeKB = (maxSizeMB * 1024).toFixed(0);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeKB}KB limit. Current size: ${fileSizeKB}KB`,
    };
  }

  return { valid: true };
}

