export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "video/mp4", "video/webm", "audio/mpeg", "audio/mp4", "application/pdf"];
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // matches the storage bucket limit
export const PERMISSION_LABEL: Record<string, string> = {
  owner_approved: "Owner approved",
  licensed: "Licensed",
  embed_only: "Embed only",
  pending: "Permission pending",
};
export const MEDIA_CATEGORIES = ["worship", "services", "conferences", "youth", "community", "celebrations", "rwanda-ministry", "leadership", "events", "brand"];
