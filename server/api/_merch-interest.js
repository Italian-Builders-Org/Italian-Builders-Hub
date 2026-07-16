const { createClient } = require("@supabase/supabase-js");

const ALLOWED_COLORS = new Set(["navy", "white", "sky"]);
const ALLOWED_SIZES = new Set(["osfa", "s", "m", "l", "xl"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function requiredString(value, label, maxLength) {
  const cleaned = cleanString(value, maxLength);
  if (!cleaned) {
    throw Object.assign(new Error(`${label} is required.`), {
      statusCode: 400,
    });
  }
  return cleaned;
}

function requestIp(req) {
  const forwardedFor = headerValue(req.headers["x-forwarded-for"]);
  const candidate = forwardedFor?.split(",")[0]?.trim();
  return candidate || headerValue(req.headers["x-real-ip"]) || null;
}

async function verifyTurnstile(req, token) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    throw Object.assign(new Error("TURNSTILE_SECRET_KEY is required."), {
      statusCode: 500,
    });
  }

  const responseToken = requiredString(token, "Security check", 2048);
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        secret,
        response: responseToken,
        remoteip: requestIp(req),
      }),
    },
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) {
    throw Object.assign(
      new Error("Could not validate the security check. Please try again."),
      { statusCode: 502 },
    );
  }

  if (!payload.success) {
    throw Object.assign(
      new Error("Security check failed. Please try again."),
      { statusCode: 400 },
    );
  }
}

function mapPayload(body) {
  const email = requiredString(body.email, "Email", 320).toLowerCase();
  if (!EMAIL_RE.test(email)) {
    throw Object.assign(new Error("A valid email is required."), {
      statusCode: 400,
    });
  }

  const color = requiredString(body.color, "Color", 40).toLowerCase();
  if (!ALLOWED_COLORS.has(color)) {
    throw Object.assign(new Error("Choose a valid cap color."), {
      statusCode: 400,
    });
  }

  const size = (
    cleanString(body.size, 20) || "osfa"
  ).toLowerCase();
  if (!ALLOWED_SIZES.has(size)) {
    throw Object.assign(new Error("Choose a valid size."), {
      statusCode: 400,
    });
  }

  const quantityRaw = Number(body.quantity ?? 1);
  const quantity = Number.isFinite(quantityRaw)
    ? Math.trunc(quantityRaw)
    : NaN;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    throw Object.assign(new Error("Quantity must be between 1 and 20."), {
      statusCode: 400,
    });
  }

  return {
    name: requiredString(body.name, "Name", 120),
    email,
    phone: cleanString(body.phone, 40),
    color,
    quantity,
    size,
    address_line1: requiredString(body.addressLine1, "Address", 200),
    address_line2: cleanString(body.addressLine2, 200),
    city: requiredString(body.city, "City", 120),
    province: cleanString(body.province, 80),
    postal_code: requiredString(body.postalCode, "Postal code", 32),
    country: requiredString(body.country || "Italy", "Country", 80),
    notes: cleanString(body.notes, 1000),
  };
}

async function submitMerchInterest(req) {
  const body = parseBody(req.body);
  await verifyTurnstile(req, body.turnstileToken);
  const payload = mapPayload(body);
  const supabaseAdmin = getSupabaseAdmin();

  const row = {
    ...payload,
    status: "interested",
    ip_address: requestIp(req),
    user_agent: cleanString(headerValue(req.headers["user-agent"]), 1000),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("merch_interest_signups")
    .upsert(row, { onConflict: "email,color" })
    .select("id, email, color, created_at")
    .single();

  if (error) {
    throw Object.assign(
      new Error(error.message || "Could not save your interest."),
      { statusCode: 500 },
    );
  }

  return { ok: true, id: data.id, color: data.color };
}

module.exports = {
  submitMerchInterest,
};
