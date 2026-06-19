import { supabase } from "@/lib/supabase";

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
  hasAuthenticatedUploads: Boolean(supabase),
  publicBaseUrl: (import.meta.env.VITE_R2_PUBLIC_BASE_URL as string | undefined) || "",
};

export function mediaFieldHelp(kind: "avatar" | "cover" | "project") {
  const label = kind === "avatar" ? "avatar" : kind === "cover" ? "cover image" : "project image";

  if (storageMode.hasAuthenticatedUploads) {
    return `Upload a ${label}. Files are stored in Cloudflare R2.`;
  }

  return `Upload is unavailable because authentication is not configured in this environment.`;
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
    throw new Error("Media uploads are not configured.");
  }

  if (!allowedMediaTypes.has(file.type)) {
    throw new Error("Use a JPG, PNG, WebP, GIF, MP4, or WebM file.");
  }

  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error("Files must be 10 MB or smaller.");
  }

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const sessionUserId = data.session?.user.id;

  if (!token || !sessionUserId) {
    throw new Error("Sign in again before uploading media.");
  }

  if (sessionUserId !== userId) {
    throw new Error("You can only upload media for your own account.");
  }

  const uploadRequest = await fetch("/api/media-upload-url", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      folder,
      fileName: file.name || `upload.${safeExtension(file)}`,
      contentType: file.type,
      size: file.size,
    }),
  });

  const uploadData = await uploadRequest.json().catch(() => null);

  if (!uploadRequest.ok) {
    throw new Error(uploadData?.error || "Could not prepare media upload.");
  }

  const uploadResponse = await fetch(uploadData.uploadUrl, {
    method: "PUT",
    headers: uploadData.headers,
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Could not upload media to Cloudflare R2.");
  }

  return uploadData.publicUrl as string;
}
