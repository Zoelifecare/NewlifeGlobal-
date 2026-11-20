export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True when the public Supabase credentials are present. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const MEDIA_BUCKET = "media";

export function publicStorageUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path.replace(/^\/+/, "")}`;
}
