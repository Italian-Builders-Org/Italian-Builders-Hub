import { randomBytes } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { pool } from "@workspace/db";

const router: IRouter = Router();

type AdminContext = {
  user: User;
};

type WaitlistAdminRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  building: string | null;
  telegram_handle: string | null;
  x_handle: string | null;
  linkedin: string | null;
  website: string | null;
  project_url: string | null;
  status: "pending" | "active";
  activated_at: Date | null;
  activated_by: string | null;
  invite_id: string | null;
  invite_email_sent_at: Date | null;
  invite_email_error: string | null;
  created_at: Date;
  invite_token: string | null;
  invite_status: string | null;
};

let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;

  const supabaseUrl = process.env["SUPABASE_URL"];
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for admin actions.",
    );
  }

  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdmin;
}

function bearerToken(req: Request) {
  const value = req.get("authorization");
  const match = value?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

async function requireAdmin(req: Request, res: Response): Promise<AdminContext | null> {
  const token = bearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Missing bearer token." });
    return null;
  }

  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Invalid or expired session." });
    return null;
  }

  const result = await pool.query<{ id: string }>(
    `
      select id
      from public.profiles
      where id = $1
        and platform_role in ('admin', 'owner')
      limit 1
    `,
    [data.user.id],
  );

  if (result.rowCount === 0) {
    res.status(403).json({ error: "Admin access required." });
    return null;
  }

  return { user: data.user };
}

function appBaseUrl(req: Request) {
  const configured = process.env["APP_BASE_URL"]?.replace(/\/+$/, "");
  if (configured) return configured;

  const host = req.get("host");
  return `${req.protocol}://${host}`;
}

function newInviteToken() {
  return randomBytes(24).toString("hex");
}

function mapWaitlistRow(row: WaitlistAdminRow) {
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
    activatedAt: row.activated_at?.toISOString() ?? null,
    activatedBy: row.activated_by,
    inviteId: row.invite_id,
    inviteEmailSentAt: row.invite_email_sent_at?.toISOString() ?? null,
    inviteEmailError: row.invite_email_error,
    inviteToken: row.invite_token,
    inviteStatus: row.invite_status,
    createdAt: row.created_at.toISOString(),
  };
}

async function loadWaitlistRow(id: number) {
  const result = await pool.query<WaitlistAdminRow>(
    `
      select
        w.*,
        i.token as invite_token,
        i.status::text as invite_status
      from public.waitlist_signups w
      left join public.invites i on i.id = w.invite_id
      where w.id = $1
      limit 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

router.get("/admin/waitlist", async (req, res): Promise<void> => {
  const context = await requireAdmin(req, res);
  if (!context) return;

  const result = await pool.query<WaitlistAdminRow>(
    `
      select
        w.*,
        i.token as invite_token,
        i.status::text as invite_status
      from public.waitlist_signups w
      left join public.invites i on i.id = w.invite_id
      order by
        case w.status when 'pending' then 0 else 1 end,
        w.created_at desc
    `,
  );

  res.json({ waitlist: result.rows.map(mapWaitlistRow) });
});

router.post("/admin/waitlist/:id/activate", async (req, res): Promise<void> => {
  const context = await requireAdmin(req, res);
  if (!context) return;

  const id = Number(req.params["id"]);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid waitlist signup id." });
    return;
  }

  const existing = await loadWaitlistRow(id);
  if (!existing) {
    res.status(404).json({ error: "Waitlist signup not found." });
    return;
  }

  if (existing.status === "active") {
    res.json({ waitlistSignup: mapWaitlistRow(existing) });
    return;
  }

  const token = newInviteToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  const inviteUrl = `${appBaseUrl(req)}/invite/${token}`;

  const inviteResult = await pool.query<{ id: string }>(
    `
      insert into public.invites (email, telegram_handle, token, invited_by, expires_at)
      values ($1, $2, $3, $4, $5)
      returning id
    `,
    [existing.email, existing.telegram_handle, token, context.user.id, expiresAt],
  );
  const inviteId = inviteResult.rows[0]?.id;

  try {
    const { error } = await getSupabaseAdmin().auth.admin.inviteUserByEmail(
      existing.email,
      { redirectTo: inviteUrl },
    );

    if (error) throw error;
  } catch (err) {
    const message = getErrorMessage(err);
    await pool.query(
      `
        update public.invites
        set status = 'revoked'
        where id = $1
      `,
      [inviteId],
    );
    await pool.query(
      `
        update public.waitlist_signups
        set
          invite_id = $2,
          invite_email_error = $3
        where id = $1
      `,
      [id, inviteId, message],
    );
    req.log.error({ err, waitlistSignupId: id }, "Failed to send waitlist invite email");
    res.status(502).json({ error: message });
    return;
  }

  await pool.query(
    `
      update public.waitlist_signups
      set
        status = 'active',
        activated_at = now(),
        activated_by = $2,
        invite_id = $3,
        invite_email_sent_at = now(),
        invite_email_error = null
      where id = $1
    `,
    [id, context.user.id, inviteId],
  );

  const row = await loadWaitlistRow(id);
  res.json({ waitlistSignup: row ? mapWaitlistRow(row) : null });
});

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Failed to send invite email.";
}

export default router;
