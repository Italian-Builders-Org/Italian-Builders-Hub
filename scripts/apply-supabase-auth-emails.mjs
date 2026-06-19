import { readFileSync } from "node:fs";

const PROJECT_NAME = "Italian Builders";
const FROM_EMAIL = "no-reply@italianbuilders.co";
const SMTP_HOST = "smtp.resend.com";
const SMTP_PORT = "587";
const SMTP_USER = "resend";

function parseEnv(path) {
  const env = {};
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function authEmailTemplate({ eyebrow, title, body, buttonLabel, href, codeLabel, codeValue, footer }) {
  const actionBlock = href
    ? `
      <tr>
        <td style="padding: 6px 32px 30px;">
          <a href="${href}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:700;line-height:20px;padding:12px 18px;border-radius:4px;">
            ${buttonLabel}
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 28px;">
          <p style="margin:0;color:#71717a;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:19px;">
            If the button does not work, copy this link into your browser:<br>
            <a href="${href}" style="color:#93c5fd;word-break:break-all;text-decoration:none;">${href}</a>
          </p>
        </td>
      </tr>`
    : "";

  const codeBlock = codeValue
    ? `
      <tr>
        <td style="padding:4px 32px 30px;">
          <p style="margin:0 0 10px;color:#a1a1aa;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;text-transform:uppercase;letter-spacing:.08em;">${codeLabel}</p>
          <div style="display:inline-block;background:#09090b;border:1px solid #27272a;border-radius:4px;color:#f4f4f5;font-family:Menlo,Consolas,monospace;font-size:28px;font-weight:700;letter-spacing:.16em;padding:14px 18px;">
            ${codeValue}
          </div>
        </td>
      </tr>`
    : "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="dark light">
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#09090b;padding:0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;margin:0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#18181b;border:1px solid #27272a;border-radius:6px;overflow:hidden;">
            <tr>
              <td style="background:#09090b;border-bottom:1px solid #27272a;padding:22px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:28px;height:28px;background:#f4f4f5;color:#09090b;font-family:Menlo,Consolas,monospace;font-size:13px;font-weight:800;text-align:center;vertical-align:middle;">IB</td>
                    <td style="padding-left:12px;color:#f4f4f5;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:700;">Italian Builders</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 8px;">
                <p style="margin:0 0 12px;color:#71717a;font-family:Menlo,Consolas,monospace;font-size:11px;line-height:16px;text-transform:uppercase;letter-spacing:.08em;">${eyebrow}</p>
                <h1 style="margin:0;color:#fafafa;font-family:Inter,Arial,sans-serif;font-size:28px;line-height:34px;font-weight:800;letter-spacing:0;">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 22px;">
                <p style="margin:0;color:#d4d4d8;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:24px;">${body}</p>
              </td>
            </tr>
            ${actionBlock}
            ${codeBlock}
            <tr>
              <td style="border-top:1px solid #27272a;padding:20px 32px 24px;">
                <p style="margin:0;color:#71717a;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:19px;">${footer}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const subjects = {
  confirmation: "Confirm your Italian Builders account",
  invite: "You are invited to Italian Builders",
  magic_link: "Your Italian Builders sign-in code",
  email_change: "Confirm your new email address",
  recovery: "Reset your Italian Builders password",
  reauthentication: "Confirm this sensitive action",
  password_changed_notification: "Your password was changed",
  email_changed_notification: "Your email address was changed",
  phone_changed_notification: "Your phone number was changed",
  identity_linked_notification: "A sign-in method was linked",
  identity_unlinked_notification: "A sign-in method was removed",
  mfa_factor_enrolled_notification: "A verification method was added",
  mfa_factor_unenrolled_notification: "A verification method was removed",
};

const templates = {
  confirmation: authEmailTemplate({
    eyebrow: "Account confirmation",
    title: "Confirm your account.",
    body: "Use this secure link to confirm your email address and continue setting up your Italian Builders profile.",
    buttonLabel: "Confirm account",
    href: "{{ .ConfirmationURL }}",
    footer: "You received this because someone started an Italian Builders account with this email. If that was not you, ignore this message.",
  }),
  invite: authEmailTemplate({
    eyebrow: "Member invite",
    title: "You are invited.",
    body: "You have been invited to create an Italian Builders account. Use the secure link below to accept the invitation.",
    buttonLabel: "Accept invite",
    href: "{{ .ConfirmationURL }}",
    footer: "This invite is intended for {{ .Email }}. If you were not expecting it, you can ignore this message.",
  }),
  magic_link: authEmailTemplate({
    eyebrow: "Sign-in verification",
    title: "Sign in to Italian Builders.",
    body: "Use the secure link or one-time code below to finish signing in. This keeps access to the community workspace protected.",
    buttonLabel: "Sign in",
    href: "{{ .ConfirmationURL }}",
    codeLabel: "One-time code",
    codeValue: "{{ .Token }}",
    footer: "If you did not request this sign-in, ignore this message. The code will expire automatically.",
  }),
  email_change: authEmailTemplate({
    eyebrow: "Email change",
    title: "Confirm your new email.",
    body: "Use this secure link to confirm that {{ .NewEmail }} should be used for your Italian Builders account.",
    buttonLabel: "Confirm email change",
    href: "{{ .ConfirmationURL }}",
    footer: "If you did not request an email change, do not click the link and keep using your current account email.",
  }),
  recovery: authEmailTemplate({
    eyebrow: "Password reset",
    title: "Reset your password.",
    body: "Use this secure link or one-time code to reset your Italian Builders password.",
    buttonLabel: "Reset password",
    href: "{{ .ConfirmationURL }}",
    codeLabel: "Reset code",
    codeValue: "{{ .Token }}",
    footer: "If you did not request a password reset, ignore this message. Your current password will stay unchanged.",
  }),
  reauthentication: authEmailTemplate({
    eyebrow: "Sensitive action",
    title: "Confirm it is you.",
    body: "Use this one-time code to continue with the requested account action.",
    codeLabel: "Verification code",
    codeValue: "{{ .Token }}",
    footer: "If you did not request this action, you can ignore this message.",
  }),
  password_changed_notification: authEmailTemplate({
    eyebrow: "Security notification",
    title: "Your password was changed.",
    body: "The password for your Italian Builders account was changed. If you made this change, no further action is needed.",
    footer: "If you did not make this change, reset your password and review your account access immediately.",
  }),
  email_changed_notification: authEmailTemplate({
    eyebrow: "Security notification",
    title: "Your email address was changed.",
    body: "The email address on your Italian Builders account changed from {{ .OldEmail }} to {{ .Email }}.",
    footer: "If you did not make this change, contact an Italian Builders admin and secure your account.",
  }),
  phone_changed_notification: authEmailTemplate({
    eyebrow: "Security notification",
    title: "Your phone number was changed.",
    body: "The phone number connected to your Italian Builders account was changed to {{ .Phone }}.",
    footer: "If you did not make this change, review your account security.",
  }),
  identity_linked_notification: authEmailTemplate({
    eyebrow: "Security notification",
    title: "A sign-in method was linked.",
    body: "A new sign-in method was linked to your Italian Builders account.",
    footer: "If you did not make this change, review your account security.",
  }),
  identity_unlinked_notification: authEmailTemplate({
    eyebrow: "Security notification",
    title: "A sign-in method was removed.",
    body: "A sign-in method was removed from your Italian Builders account.",
    footer: "If you did not make this change, review your account security.",
  }),
  mfa_factor_enrolled_notification: authEmailTemplate({
    eyebrow: "Security notification",
    title: "A verification method was added.",
    body: "A new multi-factor verification method was added to your Italian Builders account.",
    footer: "If you did not make this change, remove the method and review your account security.",
  }),
  mfa_factor_unenrolled_notification: authEmailTemplate({
    eyebrow: "Security notification",
    title: "A verification method was removed.",
    body: "A multi-factor verification method was removed from your Italian Builders account.",
    footer: "If you did not make this change, review your account security.",
  }),
};

function buildPayload(env) {
  const resendKey = env.RESEND_API_KEY;
  if (!resendKey) {
    throw new Error("Missing RESEND_API_KEY in .env.local");
  }

  return {
    external_email_enabled: true,
    mailer_autoconfirm: false,
    mailer_secure_email_change_enabled: true,
    smtp_admin_email: FROM_EMAIL,
    smtp_host: SMTP_HOST,
    smtp_port: SMTP_PORT,
    smtp_user: SMTP_USER,
    smtp_pass: resendKey,
    smtp_sender_name: PROJECT_NAME,
    mailer_notifications_password_changed_enabled: true,
    mailer_notifications_email_changed_enabled: true,
    mailer_notifications_phone_changed_enabled: true,
    mailer_notifications_identity_linked_enabled: true,
    mailer_notifications_identity_unlinked_enabled: true,
    mailer_notifications_mfa_factor_enrolled_enabled: true,
    mailer_notifications_mfa_factor_unenrolled_enabled: true,
    mailer_subjects_confirmation: subjects.confirmation,
    mailer_templates_confirmation_content: templates.confirmation,
    mailer_subjects_invite: subjects.invite,
    mailer_templates_invite_content: templates.invite,
    mailer_subjects_magic_link: subjects.magic_link,
    mailer_templates_magic_link_content: templates.magic_link,
    mailer_subjects_email_change: subjects.email_change,
    mailer_templates_email_change_content: templates.email_change,
    mailer_subjects_recovery: subjects.recovery,
    mailer_templates_recovery_content: templates.recovery,
    mailer_subjects_reauthentication: subjects.reauthentication,
    mailer_templates_reauthentication_content: templates.reauthentication,
    mailer_subjects_password_changed_notification: subjects.password_changed_notification,
    mailer_templates_password_changed_notification_content: templates.password_changed_notification,
    mailer_subjects_email_changed_notification: subjects.email_changed_notification,
    mailer_templates_email_changed_notification_content: templates.email_changed_notification,
    mailer_subjects_phone_changed_notification: subjects.phone_changed_notification,
    mailer_templates_phone_changed_notification_content: templates.phone_changed_notification,
    mailer_subjects_identity_linked_notification: subjects.identity_linked_notification,
    mailer_templates_identity_linked_notification_content: templates.identity_linked_notification,
    mailer_subjects_identity_unlinked_notification: subjects.identity_unlinked_notification,
    mailer_templates_identity_unlinked_notification_content: templates.identity_unlinked_notification,
    mailer_subjects_mfa_factor_enrolled_notification: subjects.mfa_factor_enrolled_notification,
    mailer_templates_mfa_factor_enrolled_notification_content: templates.mfa_factor_enrolled_notification,
    mailer_subjects_mfa_factor_unenrolled_notification: subjects.mfa_factor_unenrolled_notification,
    mailer_templates_mfa_factor_unenrolled_notification_content: templates.mfa_factor_unenrolled_notification,
  };
}

const env = parseEnv(".env.local");
const payload = buildPayload(env);

if (process.argv.includes("--dry-run")) {
  const sanitizedPayload = {
    ...payload,
    smtp_pass: payload.smtp_pass ? "<set>" : "",
  };
  console.log(JSON.stringify(sanitizedPayload, null, 2));
  process.exit(0);
}

const token = env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = env.SUPABASE_PROJECT_REF || process.env.SUPABASE_PROJECT_REF;

if (!token || !projectRef) {
  throw new Error("Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF");
}

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const result = await response.json().catch(() => ({}));
if (!response.ok) {
  throw new Error(`Supabase Auth config update failed (${response.status}): ${JSON.stringify(result)}`);
}

console.log(JSON.stringify({ ok: true, projectRef, updatedFields: Object.keys(payload).length }, null, 2));
