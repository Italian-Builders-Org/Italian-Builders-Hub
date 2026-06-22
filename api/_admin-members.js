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

function bearerToken(req) {
  const authorization = headerValue(req.headers.authorization);
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

function parseBody(body) {
  if (typeof body === "string") return JSON.parse(body);
  if (body && Buffer.isBuffer(body)) return JSON.parse(body.toString("utf8"));
  if (body && typeof body === "object") return body;
  return {};
}

async function requireAdmin(req) {
  const token = bearerToken(req);
  if (!token) {
    throw Object.assign(new Error("Missing bearer token."), {
      statusCode: 401,
    });
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
    .select("id, platform_role")
    .eq("id", data.user.id)
    .in("platform_role", ["admin", "owner"])
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) {
    throw Object.assign(new Error("Admin access required."), {
      statusCode: 403,
    });
  }

  return { supabaseAdmin, user: data.user, profile };
}

function cleanProfileId(value) {
  if (typeof value !== "string") return null;
  const profileId = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    profileId,
  )
    ? profileId
    : null;
}

async function deleteMember(req, rawBody) {
  const { supabaseAdmin, user, profile: callerProfile } =
    await requireAdmin(req);
  const body = parseBody(rawBody);
  const profileId = cleanProfileId(body.profileId);

  if (!profileId) {
    throw Object.assign(new Error("Valid profileId is required."), {
      statusCode: 400,
    });
  }

  if (profileId === user.id) {
    throw Object.assign(new Error("You cannot delete your own account here."), {
      statusCode: 400,
    });
  }

  const { data: targetProfile, error: targetError } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, username, platform_role")
    .eq("id", profileId)
    .maybeSingle();

  if (targetError) throw targetError;
  if (!targetProfile) {
    throw Object.assign(new Error("Member profile not found."), {
      statusCode: 404,
    });
  }

  if (targetProfile.platform_role === "owner") {
    throw Object.assign(new Error("Owner accounts cannot be deleted here."), {
      statusCode: 403,
    });
  }

  if (
    callerProfile.platform_role !== "owner" &&
    targetProfile.platform_role !== "member"
  ) {
    throw Object.assign(
      new Error("Only an owner can delete another admin account."),
      { statusCode: 403 },
    );
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
    profileId,
    false,
  );
  if (deleteError) throw deleteError;

  await supabaseAdmin.from("projects").delete().eq("owner_id", profileId);
  await supabaseAdmin.from("profiles").delete().eq("id", profileId);

  return {
    ok: true,
    deletedProfile: {
      id: targetProfile.id,
      fullName: targetProfile.full_name,
      username: targetProfile.username,
      email: targetProfile.email,
    },
  };
}

function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    error: error instanceof Error ? error.message : "Internal server error.",
  });
}

module.exports = {
  deleteMember,
  sendError,
};
