const { createClient } = require("@supabase/supabase-js");

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

function bearerToken(req) {
  const authorization = headerValue(req.headers.authorization);
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

function normalizeEmail(value) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email && email.includes("@") ? email.slice(0, 320) : null;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const token = bearerToken(req);
    if (!token) {
      res.status(401).json({ error: "Authentication is required." });
      return;
    }

    const requestedEmail = normalizeEmail(parseBody(req.body).email);
    if (!requestedEmail) {
      res.status(400).json({ error: "Valid email confirmation is required." });
      return;
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !data.user) {
      res.status(401).json({ error: "Invalid session." });
      return;
    }

    const userId = data.user.id;
    const accountEmail = normalizeEmail(data.user.email);
    if (!accountEmail || accountEmail !== requestedEmail) {
      res.status(400).json({
        error: "Email confirmation does not match the current account.",
      });
      return;
    }

    try {
      await supabaseAdmin.auth.admin.signOut(token, "global");
    } catch {
      // Deletion is the source of truth; sign-out is best effort for session cleanup.
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userId,
      false,
    );
    if (deleteError) throw deleteError;

    await supabaseAdmin.from("projects").delete().eq("owner_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    res.status(200).json({ ok: true });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error:
        error instanceof Error ? error.message : "Could not delete account.",
    });
  }
};
