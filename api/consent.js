const { createClient } = require("@supabase/supabase-js");

const CURRENT_CONSENT_VERSION = "2026-06-19-db";
const CURRENT_POLICY_VERSION = "2026-06-19";
const CURRENT_TERMS_VERSION = "2026-06-19";

let cachedSupabaseAdmin;

function getSupabaseAdmin() {
  if (cachedSupabaseAdmin) return cachedSupabaseAdmin;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw Object.assign(
      new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required."),
      { statusCode: 500 },
    );
  }

  cachedSupabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedSupabaseAdmin;
}

function headerValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function parseBody(body) {
  if (typeof body === "string") return JSON.parse(body);
  if (body && Buffer.isBuffer(body)) return JSON.parse(body.toString("utf8"));
  if (body && typeof body === "object") return body;
  return {};
}

function cleanString(value, maxLength) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function cleanUuid(value) {
  const trimmed = cleanString(value, 64);
  if (
    !trimmed ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      trimmed,
    )
  ) {
    throw Object.assign(new Error("Valid consent id is required."), {
      statusCode: 400,
    });
  }
  return trimmed.toLowerCase();
}

function clientIp(req) {
  const forwardedFor = headerValue(req.headers["x-forwarded-for"]);
  const candidate = forwardedFor?.split(",")[0]?.trim();
  return candidate || headerValue(req.headers["x-real-ip"]) || null;
}

function bearerToken(req) {
  const authorization = headerValue(req.headers.authorization);
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

async function maybeUserId(req, supabaseAdmin) {
  const token = bearerToken(req);
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const body = parseBody(req.body);
    const consentId = cleanUuid(body.consentId);
    const consentVersion = cleanString(body.version, 80);

    if (consentVersion !== CURRENT_CONSENT_VERSION) {
      res.status(400).json({ error: "Unsupported consent version." });
      return;
    }

    const categories = body.categories || {};
    if (
      categories.necessary !== true ||
      categories.analytics !== false ||
      categories.marketing !== false
    ) {
      res.status(400).json({ error: "Unsupported consent categories." });
      return;
    }

    const supabaseAdmin = getSupabaseAdmin();
    const userId = await maybeUserId(req, supabaseAdmin);
    const { data, error } = await supabaseAdmin
      .from("cookie_consents")
      .insert({
        consent_id: consentId,
        user_id: userId,
        consent_version: CURRENT_CONSENT_VERSION,
        policy_version: CURRENT_POLICY_VERSION,
        terms_version: CURRENT_TERMS_VERSION,
        necessary: true,
        analytics: false,
        marketing: false,
        action: cleanString(body.action, 40) || "necessary_accepted",
        page_path: cleanString(body.pagePath, 500),
        client_saved_at: cleanString(body.clientSavedAt, 80),
        ip_address: clientIp(req),
        user_agent: cleanString(headerValue(req.headers["user-agent"]), 1000),
        accept_language: cleanString(
          headerValue(req.headers["accept-language"]),
          500,
        ),
        referer: cleanString(headerValue(req.headers.referer), 1000),
        metadata: {
          source: "cookie_banner",
          storage: "database_and_browser",
        },
      })
      .select("id, created_at")
      .single();

    if (error) throw error;

    res.status(200).json({
      consentRecordId: data.id,
      consentId,
      createdAt: data.created_at,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error:
        error instanceof Error
          ? error.message
          : "Could not record cookie consent.",
    });
  }
};
