
import { supabase } from "./supabase.js";

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 * @param {File} file - The file object to upload.
 * @returns {Promise<string>} - The public URL of the uploaded image.
 */
export async function uploadImageToSupabase(file) {
  const fileName = `${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from('wardrobe_images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error("Supabase Storage Upload Error:", error);
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('wardrobe_images')
    .getPublicUrl(fileName);

  return publicUrl;
}
