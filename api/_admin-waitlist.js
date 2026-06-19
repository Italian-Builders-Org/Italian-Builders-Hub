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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function acceptedInviteEmailHtml({ name, actionLink }) {
  const safeName = escapeHtml(name || "there");
  const safeActionLink = escapeHtml(actionLink);

  return `<!doctype html>
<html>
  <body style="margin:0;background:#020817;color:#f8fafc;font-family:Inter,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#020817;padding:32px 18px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#09090b;border:1px solid #27272a;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:42px 40px;background:linear-gradient(180deg,rgba(37,99,235,0.12),rgba(9,9,11,0));">
                <p style="margin:0 0 30px;color:#60a5fa;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Italian Builders</p>
                <h1 style="margin:0 0 18px;color:#f8fafc;font-size:32px;line-height:1.12;font-weight:800;">You are in. Now make it easy for the community to discover you.</h1>
                <p style="margin:0 0 16px;color:#d4d4d8;font-size:16px;line-height:1.55;">Hi ${safeName},</p>
                <p style="margin:0 0 16px;color:#d4d4d8;font-size:16px;line-height:1.55;">You have been accepted into the Italian Builders Community, a curated place for founders, developers, designers, operators, and makers building from Italy or with Italian roots.</p>
                <p style="margin:0 0 16px;color:#d4d4d8;font-size:16px;line-height:1.55;">Your profile is the first thing other builders will see. It helps people understand what you are building, what you can help with, and where a useful collaboration could start.</p>
                <p style="margin:0 0 10px;color:#d4d4d8;font-size:16px;line-height:1.55;">It takes just a few minutes:</p>
                <ul style="margin:0 0 24px 20px;padding:0;color:#d4d4d8;font-size:16px;line-height:1.55;">
                  <li>Create your account.</li>
                  <li>Add your builder profile.</li>
                  <li>Share what you are building or exploring.</li>
                  <li>Make it easier for the right people to find you.</li>
                </ul>
                <p style="margin:0 0 24px;">
                  <a href="${safeActionLink}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;padding:13px 18px;font-weight:750;">Create your profile</a>
                </p>
                <p style="margin:0 0 16px;color:#d4d4d8;font-size:16px;line-height:1.55;">We are opening access manually so the first members can set the tone with real projects, useful intros, and concrete conversations.</p>
                <p style="margin:0;color:#d4d4d8;font-size:16px;line-height:1.55;">See you inside,<br />Italian Builders</p>
                <p style="margin:26px 0 0;padding-top:18px;border-top:1px solid #27272a;color:#71717a;font-size:13px;line-height:1.5;">If the button does not work, open this link:<br /><a href="${safeActionLink}" style="color:#60a5fa;">${safeActionLink}</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendAcceptedInviteEmail({
  supabaseAdmin,
  email,
  name,
  redirectTo,
}) {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo },
  });
  if (error) throw error;

  const actionLink = data?.properties?.action_link || data?.action_link;
  if (!actionLink) {
    throw new Error("Could not generate Supabase invite link.");
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required.");
  }

  const from =
    process.env.INVITE_FROM_EMAIL ||
    process.env.WAITLIST_FROM_EMAIL ||
    "Italian Builders <invites@italianbuilders.co>";
  const subject = "You have been accepted into the Italian Builders Community";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject,
      text: `Hi ${name || "there"},

You have been accepted into the Italian Builders Community.

Your profile helps other builders understand what you are building, what you can help with, and where a useful collaboration could start.

Create your profile here:
${actionLink}

See you inside,
Italian Builders`,
      html: acceptedInviteEmailHtml({ name, actionLink }),
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || "Failed to send invite email.");
  }
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
    source: row.source || "Website Waitlist",
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
  const inviteIds = [
    ...new Set(rows.map((row) => row.invite_id).filter(Boolean)),
  ];
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

async function activateWaitlistSignupWithContext(req, rawId, context) {
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
  const expiresAt = new Date(
    Date.now() + 1000 * 60 * 60 * 24 * 30,
  ).toISOString();
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
    await sendAcceptedInviteEmail({
      supabaseAdmin,
      email: existing.email,
      name: existing.name,
      redirectTo: inviteUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send invite email.";
    await supabaseAdmin
      .from("invites")
      .update({ status: "revoked" })
      .eq("id", invite.id);
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

async function activateWaitlistSignup(req, rawId) {
  const context = await requireAdmin(req);
  return activateWaitlistSignupWithContext(req, rawId, context);
}

async function activateWaitlistBatch(req, rawIds) {
  const context = await requireAdmin(req);

  if (!Array.isArray(rawIds)) {
    throw Object.assign(new Error("ids must be an array."), {
      statusCode: 400,
    });
  }

  const ids = [...new Set(rawIds.map((id) => Number(id)))];
  if (
    ids.length === 0 ||
    ids.length > 50 ||
    ids.some((id) => !Number.isInteger(id) || id <= 0)
  ) {
    throw Object.assign(
      new Error("Provide 1 to 50 valid waitlist signup ids."),
      {
        statusCode: 400,
      },
    );
  }

  const results = [];
  for (const id of ids) {
    try {
      const { waitlistSignup } = await activateWaitlistSignupWithContext(
        req,
        id,
        context,
      );
      results.push({ id, ok: true, waitlistSignup });
    } catch (error) {
      results.push({
        id,
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to activate signup.",
      });
    }
  }

  return {
    results,
    activatedCount: results.filter((result) => result.ok).length,
    failedCount: results.filter((result) => !result.ok).length,
  };
}

function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    error: error instanceof Error ? error.message : "Internal server error.",
  });
}

module.exports = {
  activateWaitlistBatch,
  activateWaitlistSignup,
  listWaitlist,
  sendError,
};
