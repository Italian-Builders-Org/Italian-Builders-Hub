export function sanitizeHttpUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function normalizeHttpUrlInput(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return sanitizeHttpUrl(trimmed);
  return sanitizeHttpUrl(`https://${trimmed.replace(/^\/+/, "")}`);
}

export function normalizeSocialUrl(
  value: string | null | undefined,
  base: string,
) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return sanitizeHttpUrl(trimmed);
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return "";
  return sanitizeHttpUrl(
    `${base}${trimmed.replace(/^@/, "").replace(/^\/+/, "")}`,
  );
}
