const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const { appBaseUrl } = require("./_app-base-url");

const SESSION_STATES = {
  AWAITING_PROFILE_STATUS: "awaiting_profile_status",
  AWAITING_HANDLE_MATCH_CONFIRMATION: "awaiting_handle_match_confirmation",
  AWAITING_HANDLE_MISMATCH_CHOICE: "awaiting_handle_mismatch_choice",
  AWAITING_EXISTING_EMAIL: "awaiting_existing_email",
  AWAITING_NAME: "awaiting_name",
  AWAITING_EMAIL: "awaiting_email",
  AWAITING_ROLE: "awaiting_role",
  AWAITING_BUILDING: "awaiting_building",
  MAGIC_LINK_EMAIL_SENT: "magic_link_email_sent",
  EMAIL_QUOTA_WAITING: "email_quota_waiting",
  COMPLETED: "completed",
  LINKED_EXISTING_PROFILE: "linked_existing_profile",
};

const CALLBACK_ACTIONS = {
  YES: "onboarding:yes",
  NO: "onboarding:no",
  NOT_ME: "onboarding:not_me",
  CREATE_ACCOUNT: "onboarding:create_account",
};

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

function telegramLinkSecret() {
  return (
    process.env.TELEGRAM_ONBOARDING_LINK_SECRET ||
    process.env.TELEGRAM_ONBOARDING_WEBHOOK_SECRET ||
    process.env.TELEGRAM_ONBOARDING_SETUP_SECRET ||
    process.env.CRON_SECRET
  );
}

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function signTelegramLinkPayload(encodedPayload) {
  const secret = telegramLinkSecret();
  if (!secret) {
    throw Object.assign(
      new Error("TELEGRAM_ONBOARDING_LINK_SECRET is required."),
      { statusCode: 500 },
    );
  }
  return crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
}

function createTelegramLinkToken({
  contactId,
  sessionId,
  profileId,
  email,
  ttlMs = 1000 * 60 * 60 * 24 * 7,
}) {
  const payload = {
    v: 1,
    contactId,
    sessionId,
    profileId,
    email: normalizeEmail(email),
    exp: Date.now() + ttlMs,
  };
  if (
    !payload.contactId ||
    !payload.sessionId ||
    !payload.profileId ||
    !payload.email
  ) {
    throw new Error("Cannot create Telegram link token without full context.");
  }
  const encodedPayload = base64UrlEncode(payload);
  const signature = signTelegramLinkPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function verifyTelegramLinkToken(token) {
  const [encodedPayload, signature] = String(token || "").split(".");
  if (!encodedPayload || !signature) {
    throw Object.assign(new Error("Invalid Telegram verification token."), {
      statusCode: 400,
    });
  }
  const expectedSignature = signTelegramLinkPayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    throw Object.assign(new Error("Invalid Telegram verification token."), {
      statusCode: 400,
    });
  }
  const payload = base64UrlDecode(encodedPayload);
  if (payload?.v !== 1 || !payload.contactId || !payload.sessionId) {
    throw Object.assign(new Error("Invalid Telegram verification token."), {
      statusCode: 400,
    });
  }
  if (!payload.exp || Date.now() > Number(payload.exp)) {
    throw Object.assign(new Error("Telegram verification token expired."), {
      statusCode: 400,
    });
  }
  payload.email = normalizeEmail(payload.email);
  if (!payload.email || !payload.profileId) {
    throw Object.assign(new Error("Invalid Telegram verification token."), {
      statusCode: 400,
    });
  }
  return payload;
}

function parseBody(body) {
  if (typeof body === "string") return body ? JSON.parse(body) : {};
  if (body && Buffer.isBuffer(body)) return JSON.parse(body.toString("utf8"));
  if (body && typeof body === "object") return body;
  return {};
}

function requireBearerSecret(req, envNames, label) {
  const token = bearerToken(req);
  const expected = envNames.map((name) => process.env[name]).filter(Boolean);

  if (!expected.length) {
    throw Object.assign(new Error(`${label} is not configured.`), {
      statusCode: 500,
    });
  }
  if (!token || !expected.includes(token)) {
    throw Object.assign(new Error("Unauthorized."), { statusCode: 401 });
  }
}

function requireTelegramOnboardingWebhookSecret(req) {
  const expected = process.env.TELEGRAM_ONBOARDING_WEBHOOK_SECRET;
  if (!expected) {
    throw Object.assign(
      new Error("TELEGRAM_ONBOARDING_WEBHOOK_SECRET is required."),
      { statusCode: 500 },
    );
  }

  const actual = headerValue(req.headers["x-telegram-bot-api-secret-token"]);
  if (actual !== expected) {
    throw Object.assign(new Error("Invalid Telegram webhook secret."), {
      statusCode: 401,
    });
  }
}

function telegramToken() {
  const token = process.env.TELEGRAM_ONBOARDING_BOT_TOKEN;
  if (!token) {
    throw Object.assign(
      new Error("TELEGRAM_ONBOARDING_BOT_TOKEN is required."),
      { statusCode: 500 },
    );
  }
  return token;
}

async function telegramRequest(method, payload) {
  const response = await fetch(
    `https://api.telegram.org/bot${telegramToken()}/${method}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    throw new Error(data?.description || `Telegram ${method} failed.`);
  }
  return data.result;
}

async function sendTelegramMessage(chatId, text, extra = {}) {
  return telegramRequest("sendMessage", {
    chat_id: String(chatId),
    text,
    disable_web_page_preview: true,
    ...extra,
  });
}

async function answerCallbackQuery(callbackQueryId, text) {
  if (!callbackQueryId) return null;
  return telegramRequest("answerCallbackQuery", {
    callback_query_id: String(callbackQueryId),
    text,
  });
}

function inlineKeyboard(rows) {
  return {
    reply_markup: {
      inline_keyboard: rows,
    },
  };
}

const PROFILE_STATUS_KEYBOARD = inlineKeyboard([
  [{ text: "Ho gia un profilo", callback_data: CALLBACK_ACTIONS.YES }],
  [{ text: "Crea un nuovo account", callback_data: CALLBACK_ACTIONS.NO }],
]);

const HANDLE_MATCH_KEYBOARD = inlineKeyboard([
  [
    {
      text: "Si, invia l'email di accesso",
      callback_data: CALLBACK_ACTIONS.YES,
    },
  ],
  [{ text: "Non sono io", callback_data: CALLBACK_ACTIONS.NOT_ME }],
]);

const CREATE_ACCOUNT_KEYBOARD = inlineKeyboard([
  [
    {
      text: "Crea un nuovo account",
      callback_data: CALLBACK_ACTIONS.CREATE_ACCOUNT,
    },
  ],
]);

const START_PRIVATE_ONBOARDING_KEYBOARD = inlineKeyboard([
  [
    {
      text: "Avvia registrazione sito",
      url: "https://t.me/IB_users_Bot?start=community",
    },
  ],
]);

function onboardingEmailDailyLimit() {
  const parsed = Number.parseInt(
    process.env.TELEGRAM_ONBOARDING_DAILY_EMAIL_LIMIT || "90",
    10,
  );
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 90;
}

function romeDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function parseResendTimestamp(value) {
  if (!value) return null;
  const normalized = String(value)
    .trim()
    .replace(" ", "T")
    .replace(/\.(\d{3})\d+/, ".$1")
    .replace(/([+-]\d{2})$/, "$1:00");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function nextRomeMorning(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .split("-")
    .map(Number);
  const [year, month, day] = parts;
  const utc = new Date(Date.UTC(year, month - 1, day + 1, 8, 0, 0));
  return utc.toISOString();
}

function callbackActionText(data) {
  if (data === CALLBACK_ACTIONS.YES) return "si";
  if (data === CALLBACK_ACTIONS.NO) return "no";
  if (data === CALLBACK_ACTIONS.NOT_ME) return "non sono io";
  if (data === CALLBACK_ACTIONS.CREATE_ACCOUNT) return "crea un nuovo account";
  return null;
}

function telegramOnboardingAdminChatIds() {
  return String(process.env.TELEGRAM_ONBOARDING_ADMIN_CHAT_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

async function notifyTelegramOnboardingAdmins({ contact, flagType, details }) {
  const chatIds = telegramOnboardingAdminChatIds();
  if (!chatIds.length) return;

  const lines = [
    "Segnalazione onboarding Telegram",
    `Tipo: ${flagType}`,
    `ID utente Telegram: ${contact.telegram_user_id || "sconosciuto"}`,
    `Username Telegram: ${contact.username || "nessuno"}`,
  ];

  if (details?.matched_profile_id) {
    lines.push(`Profilo trovato: ${details.matched_profile_id}`);
  }
  if (details?.matched_profile_username) {
    lines.push(`Username profilo trovato: ${details.matched_profile_username}`);
  }
  if (details?.reason) {
    lines.push(`Motivo: ${details.reason}`);
  }

  await Promise.allSettled(
    chatIds.map((chatId) => sendTelegramMessage(chatId, lines.join("\n"))),
  );
}

function compactText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeEmail(value) {
  const email = compactText(value).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function normalizeTelegramUsername(value) {
  const username = compactText(value).replace(/^@+/, "");
  if (!username || !/^[A-Za-z0-9_]{5,32}$/.test(username)) return null;
  return `@${username}`;
}

function obfuscateEmail(value) {
  const email = normalizeEmail(value);
  if (!email) return "questa email";
  const [local, domain] = email.split("@");
  const [domainName, ...domainRest] = domain.split(".");
  const mask = (part) => {
    if (!part) return "";
    if (part.length <= 2) return `${part[0] || ""}*`;
    return `${part[0]}${"*".repeat(Math.min(part.length - 2, 4))}${part.at(-1)}`;
  };
  return `${mask(local)}@${mask(domainName)}.${domainRest.join(".")}`;
}

function profileCompleteness(profile) {
  const checks = [
    ["nome", profile.full_name],
    ["titolo", profile.headline],
    ["bio", profile.bio],
    ["ruolo", profile.role],
    ["citta", profile.city || profile.location],
    ["avatar", profile.avatar_url],
    ["competenze", Array.isArray(profile.skills) && profile.skills.length > 0],
    [
      "cosa cerchi",
      Array.isArray(profile.looking_for) && profile.looking_for.length > 0,
    ],
  ];
  const missing = checks
    .filter(([, value]) => !value)
    .map(([label]) => label)
    .slice(0, 4);
  const score = Math.round(
    ((checks.length - checks.filter(([, value]) => !value).length) /
      checks.length) *
      100,
  );
  return { score, missing };
}

function newInviteToken() {
  return crypto.randomBytes(24).toString("hex");
}

function updateMessageFrom(update) {
  const updateType = ["message", "edited_message"].find((key) => update?.[key]);
  const message = updateType ? update[updateType] : null;
  return { updateType, message };
}

function memberFromChatMemberUpdate(update) {
  const chatMember = update?.chat_member || update?.my_chat_member;
  const user = chatMember?.new_chat_member?.user || chatMember?.from;
  if (!user?.id) return null;
  return {
    user,
    chat: chatMember.chat,
  };
}

function botMembershipFromUpdate(update) {
  const membership = update?.my_chat_member;
  const status = membership?.new_chat_member?.status;
  if (!membership?.chat?.id || !status) return null;
  if (!["member", "administrator"].includes(status)) return null;
  return {
    chat: membership.chat,
    status,
  };
}

function callbackMessageFrom(update) {
  const callbackQuery = update?.callback_query;
  const callbackMessage = callbackQuery?.message;
  const text = callbackActionText(callbackQuery?.data);
  if (!callbackQuery?.from?.id || !callbackMessage?.chat?.id || !text) {
    return null;
  }

  return {
    id: callbackQuery.id,
    message: {
      chat: callbackMessage.chat,
      from: callbackQuery.from,
      text,
    },
  };
}

function communityIntroMessage() {
  return [
    "Ciao builders. Sono il bot utenti di Italian Builders.",
    "",
    "Usatemi per collegare Telegram al profilo sul sito, recuperare l'accesso e creare il profilo se non lo avete ancora fatto.",
    "",
    "Scrivetemi in privato e vi guido in pochi passaggi. Se trovate un profilo gia associato al vostro username Telegram, vi faro verificare via email prima di dare accesso.",
  ].join("\n");
}

async function sendCommunityIntro(chatId) {
  await sendTelegramMessage(
    chatId,
    communityIntroMessage(),
    START_PRIVATE_ONBOARDING_KEYBOARD,
  );
}

async function upsertContactFromTelegramUser({
  supabaseAdmin,
  user,
  privateChatId,
  groupSeen = false,
}) {
  const now = new Date().toISOString();
  const username = normalizeTelegramUsername(user.username);
  const row = {
    telegram_user_id: user.id,
    username,
    first_name: compactText(user.first_name) || null,
    last_name: compactText(user.last_name) || null,
    language_code: compactText(user.language_code) || null,
  };

  if (privateChatId) {
    row.private_chat_id = privateChatId;
    row.started_at = now;
    row.last_private_seen_at = now;
  }

  if (groupSeen) {
    row.last_group_seen_at = now;
  }

  Object.keys(row).forEach((key) => {
    if (row[key] === undefined) delete row[key];
  });

  const { data, error } = await supabaseAdmin
    .from("telegram_onboarding_contacts")
    .upsert(row, { onConflict: "telegram_user_id" })
    .select("*")
    .single();
  if (error) throw error;

  return data;
}

async function currentSession(supabaseAdmin, contactId) {
  const { data, error } = await supabaseAdmin
    .from("telegram_onboarding_sessions")
    .select("*")
    .eq("contact_id", contactId)
    .is("completed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function createSession(supabaseAdmin, contactId, state, payload = {}) {
  const { data, error } = await supabaseAdmin
    .from("telegram_onboarding_sessions")
    .insert({
      contact_id: contactId,
      state,
      payload,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function updateSession(supabaseAdmin, sessionId, values) {
  const { data, error } = await supabaseAdmin
    .from("telegram_onboarding_sessions")
    .update(values)
    .eq("id", sessionId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function createAdminFlag({
  supabaseAdmin,
  contact,
  profileId = null,
  flagType,
  severity = "review",
  details = {},
}) {
  const { error } = await supabaseAdmin
    .from("telegram_onboarding_flags")
    .insert({
      contact_id: contact.id,
      profile_id: profileId,
      flag_type: flagType,
      severity,
      details,
    });
  if (error) throw error;

  await notifyTelegramOnboardingAdmins({
    contact,
    flagType,
    details,
  });
}

async function findProfilesByTelegramUsername(supabaseAdmin, username) {
  const normalized = normalizeTelegramUsername(username);
  if (!normalized) return [];
  const bare = normalized.replace(/^@/, "");
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, username, full_name, headline, bio, role, city, location, avatar_url, skills, looking_for, email, telegram_handle, telegram_bot_username",
    )
    .or(
      [
        `telegram_bot_username.eq.${normalized}`,
        `telegram_bot_username.eq.${bare}`,
        `telegram_handle.eq.${normalized}`,
        `telegram_handle.eq.${bare}`,
      ].join(","),
    );
  if (error) throw error;
  return data || [];
}

async function findProfileByEmail(supabaseAdmin, email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, username, full_name, headline, bio, role, city, location, avatar_url, skills, looking_for, email, telegram_handle, telegram_bot_username",
    )
    .eq("email", normalized)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function startOnboarding({ supabaseAdmin, contact, chatId }) {
  const profileMatches = await findProfilesByTelegramUsername(
    supabaseAdmin,
    contact.username,
  );

  if (profileMatches.length === 1) {
    const profile = profileMatches[0];
    const completeness = profileCompleteness(profile);
    const missing = completeness.missing.length
      ? ` Mancano: ${completeness.missing.join(", ")}.`
      : "";
    const profileLabel = profile.username
      ? `@${profile.username}`
      : profile.full_name || "un profilo Italian Builders esistente";
    const message = profile.email
      ? `Questo username Telegram sembra collegato a ${profileLabel}. L'email dell'account sembra ${obfuscateEmail(profile.email)}. Il profilo e completo circa al ${completeness.score}%.${missing}\n\nE il tuo account? Rispondi si per ricevere il link di accesso via email, oppure \"non sono io\" se questo profilo non e tuo.`
      : `Questo username Telegram sembra collegato a ${profileLabel}. Il profilo e completo circa al ${completeness.score}%.${missing}\n\nE il tuo account? Rispondi si, oppure \"non sono io\" se questo profilo non e tuo.`;

    const existing = await currentSession(supabaseAdmin, contact.id);
    const payload = {
      matched_profile_id: profile.id,
      matched_profile_email: profile.email,
      matched_profile_username: profile.username,
      matched_by: "telegram_username",
    };
    if (existing) {
      await updateSession(supabaseAdmin, existing.id, {
        state: SESSION_STATES.AWAITING_HANDLE_MATCH_CONFIRMATION,
        payload,
        waitlist_signup_id: null,
        invite_id: null,
        action_link_sent_at: null,
        completed_at: null,
      });
    } else {
      await createSession(
        supabaseAdmin,
        contact.id,
        SESSION_STATES.AWAITING_HANDLE_MATCH_CONFIRMATION,
        payload,
      );
    }

    await sendTelegramMessage(chatId, message, HANDLE_MATCH_KEYBOARD);
    return { stored: true, handleMatch: true };
  }

  if (profileMatches.length > 1) {
    await createAdminFlag({
      supabaseAdmin,
      contact,
      flagType: "multiple_handle_matches",
      severity: "high",
      details: {
        telegram_username: contact.username,
        matched_profile_ids: profileMatches.map((profile) => profile.id),
      },
    });
    await sendTelegramMessage(
      chatId,
      "Questo username Telegram compare su piu di un profilo del sito, quindi ho segnalato il caso agli admin. Mandami l'email che usi sul sito e continuo in modo sicuro.",
    );
    const existing = await currentSession(supabaseAdmin, contact.id);
    const payload = {
      matched_profile_ids: profileMatches.map((profile) => profile.id),
      matched_by: "telegram_username",
    };
    if (existing) {
      await updateSession(supabaseAdmin, existing.id, {
        state: SESSION_STATES.AWAITING_EXISTING_EMAIL,
        payload,
      });
    } else {
      await createSession(
        supabaseAdmin,
        contact.id,
        SESSION_STATES.AWAITING_EXISTING_EMAIL,
        payload,
      );
    }
    return { stored: true, multipleHandleMatches: true };
  }

  const existing = await currentSession(supabaseAdmin, contact.id);
  if (existing) {
    await updateSession(supabaseAdmin, existing.id, {
      state: SESSION_STATES.AWAITING_PROFILE_STATUS,
      payload: {},
      waitlist_signup_id: null,
      invite_id: null,
      action_link_sent_at: null,
      completed_at: null,
    });
  } else {
    await createSession(
      supabaseAdmin,
      contact.id,
      SESSION_STATES.AWAITING_PROFILE_STATUS,
    );
  }

  await sendTelegramMessage(
    chatId,
    "Benvenuto in Italian Builders. Hai gia creato il tuo profilo sul sito? Rispondi si o no.",
    PROFILE_STATUS_KEYBOARD,
  );
  return { stored: true, started: true };
}

function affirmative(text) {
  return /^(yes|y|si|sì|gia|già|done|created)$/i.test(compactText(text));
}

function negative(text) {
  return /^(no|n|not yet|non ancora|not me|this is not me|this isn't me|not mine)$/i.test(
    compactText(text),
  );
}

function wantsNewAccount(text) {
  return /^(create a new account|create new account|new account|create account|start new account|make a new account|crea un nuovo account|crea nuovo account|nuovo account|crea account|crea un nuovo profilo|crea nuovo profilo|nuovo profilo)$/i.test(
    compactText(text),
  );
}

async function createInviteActionLink({ supabaseAdmin, email, redirectTo }) {
  const inviteResult = await supabaseAdmin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo },
  });

  if (!inviteResult.error) return inviteResult.data;

  const message = String(inviteResult.error?.message || "").toLowerCase();
  if (
    !message.includes("already registered") &&
    !message.includes("already been registered") &&
    !message.includes("user already exists")
  ) {
    throw inviteResult.error;
  }

  const recoveryResult = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });
  if (recoveryResult.error) throw recoveryResult.error;
  return recoveryResult.data;
}

async function createMagicLoginLink({ supabaseAdmin, email, redirectTo }) {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  if (error) throw error;

  const actionLink = data?.properties?.action_link || data?.action_link;
  if (!actionLink) throw new Error("Could not generate Supabase magic link.");
  return actionLink;
}

async function sendMagicLoginEmail({ supabaseAdmin, email, redirectTo }) {
  const { error } = await supabaseAdmin.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: redirectTo,
    },
  });
  if (error) throw error;
}

async function internalSentEmailCountToday(supabaseAdmin) {
  const { count, error } = await supabaseAdmin
    .from("telegram_onboarding_email_deliveries")
    .select("id", { count: "exact", head: true })
    .eq("quota_date", romeDateString())
    .eq("status", "sent");
  if (error) throw error;
  return count || 0;
}

async function resendSentEmailCountToday({
  apiKey = process.env.RESEND_API_KEY,
  fetchImpl = globalThis.fetch,
  today = romeDateString(),
  maxPages = 20,
} = {}) {
  if (!apiKey) {
    return {
      available: false,
      count: null,
      source: "resend",
      reason: "missing_resend_api_key",
      today,
    };
  }
  if (typeof fetchImpl !== "function") {
    return {
      available: false,
      count: null,
      source: "resend",
      reason: "missing_fetch",
      today,
    };
  }

  let after = null;
  let count = 0;
  let pages = 0;

  while (pages < maxPages) {
    const url = new URL("https://api.resend.com/emails");
    url.searchParams.set("limit", "100");
    if (after) url.searchParams.set("after", after);

    let response;
    try {
      response = await fetchImpl(url.toString(), {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      });
    } catch (error) {
      return {
        available: false,
        count: null,
        source: "resend",
        reason: error instanceof Error ? error.message : String(error),
        today,
      };
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      return {
        available: false,
        count: null,
        source: "resend",
        reason: `resend_${response.status}${errorBody ? "_response" : ""}`,
        today,
      };
    }

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      return {
        available: false,
        count: null,
        source: "resend",
        reason: "invalid_resend_response",
        today,
      };
    }

    const rows = Array.isArray(payload?.data) ? payload.data : [];
    let sawOlderEmail = false;
    pages += 1;

    for (const row of rows) {
      const createdAt = parseResendTimestamp(row?.created_at);
      if (!createdAt) continue;
      const quotaDate = romeDateString(createdAt);
      if (quotaDate === today) {
        count += 1;
      } else if (quotaDate < today) {
        sawOlderEmail = true;
      }
    }

    if (!payload?.has_more || rows.length === 0 || sawOlderEmail) {
      return {
        available: true,
        count,
        source: "resend",
        today,
        pages,
        truncated: false,
      };
    }

    after = rows[rows.length - 1]?.id;
    if (!after) {
      return {
        available: false,
        count: null,
        source: "resend",
        reason: "missing_pagination_cursor",
        today,
        pages,
      };
    }
  }

  return {
    available: true,
    count,
    source: "resend",
    today,
    pages,
    truncated: true,
  };
}

async function sentEmailCountToday(supabaseAdmin) {
  const resendCount = await resendSentEmailCountToday();
  if (resendCount.available) return resendCount;

  if (process.env.RESEND_API_KEY) {
    return resendCount;
  }

  const internalCount = await internalSentEmailCountToday(supabaseAdmin);
  return {
    available: true,
    count: internalCount,
    source: "internal_fallback",
    reason: resendCount.reason,
    today: romeDateString(),
  };
}

async function recordEmailDelivery({
  supabaseAdmin,
  contact,
  sessionId,
  email,
  purpose,
  status,
  redirectTo,
  scheduledFor = null,
  error = null,
}) {
  const { data, error: insertError } = await supabaseAdmin
    .from("telegram_onboarding_email_deliveries")
    .insert({
      contact_id: contact?.id || null,
      session_id: sessionId || null,
      email,
      purpose,
      status,
      quota_date: romeDateString(),
      redirect_to: redirectTo || null,
      scheduled_for: scheduledFor,
      sent_at: status === "sent" ? new Date().toISOString() : null,
      error,
    })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return data;
}

async function queueMagicLoginEmail({
  supabaseAdmin,
  contact,
  session,
  email,
  redirectTo,
  purpose,
  reason = null,
}) {
  const scheduledFor = nextRomeMorning();
  await recordEmailDelivery({
    supabaseAdmin,
    contact,
    sessionId: session?.id,
    email,
    purpose,
    status: "queued",
    redirectTo,
    scheduledFor,
    error: reason,
  });
  if (session?.id) {
    await updateSession(supabaseAdmin, session.id, {
      state: SESSION_STATES.EMAIL_QUOTA_WAITING,
      payload: {
        ...(session.payload || {}),
        email,
        pending_magic_link_email: email,
        pending_magic_link_redirect_to: redirectTo,
        pending_magic_link_purpose: purpose,
        email_quota_exhausted_at: new Date().toISOString(),
        email_quota_queue_reason: reason,
      },
    });
  }
  return { queued: true, scheduledFor, reason };
}

async function sendMagicLoginEmailWithQuota({
  supabaseAdmin,
  contact,
  session,
  email,
  redirectTo,
  purpose,
}) {
  const quota = await sentEmailCountToday(supabaseAdmin);
  const limit = onboardingEmailDailyLimit();
  if (!quota.available) {
    return queueMagicLoginEmail({
      supabaseAdmin,
      contact,
      session,
      email,
      redirectTo,
      purpose,
      reason: `email_quota_check_unavailable:${quota.reason || "unknown"}`,
    });
  }

  const sentToday = quota.count || 0;
  if (sentToday >= limit || (quota.truncated && sentToday < limit)) {
    return queueMagicLoginEmail({
      supabaseAdmin,
      contact,
      session,
      email,
      redirectTo,
      purpose,
      reason:
        sentToday >= limit
          ? "email_quota_exhausted"
          : "email_quota_count_truncated",
    });
  }

  try {
    await sendMagicLoginEmail({
      supabaseAdmin,
      email,
      redirectTo,
    });
    await recordEmailDelivery({
      supabaseAdmin,
      contact,
      sessionId: session?.id,
      email,
      purpose,
      status: "sent",
      redirectTo,
    });
    return {
      sent: true,
      sentToday: sentToday + 1,
      remainingToday: Math.max(limit - sentToday - 1, 0),
      quotaSource: quota.source,
    };
  } catch (sendError) {
    await recordEmailDelivery({
      supabaseAdmin,
      contact,
      sessionId: session?.id,
      email,
      purpose,
      status: "failed",
      redirectTo,
      error: sendError instanceof Error ? sendError.message : String(sendError),
    });
    throw sendError;
  }
}

async function processQueuedMagicLoginEmails({
  supabaseAdmin,
  limit = 50,
} = {}) {
  const emailLimit = onboardingEmailDailyLimit();
  const quota = await sentEmailCountToday(supabaseAdmin);
  if (!quota.available) {
    return {
      processed: 0,
      skipped: true,
      reason: "email_quota_check_unavailable",
      quotaSource: quota.source,
      quotaReason: quota.reason,
    };
  }

  const sentToday = quota.count || 0;
  if (quota.truncated && sentToday < emailLimit) {
    return {
      processed: 0,
      skipped: true,
      reason: "email_quota_count_truncated",
      quotaSource: quota.source,
      sentToday,
    };
  }

  const remaining = emailLimit - sentToday;
  const batchSize = Math.max(Math.min(remaining, limit), 0);
  if (batchSize <= 0) {
    return {
      processed: 0,
      skipped: true,
      reason: "email_quota_exhausted",
      quotaSource: quota.source,
      sentToday,
      remainingToday: 0,
    };
  }

  const { data: queuedRows, error } = await supabaseAdmin
    .from("telegram_onboarding_email_deliveries")
    .select("*, telegram_onboarding_contacts(private_chat_id)")
    .eq("status", "queued")
    .lte("scheduled_for", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(batchSize);
  if (error) throw error;

  let processed = 0;
  for (const row of queuedRows || []) {
    try {
      await sendMagicLoginEmail({
        supabaseAdmin,
        email: row.email,
        redirectTo: row.redirect_to,
      });
      await supabaseAdmin
        .from("telegram_onboarding_email_deliveries")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          quota_date: romeDateString(),
          error: null,
        })
        .eq("id", row.id);

      if (row.session_id) {
        await updateSession(supabaseAdmin, row.session_id, {
          state: SESSION_STATES.MAGIC_LINK_EMAIL_SENT,
          completed_at: new Date().toISOString(),
        });
      }

      const privateChatId = row.telegram_onboarding_contacts?.private_chat_id;
      if (privateChatId) {
        await sendTelegramMessage(
          privateChatId,
          `Ho appena inviato il link di accesso a ${obfuscateEmail(row.email)}. Apri l'email piu recente e usa il codice su Italian Builders.`,
        );
      }
      processed += 1;
    } catch (queueError) {
      await supabaseAdmin
        .from("telegram_onboarding_email_deliveries")
        .update({
          status: "failed",
          error:
            queueError instanceof Error
              ? queueError.message
              : String(queueError),
        })
        .eq("id", row.id);
    }
  }

  return {
    processed,
    queued: queuedRows?.length || 0,
    quotaSource: quota.source,
    sentToday: sentToday + processed,
    remainingToday: Math.max(emailLimit - sentToday - processed, 0),
  };
}

async function sendQuotaExhaustedMessage(chatId, email) {
  await sendTelegramMessage(
    chatId,
    `Per oggi abbiamo finito le email disponibili per gli accessi. Ho messo in coda il tuo link di accesso per ${obfuscateEmail(email)}: appena si riapre la quota lo invio automaticamente. Se preferisci, torna domani e scrivimi /start per riprendere.`,
  );
}

function loginCodeRedirectUrl(req, email, next = "/dashboard", extra = {}) {
  const params = new URLSearchParams({
    email,
    next,
  });
  Object.entries(extra).forEach(([key, value]) => {
    if (value) params.set(key, String(value));
  });
  return `${appBaseUrl(req)}/login-code?${params.toString()}`;
}

async function linkExistingProfile({ supabaseAdmin, contact, email }) {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  if (!profile) return null;

  await supabaseAdmin
    .from("telegram_onboarding_contacts")
    .update({
      website_profile_id: profile.id,
      website_profile_linked_at: new Date().toISOString(),
    })
    .eq("id", contact.id);

  if (contact.username) {
    await supabaseAdmin
      .from("profiles")
      .update({
        telegram_bot_username: contact.username,
        telegram_bot_username_set_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
  }

  return profile;
}

async function linkTelegramOnboardingProfile(req, body = {}) {
  const queryToken = Array.isArray(req.query?.token)
    ? req.query.token[0]
    : req.query?.token;
  const linkToken = body.linkToken || body.telegramLinkToken || queryToken;
  if (!linkToken) {
    throw Object.assign(new Error("Missing Telegram verification token."), {
      statusCode: 400,
    });
  }

  const authToken = bearerToken(req);
  if (!authToken) {
    throw Object.assign(new Error("Missing authenticated session."), {
      statusCode: 401,
    });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: userData, error: userError } =
    await supabaseAdmin.auth.getUser(authToken);
  if (userError || !userData.user) {
    throw Object.assign(new Error("Invalid or expired session."), {
      statusCode: 401,
    });
  }

  const payload = verifyTelegramLinkToken(linkToken);
  const userEmail = normalizeEmail(userData.user.email);
  if (!userEmail || userEmail !== payload.email) {
    throw Object.assign(
      new Error(
        "Questo link Telegram deve essere aperto con la stessa email verificata.",
      ),
      { statusCode: 403 },
    );
  }

  if (userData.user.id !== payload.profileId) {
    throw Object.assign(
      new Error(
        "La sessione autenticata non corrisponde al profilo Telegram da collegare.",
      ),
      { statusCode: 403 },
    );
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, email")
    .eq("id", payload.profileId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) {
    throw Object.assign(new Error("Profilo non trovato."), { statusCode: 404 });
  }
  if (normalizeEmail(profile.email) !== payload.email) {
    throw Object.assign(
      new Error("L'email del profilo non corrisponde alla verifica Telegram."),
      { statusCode: 403 },
    );
  }

  const { data: contact, error: contactError } = await supabaseAdmin
    .from("telegram_onboarding_contacts")
    .select("id, username, website_profile_id")
    .eq("id", payload.contactId)
    .maybeSingle();
  if (contactError) throw contactError;
  if (!contact) {
    throw Object.assign(new Error("Contatto Telegram non trovato."), {
      statusCode: 404,
    });
  }
  if (
    contact.website_profile_id &&
    contact.website_profile_id !== payload.profileId
  ) {
    throw Object.assign(
      new Error("Questo contatto Telegram e gia collegato a un altro profilo."),
      { statusCode: 409 },
    );
  }

  const { data: session, error: sessionError } = await supabaseAdmin
    .from("telegram_onboarding_sessions")
    .select("*")
    .eq("id", payload.sessionId)
    .eq("contact_id", payload.contactId)
    .maybeSingle();
  if (sessionError) throw sessionError;
  if (!session) {
    throw Object.assign(new Error("Sessione Telegram non trovata."), {
      statusCode: 404,
    });
  }

  const now = new Date().toISOString();
  const { error: updateContactError } = await supabaseAdmin
    .from("telegram_onboarding_contacts")
    .update({
      website_profile_id: payload.profileId,
      website_profile_linked_at: now,
    })
    .eq("id", payload.contactId);
  if (updateContactError) throw updateContactError;

  if (contact.username) {
    const { error: updateProfileError } = await supabaseAdmin
      .from("profiles")
      .update({
        telegram_bot_username: contact.username,
        telegram_bot_username_set_at: now,
      })
      .eq("id", payload.profileId);
    if (updateProfileError) throw updateProfileError;
  }

  await updateSession(supabaseAdmin, session.id, {
    state: SESSION_STATES.LINKED_EXISTING_PROFILE,
    payload: {
      ...(session.payload || {}),
      linked_profile_id: payload.profileId,
      telegram_link_verified_at: now,
    },
    completed_at: now,
  });

  return {
    linked: true,
    contactId: payload.contactId,
    profileId: payload.profileId,
  };
}

async function upsertWaitlistSignup({ supabaseAdmin, contact, payload }) {
  const row = {
    name: payload.name,
    email: payload.email,
    role: payload.role,
    building: payload.building || null,
    telegram_handle: contact.username || null,
    source: "Telegram onboarding bot",
    telegram_onboarding_contact_id: contact.id,
  };

  const { data: existing, error: loadError } = await supabaseAdmin
    .from("waitlist_signups")
    .select("*")
    .eq("email", payload.email)
    .maybeSingle();
  if (loadError) throw loadError;

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from("waitlist_signups")
      .update(row)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabaseAdmin
    .from("waitlist_signups")
    .insert(row)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function completeInvite({ supabaseAdmin, req, contact, session }) {
  const payload = session.payload || {};
  const waitlistSignup = await upsertWaitlistSignup({
    supabaseAdmin,
    contact,
    payload,
  });
  const token = newInviteToken();
  const expiresAt = new Date(
    Date.now() + 1000 * 60 * 60 * 24 * 30,
  ).toISOString();
  const inviteUrl = `${appBaseUrl(req)}/invite/${token}`;

  const { data: invite, error: inviteError } = await supabaseAdmin
    .from("invites")
    .insert({
      email: payload.email,
      telegram_handle: contact.username || null,
      token,
      expires_at: expiresAt,
      telegram_onboarding_contact_id: contact.id,
      delivery_channel: "telegram_bot",
    })
    .select("*")
    .single();
  if (inviteError) throw inviteError;

  const linkData = await createInviteActionLink({
    supabaseAdmin,
    email: payload.email,
    redirectTo: inviteUrl,
  });
  const actionLink = linkData?.properties?.action_link || linkData?.action_link;
  if (!actionLink) throw new Error("Could not generate Supabase invite link.");

  await supabaseAdmin
    .from("waitlist_signups")
    .update({
      status: "active",
      activated_at: new Date().toISOString(),
      invite_id: invite.id,
      invite_email_error: null,
    })
    .eq("id", waitlistSignup.id);

  await updateSession(supabaseAdmin, session.id, {
    state: SESSION_STATES.COMPLETED,
    waitlist_signup_id: waitlistSignup.id,
    invite_id: invite.id,
    action_link_sent_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  });

  return {
    actionLink,
    inviteId: invite.id,
    waitlistSignupId: waitlistSignup.id,
  };
}

async function handleOnboardingMessage({
  req,
  supabaseAdmin,
  contact,
  message,
}) {
  const chatId = message.chat.id;
  const text = compactText(message.text || message.caption);

  if (/^\/start\b/i.test(text)) {
    return startOnboarding({ supabaseAdmin, contact, chatId });
  }

  const session =
    (await currentSession(supabaseAdmin, contact.id)) ||
    (await createSession(
      supabaseAdmin,
      contact.id,
      SESSION_STATES.AWAITING_PROFILE_STATUS,
    ));

  const payload = session.payload || {};

  if (session.state === SESSION_STATES.AWAITING_PROFILE_STATUS) {
    if (affirmative(text)) {
      await updateSession(supabaseAdmin, session.id, {
        state: SESSION_STATES.AWAITING_EXISTING_EMAIL,
        payload: { already_has_profile: true },
      });
      await sendTelegramMessage(
        chatId,
        "Perfetto. Mandami l'email che usi sul sito e la verifico in modo sicuro.",
      );
      return { stored: true, existingProfile: true };
    }

    if (!negative(text)) {
      await sendTelegramMessage(
        chatId,
        "Scegli una delle opzioni qui sotto.",
        PROFILE_STATUS_KEYBOARD,
      );
      return { stored: true, waitingForProfileStatus: true };
    }

    await updateSession(supabaseAdmin, session.id, {
      state: SESSION_STATES.AWAITING_NAME,
      payload: { already_has_profile: false },
    });
    await sendTelegramMessage(
      chatId,
      "Che nome vuoi mostrare sul tuo profilo?",
    );
    return { stored: true, waitingForName: true };
  }

  if (session.state === SESSION_STATES.AWAITING_HANDLE_MATCH_CONFIRMATION) {
    if (affirmative(text)) {
      const matchedEmail = normalizeEmail(payload.matched_profile_email);
      if (!matchedEmail) {
        await updateSession(supabaseAdmin, session.id, {
          state: SESSION_STATES.AWAITING_EXISTING_EMAIL,
          payload,
        });
        await sendTelegramMessage(
          chatId,
          "Quel profilo non ha un'email salvata. Mandami l'email che usi sul sito e la verifico in modo sicuro.",
        );
        return { stored: true, waitingForExistingEmail: true };
      }

      if (contact.website_profile_id === payload.matched_profile_id) {
        const redirectTo = loginCodeRedirectUrl(req, matchedEmail);
        const actionLink = await createMagicLoginLink({
          supabaseAdmin,
          email: matchedEmail,
          redirectTo,
        });
        await updateSession(supabaseAdmin, session.id, {
          state: SESSION_STATES.LINKED_EXISTING_PROFILE,
          completed_at: new Date().toISOString(),
        });
        await sendTelegramMessage(
          chatId,
          `Ecco il tuo link privato per accedere al sito:\n\n${actionLink}`,
        );
        return { stored: true, magicLoginSent: true };
      }

      const telegramLinkToken = createTelegramLinkToken({
        contactId: contact.id,
        sessionId: session.id,
        profileId: payload.matched_profile_id,
        email: matchedEmail,
      });
      const redirectTo = loginCodeRedirectUrl(req, matchedEmail, "/dashboard", {
        tg_link: telegramLinkToken,
      });
      const delivery = await sendMagicLoginEmailWithQuota({
        supabaseAdmin,
        contact,
        session,
        email: matchedEmail,
        redirectTo,
        purpose: "handle_match_login",
      });
      if (delivery.queued) {
        await sendQuotaExhaustedMessage(chatId, matchedEmail);
        return { stored: true, magicLoginQueued: true };
      }
      await updateSession(supabaseAdmin, session.id, {
        state: SESSION_STATES.MAGIC_LINK_EMAIL_SENT,
        completed_at: new Date().toISOString(),
      });
      await sendTelegramMessage(
        chatId,
        `Ho inviato un link di accesso a ${obfuscateEmail(matchedEmail)}. Non mando il link qui su Telegram perche questo account Telegram non e ancora verificato rispetto a quel profilo del sito.`,
      );
      return { stored: true, magicLoginEmailSent: true };
    }

    if (negative(text) || wantsNewAccount(text)) {
      const createNewAccount = wantsNewAccount(text);
      await createAdminFlag({
        supabaseAdmin,
        contact,
        profileId: payload.matched_profile_id || null,
        flagType: "handle_match_declined",
        severity: "high",
        details: {
          telegram_username: contact.username,
          matched_profile_id: payload.matched_profile_id,
          matched_profile_username: payload.matched_profile_username,
          reason:
            "L'utente Telegram ha dichiarato che il profilo trovato non e suo.",
        },
      });
      await updateSession(supabaseAdmin, session.id, {
        state: createNewAccount
          ? SESSION_STATES.AWAITING_NAME
          : SESSION_STATES.AWAITING_HANDLE_MISMATCH_CHOICE,
        payload: {
          ...payload,
          handle_match_declined: true,
          already_has_profile: false,
          create_new_account_after_handle_mismatch: createNewAccount,
        },
      });
      if (createNewAccount) {
        await sendTelegramMessage(
          chatId,
          "Grazie. Ho segnalato questa discrepanza agli admin. Che nome vuoi mostrare sul nuovo profilo?",
        );
        return { stored: true, waitingForName: true };
      }

      await sendTelegramMessage(
        chatId,
        'Grazie. Ho segnalato questa discrepanza agli admin. Se hai gia un altro account sul sito, mandami quella email. Altrimenti rispondi "crea un nuovo account" e preparo un profilo separato.',
        CREATE_ACCOUNT_KEYBOARD,
      );
      return { stored: true, handleMatchDeclined: true };
    }

    await sendTelegramMessage(
      chatId,
      "Scegli una delle opzioni qui sotto.",
      HANDLE_MATCH_KEYBOARD,
    );
    return { stored: true, waitingForHandleMatchConfirmation: true };
  }

  if (session.state === SESSION_STATES.AWAITING_HANDLE_MISMATCH_CHOICE) {
    if (wantsNewAccount(text) || negative(text)) {
      await updateSession(supabaseAdmin, session.id, {
        state: SESSION_STATES.AWAITING_NAME,
        payload: {
          ...payload,
          already_has_profile: false,
          create_new_account_after_handle_mismatch: true,
        },
      });
      await sendTelegramMessage(
        chatId,
        "Che nome vuoi mostrare sul nuovo profilo?",
      );
      return { stored: true, waitingForName: true };
    }

    const email = normalizeEmail(text);
    if (email) {
      await updateSession(supabaseAdmin, session.id, {
        state: SESSION_STATES.AWAITING_EXISTING_EMAIL,
        payload,
      });
      return handleOnboardingMessage({
        req,
        supabaseAdmin,
        contact,
        message,
      });
    }

    await sendTelegramMessage(
      chatId,
      'Mandami l\'email del tuo account esistente sul sito, oppure rispondi "crea un nuovo account".',
      CREATE_ACCOUNT_KEYBOARD,
    );
    return { stored: true, waitingForHandleMismatchChoice: true };
  }

  if (session.state === SESSION_STATES.AWAITING_EXISTING_EMAIL) {
    const email = normalizeEmail(text);
    if (!email) {
      await sendTelegramMessage(chatId, "Mandami un indirizzo email valido.");
      return { stored: true, waitingForExistingEmail: true };
    }

    const profile = await findProfileByEmail(supabaseAdmin, email);
    if (!profile) {
      await sendTelegramMessage(
        chatId,
        "Non ho trovato un profilo approvato sul sito per questa email. Rispondi no se vuoi crearne uno ora.",
        CREATE_ACCOUNT_KEYBOARD,
      );
      return { stored: true, existingProfileNotFound: true };
    }

    if (
      payload.matched_profile_email &&
      normalizeEmail(payload.matched_profile_email) !== email
    ) {
      await createAdminFlag({
        supabaseAdmin,
        contact,
        profileId: payload.matched_profile_id || null,
        flagType: "handle_email_mismatch",
        severity: "high",
        details: {
          telegram_username: contact.username,
          matched_profile_id: payload.matched_profile_id,
          matched_profile_email: obfuscateEmail(payload.matched_profile_email),
          provided_email: obfuscateEmail(email),
          reason:
            "Lo username Telegram corrispondeva a un profilo, ma l'utente ha fornito un'email diversa.",
        },
      });
    }

    if (contact.website_profile_id === profile.id) {
      const redirectTo = loginCodeRedirectUrl(req, email);
      await linkExistingProfile({
        supabaseAdmin,
        contact,
        email,
      });
      const actionLink = await createMagicLoginLink({
        supabaseAdmin,
        email,
        redirectTo,
      });
      await updateSession(supabaseAdmin, session.id, {
        state: SESSION_STATES.LINKED_EXISTING_PROFILE,
        payload: { already_has_profile: true, email },
        completed_at: new Date().toISOString(),
      });
      await sendTelegramMessage(
        chatId,
        `Ecco il tuo link privato per accedere al sito:\n\n${actionLink}`,
      );
      return { stored: true, magicLoginSent: true };
    }

    const telegramLinkToken = createTelegramLinkToken({
      contactId: contact.id,
      sessionId: session.id,
      profileId: profile.id,
      email,
    });
    const redirectTo = loginCodeRedirectUrl(req, email, "/dashboard", {
      tg_link: telegramLinkToken,
    });
    const delivery = await sendMagicLoginEmailWithQuota({
      supabaseAdmin,
      contact,
      session,
      email,
      redirectTo,
      purpose: "existing_profile_login",
    });
    if (delivery.queued) {
      await sendQuotaExhaustedMessage(chatId, email);
      return { stored: true, magicLoginQueued: true };
    }

    await updateSession(supabaseAdmin, session.id, {
      state: SESSION_STATES.MAGIC_LINK_EMAIL_SENT,
      payload: {
        already_has_profile: true,
        email,
        pending_profile_id: profile.id,
      },
      completed_at: new Date().toISOString(),
    });
    await sendTelegramMessage(
      chatId,
      `Ho inviato un link di accesso a ${obfuscateEmail(email)}. Non mando il link qui su Telegram perche questo account Telegram non e ancora verificato rispetto a quel profilo del sito.`,
    );
    return { stored: true, magicLoginEmailSent: true };
  }

  if (session.state === SESSION_STATES.AWAITING_NAME) {
    if (text.length < 2) {
      await sendTelegramMessage(chatId, "Mandami il tuo nome completo.");
      return { stored: true, waitingForName: true };
    }
    await updateSession(supabaseAdmin, session.id, {
      state: SESSION_STATES.AWAITING_EMAIL,
      payload: { ...payload, name: text.slice(0, 120) },
    });
    await sendTelegramMessage(
      chatId,
      "Quale email vuoi usare per l'account sul sito?",
    );
    return { stored: true, waitingForEmail: true };
  }

  if (session.state === SESSION_STATES.AWAITING_EMAIL) {
    const email = normalizeEmail(text);
    if (!email) {
      await sendTelegramMessage(chatId, "Mandami un indirizzo email valido.");
      return { stored: true, waitingForEmail: true };
    }

    const existingProfile = await findProfileByEmail(supabaseAdmin, email);
    if (existingProfile) {
      await createAdminFlag({
        supabaseAdmin,
        contact,
        profileId: existingProfile.id,
        flagType: "existing_profile_email_in_new_flow",
        severity: "review",
        details: {
          telegram_username: contact.username,
          provided_email: obfuscateEmail(email),
        },
      });

      if (contact.website_profile_id === existingProfile.id) {
        const redirectTo = loginCodeRedirectUrl(req, email);
        await linkExistingProfile({
          supabaseAdmin,
          contact,
          email,
        });
        const actionLink = await createMagicLoginLink({
          supabaseAdmin,
          email,
          redirectTo,
        });
        await updateSession(supabaseAdmin, session.id, {
          state: SESSION_STATES.LINKED_EXISTING_PROFILE,
          payload: { already_has_profile: true, email },
          completed_at: new Date().toISOString(),
        });
        await sendTelegramMessage(
          chatId,
          `Questa email ha gia un profilo sul sito. Ecco il tuo link privato per accedere:\n\n${actionLink}`,
        );
        return { stored: true, existingProfileRecovered: true };
      }

      const telegramLinkToken = createTelegramLinkToken({
        contactId: contact.id,
        sessionId: session.id,
        profileId: existingProfile.id,
        email,
      });
      const redirectTo = loginCodeRedirectUrl(req, email, "/dashboard", {
        tg_link: telegramLinkToken,
      });
      const delivery = await sendMagicLoginEmailWithQuota({
        supabaseAdmin,
        contact,
        session,
        email,
        redirectTo,
        purpose: "existing_profile_recovery_from_new_flow",
      });
      if (delivery.queued) {
        await sendQuotaExhaustedMessage(chatId, email);
        return { stored: true, magicLoginQueued: true };
      }
      await updateSession(supabaseAdmin, session.id, {
        state: SESSION_STATES.MAGIC_LINK_EMAIL_SENT,
        payload: {
          already_has_profile: true,
          email,
          pending_profile_id: existingProfile.id,
          recovered_from_new_profile_flow: true,
        },
        completed_at: new Date().toISOString(),
      });
      await sendTelegramMessage(
        chatId,
        `Questa email ha gia un profilo sul sito, quindi ho inviato un link di accesso a ${obfuscateEmail(email)} invece di creare un invito duplicato.`,
      );
      return { stored: true, existingProfileRecoveredByEmail: true };
    }

    await updateSession(supabaseAdmin, session.id, {
      state: SESSION_STATES.AWAITING_ROLE,
      payload: { ...payload, email },
    });
    await sendTelegramMessage(
      chatId,
      "Quale ruolo ti descrive meglio? Per esempio: fondatore, sviluppatore, designer, operatore, studente.",
    );
    return { stored: true, waitingForRole: true };
  }

  if (session.state === SESSION_STATES.AWAITING_ROLE) {
    if (text.length < 2) {
      await sendTelegramMessage(chatId, "Mandami un ruolo breve.");
      return { stored: true, waitingForRole: true };
    }
    await updateSession(supabaseAdmin, session.id, {
      state: SESSION_STATES.AWAITING_BUILDING,
      payload: { ...payload, role: text.slice(0, 120) },
    });
    await sendTelegramMessage(
      chatId,
      "Cosa stai costruendo o esplorando in questo momento? Basta un breve paragrafo.",
    );
    return { stored: true, waitingForBuilding: true };
  }

  if (session.state === SESSION_STATES.AWAITING_BUILDING) {
    const updatedSession = await updateSession(supabaseAdmin, session.id, {
      payload: { ...payload, building: text.slice(0, 1000) },
    });
    const { actionLink } = await completeInvite({
      supabaseAdmin,
      req,
      contact,
      session: updatedSession,
    });
    await sendTelegramMessage(
      chatId,
      `La bozza del tuo profilo e pronta. Apri questo link per completare l'account e scegliere la password:\n\n${actionLink}`,
    );
    return { stored: true, completed: true };
  }

  if (session.state === SESSION_STATES.EMAIL_QUOTA_WAITING) {
    const pendingEmail = normalizeEmail(payload.pending_magic_link_email);
    await sendTelegramMessage(
      chatId,
      pendingEmail
        ? `Il tuo link di accesso per ${obfuscateEmail(pendingEmail)} e ancora in coda perche oggi abbiamo raggiunto il limite email. Lo invio automaticamente quando si riapre la quota.`
        : "Il tuo link di accesso e ancora in coda perche oggi abbiamo raggiunto il limite email. Lo invio automaticamente quando si riapre la quota.",
    );
    return { stored: true, emailQuotaWaiting: true };
  }

  await sendTelegramMessage(
    chatId,
    "Scrivi /start se vuoi riavviare il flusso di registrazione sul sito.",
  );
  return { stored: true, idle: true };
}

async function storeTelegramOnboardingUpdate(req, update) {
  const supabaseAdmin = getSupabaseAdmin();
  const botMembership = botMembershipFromUpdate(update);
  if (botMembership?.chat?.id) {
    await sendCommunityIntro(botMembership.chat.id);
    return {
      stored: true,
      reason: "Onboarding bot introduced itself.",
      chatId: String(botMembership.chat.id),
      status: botMembership.status,
    };
  }

  const callback = callbackMessageFrom(update);

  if (callback?.message?.from?.id) {
    const contact = await upsertContactFromTelegramUser({
      supabaseAdmin,
      user: callback.message.from,
      privateChatId: callback.message.chat.id,
      groupSeen: false,
    });
    await answerCallbackQuery(callback.id, "Ricevuto.");
    return handleOnboardingMessage({
      req,
      supabaseAdmin,
      contact,
      message: callback.message,
    });
  }

  const { message } = updateMessageFrom(update);

  if (message?.from?.id) {
    const isPrivate = message.chat?.type === "private";
    const contact = await upsertContactFromTelegramUser({
      supabaseAdmin,
      user: message.from,
      privateChatId: isPrivate ? message.chat.id : null,
      groupSeen: !isPrivate,
    });

    if (!isPrivate) {
      return {
        stored: true,
        reason: "Group sender observed.",
        telegramUserId: String(contact.telegram_user_id),
      };
    }

    return handleOnboardingMessage({
      req,
      supabaseAdmin,
      contact,
      message,
    });
  }

  const member = memberFromChatMemberUpdate(update);
  if (member?.user?.id) {
    const contact = await upsertContactFromTelegramUser({
      supabaseAdmin,
      user: member.user,
      privateChatId: null,
      groupSeen: true,
    });
    return {
      stored: true,
      reason: "Chat member observed.",
      telegramUserId: String(contact.telegram_user_id),
    };
  }

  return { stored: false, reason: "No supported Telegram onboarding update." };
}

async function processQueuedTelegramOnboardingEmails({ limit = 50 } = {}) {
  const supabaseAdmin = getSupabaseAdmin();
  return processQueuedMagicLoginEmails({ supabaseAdmin, limit });
}

async function setupTelegramOnboardingWebhook({
  dropPendingUpdates = false,
} = {}) {
  const secret = process.env.TELEGRAM_ONBOARDING_WEBHOOK_SECRET;
  if (!secret) {
    throw Object.assign(
      new Error("TELEGRAM_ONBOARDING_WEBHOOK_SECRET is required."),
      { statusCode: 500 },
    );
  }

  return telegramRequest("setWebhook", {
    url: `${appBaseUrl()}/api/telegram-onboarding/webhook`,
    secret_token: secret,
    allowed_updates: [
      "message",
      "edited_message",
      "callback_query",
      "chat_member",
      "my_chat_member",
    ],
    drop_pending_updates: Boolean(dropPendingUpdates),
  });
}

function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    error: error instanceof Error ? error.message : "Internal server error.",
  });
}

module.exports = {
  parseBody,
  requireBearerSecret,
  requireTelegramOnboardingWebhookSecret,
  sendError,
  setupTelegramOnboardingWebhook,
  storeTelegramOnboardingUpdate,
  linkTelegramOnboardingProfile,
  processQueuedTelegramOnboardingEmails,
  _internal: {
    SESSION_STATES,
    compactText,
    createInviteActionLink,
    createMagicLoginLink,
    createTelegramLinkToken,
    callbackActionText,
    findProfileByEmail,
    findProfilesByTelegramUsername,
    handleOnboardingMessage,
    loginCodeRedirectUrl,
    linkExistingProfile,
    linkTelegramOnboardingProfile,
    normalizeEmail,
    normalizeTelegramUsername,
    obfuscateEmail,
    parseResendTimestamp,
    profileCompleteness,
    processQueuedMagicLoginEmails,
    resendSentEmailCountToday,
    sendMagicLoginEmail,
    sendMagicLoginEmailWithQuota,
    sentEmailCountToday,
    upsertContactFromTelegramUser,
    verifyTelegramLinkToken,
  },
};
