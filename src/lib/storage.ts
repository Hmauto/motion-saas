// Supabase Storage integration for video and audio files
import { supabaseAdmin } from './supabase';

const STORAGE_BUCKET = 'videos';
const AUDIO_BUCKET = 'audio';

/**
 * Initialize storage buckets
 */
export async function initStorage() {
  // Create buckets if they don't exist
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  
  const hasVideos = buckets?.some(b => b.name === STORAGE_BUCKET);
  const hasAudio = buckets?.some(b => b.name === AUDIO_BUCKET);

  if (!hasVideos) {
    await supabaseAdmin.storage.createBucket(STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    });
  }

  if (!hasAudio) {
    await supabaseAdmin.storage.createBucket(AUDIO_BUCKET, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
    });
  }
}

/**
 * Upload audio file to storage
 */
export async function uploadAudio(
  blob: Blob,
  videoId: string,
  sectionName: string
): Promise<string> {
  const path = `${videoId}/${sectionName}.mp3`;
  
  const { data, error } = await supabaseAdmin.storage
    .from(AUDIO_BUCKET)
    .upload(path, blob, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload audio: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(AUDIO_BUCKET)
    .getPublicUrl(path);

  return publicUrl;
}

/**
 * Upload video file to storage
 */
export async function uploadVideo(
  buffer: Buffer,
  videoId: string
): Promise<{ url: string; thumbnailUrl: string }> {
  const videoPath = `${videoId}/video.mp4`;
  
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(videoPath, buffer, {
      contentType: 'video/mp4',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload video: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl: videoUrl } } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(videoPath);

  // Generate thumbnail URL (placeholder)
  const thumbnailUrl = `${videoUrl}.jpg`; // Would need actual thumbnail generation

  return { url: videoUrl, thumbnailUrl };
}

/**
 * Get video download URL
 */
export function getVideoUrl(videoId: string): string {
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(`${videoId}/video.mp4`);
  
  return publicUrl;
}

/**
 * Delete video files
 */
export async function deleteVideo(videoId: string): Promise<void> {
  await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove([`${videoId}/video.mp4`]);
  
  await supabaseAdmin.storage
    .from(AUDIO_BUCKET)
    .remove([`${videoId}/`]);
}
