const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

let cachedSupabaseAdmin;

function getSupabaseAdmin() {
  if (cachedSupabaseAdmin) return cachedSupabaseAdmin;

  const supabaseUrl = process.env.SUPABASE_URL;
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

function bearerToken(req) {
  const authorization = headerValue(req.headers.authorization);
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

async function requireAdmin(req) {
  const token = bearerToken(req);
  if (!token) {
    throw Object.assign(new Error("Missing bearer token."), { statusCode: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    throw Object.assign(new Error("Invalid or expired session."), {
      statusCode: 401,
    });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .in("platform_role", ["admin", "owner"])
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) {
    throw Object.assign(new Error("Admin access required."), {
      statusCode: 403,
    });
  }

  return { user: data.user };
}

function appBaseUrl(req) {
  const configured = process.env.APP_BASE_URL?.replace(/\/+$/, "");
  if (configured) return configured;

  const host = headerValue(req.headers["x-forwarded-host"]) || req.headers.host;
  const protocol = headerValue(req.headers["x-forwarded-proto"]) || "https";
  return `${protocol}://${host}`.replace(/\/+$/, "");
}

function newInviteToken() {
  return crypto.randomBytes(24).toString("hex");
}

function mapWaitlistRow(row, invite) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    building: row.building,
    telegramHandle: row.telegram_handle,
    xHandle: row.x_handle,
    linkedin: row.linkedin,
    website: row.website,
    projectUrl: row.project_url,
    status: row.status,
    activatedAt: row.activated_at,
    activatedBy: row.activated_by,
    inviteId: row.invite_id,
    inviteEmailSentAt: row.invite_email_sent_at,
    inviteEmailError: row.invite_email_error,
    inviteToken: invite?.token ?? null,
    inviteStatus: invite?.status ?? null,
    createdAt: row.created_at,
  };
}

async function loadInvite(id) {
  if (!id) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("invites")
    .select("id, token, status")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function listWaitlist(req) {
  await requireAdmin(req);

  const { data, error } = await getSupabaseAdmin()
    .from("waitlist_signups")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = data || [];
  const inviteIds = [...new Set(rows.map((row) => row.invite_id).filter(Boolean))];
  let invitesById = new Map();

  if (inviteIds.length > 0) {
    const { data: invites, error: inviteError } = await getSupabaseAdmin()
      .from("invites")
      .select("id, token, status")
      .in("id", inviteIds);
    if (inviteError) throw inviteError;
    invitesById = new Map((invites || []).map((invite) => [invite.id, invite]));
  }

  const waitlist = rows
    .map((row) => mapWaitlistRow(row, invitesById.get(row.invite_id)))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return { waitlist };
}

async function activateWaitlistSignup(req, rawId) {
  const context = await requireAdmin(req);
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    throw Object.assign(new Error("Invalid waitlist signup id."), {
      statusCode: 400,
    });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: existing, error: waitlistError } = await supabaseAdmin
    .from("waitlist_signups")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (waitlistError) throw waitlistError;
  if (!existing) {
    throw Object.assign(new Error("Waitlist signup not found."), {
      statusCode: 404,
    });
  }

  if (existing.status === "active") {
    const invite = await loadInvite(existing.invite_id);
    return { waitlistSignup: mapWaitlistRow(existing, invite) };
  }

  const token = newInviteToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  const inviteUrl = `${appBaseUrl(req)}/invite/${token}`;
  const { data: invite, error: inviteError } = await supabaseAdmin
    .from("invites")
    .insert({
      email: existing.email,
      telegram_handle: existing.telegram_handle,
      token,
      invited_by: context.user.id,
      expires_at: expiresAt,
    })
    .select("id, token, status")
    .single();

  if (inviteError) throw inviteError;

  try {
    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      existing.email,
      { redirectTo: inviteUrl },
    );
    if (error) throw error;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send invite email.";
    await supabaseAdmin.from("invites").update({ status: "revoked" }).eq("id", invite.id);
    await supabaseAdmin
      .from("waitlist_signups")
      .update({
        invite_id: invite.id,
        invite_email_error: message,
      })
      .eq("id", id);

    throw Object.assign(new Error(message), { statusCode: 502 });
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("waitlist_signups")
    .update({
      status: "active",
      activated_at: new Date().toISOString(),
      activated_by: context.user.id,
      invite_id: invite.id,
      invite_email_sent_at: new Date().toISOString(),
      invite_email_error: null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) throw updateError;

  return { waitlistSignup: mapWaitlistRow(updated, invite) };
}

function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    error: error instanceof Error ? error.message : "Internal server error.",
  });
}

module.exports = {
  activateWaitlistSignup,
  listWaitlist,
  sendError,
};
