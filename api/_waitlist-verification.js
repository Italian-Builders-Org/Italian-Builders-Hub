const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const { appBaseUrl } = require("./_app-base-url");

const verificationTtlHours = 24;

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

function cleanEmail(value) {
  const email = requiredString(value, "Email", 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw Object.assign(new Error("Valid email is required."), {
      statusCode: 400,
    });
  }
  return email;
}

function newToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function verificationUrl(req, token) {
  return `${appBaseUrl(req)}/api/waitlist/verify?token=${encodeURIComponent(
    token,
  )}`;
}

function requestIp(req) {
  const cloudflareIp = headerValue(req.headers["cf-connecting-ip"]);
  if (cloudflareIp) return cloudflareIp;

  const forwardedFor = headerValue(req.headers["x-forwarded-for"]);
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();
  return firstForwardedIp || req.socket?.remoteAddress || undefined;
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
    throw Object.assign(new Error("Security check failed. Please try again."), {
      statusCode: 400,
    });
  }
}

function mapPayload(body) {
  const email = cleanEmail(body.email);
  return {
    name: requiredString(body.name, "Name", 160),
    email,
    role: requiredString(body.role, "Role", 160),
    building: cleanString(body.building, 600),
    telegram_handle: requiredString(body.telegramHandle, "Telegram", 160),
    x_handle: cleanString(body.xHandle, 160),
    linkedin: cleanString(body.linkedin, 500),
    website: cleanString(body.website, 500),
    project_url: cleanString(body.projectUrl, 500),
    source: "Website Waitlist",
  };
}

async function sendVerificationEmail({ to, name, url }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.WAITLIST_FROM_EMAIL ||
    process.env.INVITE_FROM_EMAIL ||
    "Italian Builders <invites@italianbuilders.co>";

  if (!apiKey) {
    throw Object.assign(new Error("RESEND_API_KEY is required."), {
      statusCode: 500,
    });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Verify your Italian Builders waitlist request",
      text: `Hi ${name},\n\nConfirm your email to join the Italian Builders waitlist:\n${url}\n\nThis link expires in ${verificationTtlHours} hours.\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>Hi ${escapeHtml(name)},</p><p>Confirm your email to join the Italian Builders waitlist:</p><p><a href="${escapeHtml(
        url,
      )}">Verify email</a></p><p>This link expires in ${verificationTtlHours} hours.</p><p>If you did not request this, you can ignore this email.</p>`,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw Object.assign(
      new Error(payload?.message || "Could not send verification email."),
      { statusCode: 502 },
    );
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function requestWaitlistVerification(req) {
  const body = parseBody(req.body);
  await verifyTurnstile(req, body.turnstileToken);
  const payload = mapPayload(body);
  const supabaseAdmin = getSupabaseAdmin();

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("waitlist_signups")
    .select("id")
    .eq("email", payload.email)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing) {
    return { ok: true, alreadyVerified: true };
  }

  const token = newToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + verificationTtlHours * 60 * 60 * 1000,
  ).toISOString();

  const { data: verification, error: insertError } = await supabaseAdmin
    .from("waitlist_email_verifications")
    .insert({
      email: payload.email,
      token_hash: tokenHash,
      payload,
      expires_at: expiresAt,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  try {
    await sendVerificationEmail({
      to: payload.email,
      name: payload.name,
      url: verificationUrl(req, token),
    });
  } catch (error) {
    await supabaseAdmin
      .from("waitlist_email_verifications")
      .update({
        email_error:
          error instanceof Error
            ? error.message
            : "Could not send verification email.",
      })
      .eq("id", verification.id);
    throw error;
  }

  const { error: sentError } = await supabaseAdmin
    .from("waitlist_email_verifications")
    .update({ sent_at: new Date().toISOString() })
    .eq("id", verification.id);
  if (sentError) throw sentError;

  return { ok: true, alreadyVerified: false };
}

async function verifyWaitlistEmail(token) {
  const cleanedToken = cleanString(token, 200);
  if (!cleanedToken) {
    throw Object.assign(new Error("Verification token is required."), {
      statusCode: 400,
    });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: verification, error: verificationError } = await supabaseAdmin
    .from("waitlist_email_verifications")
    .select("*")
    .eq("token_hash", hashToken(cleanedToken))
    .maybeSingle();

  if (verificationError) throw verificationError;
  if (!verification || verification.status !== "pending") {
    throw Object.assign(
      new Error("Verification link is invalid or already used."),
      {
        statusCode: 400,
      },
    );
  }

  if (new Date(verification.expires_at).getTime() < Date.now()) {
    await supabaseAdmin
      .from("waitlist_email_verifications")
      .update({ status: "expired" })
      .eq("id", verification.id);
    throw Object.assign(new Error("Verification link has expired."), {
      statusCode: 400,
    });
  }

  const payload = verification.payload || {};
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("waitlist_signups")
    .select("id")
    .eq("email", verification.email)
    .maybeSingle();
  if (existingError) throw existingError;

  if (!existing) {
    const { error: insertError } = await supabaseAdmin
      .from("waitlist_signups")
      .insert({
        name: payload.name,
        email: verification.email,
        role: payload.role,
        building: payload.building || null,
        telegram_handle: payload.telegram_handle || null,
        x_handle: payload.x_handle || null,
        linkedin: payload.linkedin || null,
        website: payload.website || null,
        project_url: payload.project_url || null,
        source: payload.source || "Website Waitlist",
      });
    if (insertError) throw insertError;
  }

  const { error: updateError } = await supabaseAdmin
    .from("waitlist_email_verifications")
    .update({ status: "verified", verified_at: new Date().toISOString() })
    .eq("id", verification.id);
  if (updateError) throw updateError;

  return { ok: true };
}

module.exports = {
  requestWaitlistVerification,
  verifyWaitlistEmail,
};
