import { supabase } from "@/lib/supabase";

export const SUPABASE_MEDIA_BUCKET =
  (import.meta.env.VITE_SUPABASE_MEDIA_BUCKET as string | undefined) || "italian-builders-media";

const MAX_MEDIA_BYTES = 10 * 1024 * 1024;

const allowedMediaTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);

export const storageMode = {
  hasSupabaseStorage: Boolean(supabase),
  bucket: SUPABASE_MEDIA_BUCKET,
};

export function mediaFieldHelp(kind: "avatar" | "cover" | "project") {
  const label = kind === "avatar" ? "avatar" : kind === "cover" ? "cover image" : "project image";

  if (storageMode.hasSupabaseStorage) {
    return `Upload a ${label}. Files are stored in Supabase Storage now and can be migrated to Cloudflare R2 later.`;
  }

  return `Upload is unavailable because Supabase is not configured in this environment.`;
}

function safeExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (fromName) return fromName.slice(0, 8);
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  if (file.type === "video/mp4") return "mp4";
  if (file.type === "video/webm") return "webm";
  return "bin";
}

export async function uploadMediaFile({
  file,
  userId,
  folder,
}: {
  file: File;
  userId: string;
  folder: "profile" | "projects" | "community-projects";
}) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  if (!allowedMediaTypes.has(file.type)) {
    throw new Error("Use a JPG, PNG, WebP, GIF, MP4, or WebM file.");
  }

  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error("Files must be 10 MB or smaller.");
  }

  const extension = safeExtension(file);
  const objectPath = `${userId}/${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(SUPABASE_MEDIA_BUCKET)
    .upload(objectPath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(SUPABASE_MEDIA_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}
