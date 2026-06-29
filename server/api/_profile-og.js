const SITE_HOST = "italianbuilders.co";
const DEFAULT_TITLE = "Italian Builders";
const DEFAULT_DESCRIPTION =
  "Discover founders, makers, technical contributors, and operators building from Italy.";

function compactText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(value, maxLength) {
  const text = compactText(value);
  if (text.length <= maxLength) return text;
  const sliced = text.slice(0, maxLength - 1);
  const lastSpace = sliced.lastIndexOf(" ");
  return `${(lastSpace > 48 ? sliced.slice(0, lastSpace) : sliced).trim()}...`;
}

function escapeHtml(value) {
  return compactText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonLdScriptContent(value) {
  const json = JSON.stringify(value);
  return (json === undefined ? "null" : json).replace(
    /[<>&\u2028\u2029]/g,
    (char) => {
      switch (char) {
        case "<":
          return "\\u003c";
        case ">":
          return "\\u003e";
        case "&":
          return "\\u0026";
        case "\u2028":
          return "\\u2028";
        case "\u2029":
          return "\\u2029";
        default:
          return char;
      }
    },
  );
}

function normalizeUsername(value) {
  const username = compactText(value).toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{2,31}$/.test(username) ? username : null;
}

function siteOrigin(req) {
  const configured = process.env.APP_BASE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const host =
    req?.headers?.["x-forwarded-host"] ||
    req?.headers?.host ||
    process.env.VERCEL_URL ||
    SITE_HOST;
  const protocol = req?.headers?.["x-forwarded-proto"] || "https";
  const normalizedHost = Array.isArray(host) ? host[0] : host;
  return `${protocol}://${normalizedHost}`.replace(/\/$/, "");
}

function absoluteUrl(value, origin) {
  if (!value) return null;
  try {
    return new URL(value, origin).toString();
  } catch {
    return null;
  }
}

function isHttpUrl(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function initials(name) {
  const parts = compactText(name).split(" ").filter(Boolean);
  return (
    (parts[0]?.[0] || "I") +
    (parts.length > 1 ? parts[parts.length - 1][0] : "B")
  );
}

function profileTitle(profile) {
  return `${compactText(profile?.full_name) || DEFAULT_TITLE} | view on ${SITE_HOST}`;
}

function profileRoleLine(profile) {
  return (
    compactText(profile?.headline) ||
    compactText(profile?.role) ||
    "Builder on Italian Builders"
  );
}

function profileShortText(profile) {
  return truncateText(profile?.bio || profileRoleLine(profile), 142);
}

function profileDescription(profile) {
  const name = compactText(profile?.full_name) || "This builder";
  const shortText = profileShortText(profile);
  return truncateText(
    shortText
      ? `${shortText} View ${name}'s profile on Italian Builders.`
      : `View ${name}'s profile on Italian Builders.`,
    220,
  );
}

function getSupabaseConfig() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return {
    baseUrl: supabaseUrl.replace(/\/$/, ""),
    key: supabaseKey,
  };
}

async function fetchJson(url, config) {
  const response = await fetch(url, {
    headers: {
      apikey: config.key,
      authorization: `Bearer ${config.key}`,
      accept: "application/json",
    },
  });
  if (!response.ok) return null;
  return response.json();
}

async function fetchPublicProfile(username) {
  const normalizedUsername = normalizeUsername(username);
  const config = getSupabaseConfig();
  if (!normalizedUsername || !config) return null;

  const columns = [
    "id",
    "username",
    "full_name",
    "headline",
    "bio",
    "avatar_url",
    "cover_url",
    "location",
    "city",
    "country",
    "role",
    "skills",
  ].join(",");
  const url = `${config.baseUrl}/rest/v1/profiles?select=${columns}&username=eq.${encodeURIComponent(normalizedUsername)}&visibility=eq.public&limit=1`;
  const rows = await fetchJson(url, config);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function fetchPublicProfileProjects(profileId) {
  const config = getSupabaseConfig();
  if (!profileId || !config) return [];

  const columns = [
    "name",
    "tagline",
    "description",
    "image_url",
    "status",
  ].join(",");
  const url = `${config.baseUrl}/rest/v1/projects?select=${columns}&owner_id=eq.${encodeURIComponent(profileId)}&is_public=eq.true&order=created_at.desc&limit=3`;
  const rows = await fetchJson(url, config);
  return Array.isArray(rows) ? rows : [];
}

module.exports = {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SITE_HOST,
  absoluteUrl,
  compactText,
  escapeHtml,
  fetchPublicProfile,
  fetchPublicProfileProjects,
  initials,
  isHttpUrl,
  jsonLdScriptContent,
  normalizeUsername,
  profileDescription,
  profileRoleLine,
  profileShortText,
  profileTitle,
  siteOrigin,
  truncateText,
};
