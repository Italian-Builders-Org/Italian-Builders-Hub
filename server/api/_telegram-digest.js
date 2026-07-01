const { createClient } = require("@supabase/supabase-js");

const DEFAULT_TIME_ZONE = "Europe/Rome";
const DEFAULT_REPORT_LANGUAGE = "it";
const DEFAULT_MODEL = "qwen/qwen3-next-80b-a3b-instruct:free";
const PROMPT_VERSION = "telegram-community-daily-digest-v2";
const MAX_TELEGRAM_MESSAGE_LENGTH = 3900;

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
  if (typeof body === "string") return body ? JSON.parse(body) : {};
  if (body && Buffer.isBuffer(body)) return JSON.parse(body.toString("utf8"));
  if (body && typeof body === "object") return body;
  return {};
}

function compactText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractUrls(value) {
  const matches = String(value || "").match(/https?:\/\/[^\s<>"')]+/gi) || [];
  return Array.from(
    new Set(matches.map((url) => url.replace(/[.,;:!?]+$/, ""))),
  );
}

function allowedPrivateUserIds() {
  return String(process.env.TELEGRAM_ALLOWED_PRIVATE_USER_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function privateMessageFrom(update) {
  const message = update?.message || update?.edited_message;
  if (message?.chat?.type !== "private") return null;
  return message;
}

function isAllowedPrivateSender(message) {
  const allowed = allowedPrivateUserIds();
  if (!allowed.length) return false;
  return allowed.includes(String(message?.from?.id || message?.chat?.id || ""));
}

function requireBearerSecret(req, envNames, label) {
  const token = bearerToken(req);
  const expected = envNames.map((name) => process.env[name]).find(Boolean);

  if (!expected) {
    throw Object.assign(new Error(`${label} is not configured.`), {
      statusCode: 500,
    });
  }
  if (!token || token !== expected) {
    throw Object.assign(new Error("Unauthorized."), { statusCode: 401 });
  }
}

function requireTelegramWebhookSecret(req) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) {
    throw Object.assign(new Error("TELEGRAM_WEBHOOK_SECRET is required."), {
      statusCode: 500,
    });
  }

  const actual = headerValue(req.headers["x-telegram-bot-api-secret-token"]);
  if (actual !== expected) {
    throw Object.assign(new Error("Invalid Telegram webhook secret."), {
      statusCode: 401,
    });
  }
}

function telegramToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw Object.assign(new Error("TELEGRAM_BOT_TOKEN is required."), {
      statusCode: 500,
    });
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

function appBaseUrl() {
  const value = compactText(
    process.env.APP_BASE_URL || process.env.VITE_APP_BASE_URL,
  );
  if (!value) {
    throw Object.assign(new Error("APP_BASE_URL is required."), {
      statusCode: 500,
    });
  }
  return value.replace(/\/+$/, "");
}

function extractMessage(update) {
  const updateType = [
    "message",
    "edited_message",
    "channel_post",
    "edited_channel_post",
  ].find((key) => update?.[key]);
  const message = updateType ? update[updateType] : null;
  if (!message?.chat?.id || !message.message_id) return null;

  const text = compactText(message.text || message.caption);
  if (!text) return null;
  if (text.startsWith("/")) return null;
  if (message.chat.type === "private") return null;

  return {
    updateType,
    chat: message.chat,
    messageId: message.message_id,
    messageThreadId: message.message_thread_id || null,
    sentAt: new Date(Number(message.date || 0) * 1000).toISOString(),
    text,
  };
}

async function storeTelegramUpdate(update) {
  const privateMessage = privateMessageFrom(update);
  if (privateMessage) {
    if (!isAllowedPrivateSender(privateMessage)) {
      return { stored: false, reason: "Private message ignored." };
    }

    return {
      stored: false,
      reason: "Authorized private message ignored.",
      privateChatId: String(privateMessage.chat.id),
    };
  }

  const message = extractMessage(update);
  if (!message) return { stored: false, reason: "No text message." };

  const supabaseAdmin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const chatTitle =
    compactText(message.chat.title) ||
    compactText(message.chat.username) ||
    String(message.chat.id);

  const { error: chatError } = await supabaseAdmin
    .from("telegram_digest_chats")
    .upsert(
      {
        chat_id: message.chat.id,
        chat_title: chatTitle,
        chat_type: message.chat.type || "unknown",
        first_seen_at: now,
        last_seen_at: now,
      },
      { onConflict: "chat_id" },
    );
  if (chatError) throw chatError;

  const { error: messageError } = await supabaseAdmin
    .from("telegram_digest_messages")
    .upsert(
      {
        update_id: update.update_id,
        update_type: message.updateType,
        chat_id: message.chat.id,
        message_id: message.messageId,
        message_thread_id: message.messageThreadId,
        sent_at: message.sentAt,
        text: message.text,
        text_urls: extractUrls(message.text),
        text_char_count: message.text.length,
      },
      { onConflict: "chat_id,message_id" },
    );
  if (messageError) throw messageError;

  return {
    stored: true,
    chatId: String(message.chat.id),
    messageId: message.messageId,
  };
}

function localDateString(date, timeZone = DEFAULT_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function defaultReportDate() {
  return localDateString(new Date(Date.now() - 12 * 60 * 60 * 1000));
}

function validateDate(value) {
  const text = compactText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw Object.assign(new Error("date must be YYYY-MM-DD."), {
      statusCode: 400,
    });
  }
  return text;
}

function formatDigestInput(messages) {
  return messages
    .map((message, index) => {
      const time = new Intl.DateTimeFormat("it-IT", {
        timeZone: DEFAULT_TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(message.sent_at));
      const urls =
        message.text_urls?.length > 0
          ? `\n   Link trovati: ${message.text_urls.join(", ")}`
          : "";
      return `${index + 1}. [${time}] ${message.chat_title}: ${message.text}${urls}`;
    })
    .join("\n");
}

function digestInstructions({ reportDate, messageCount, activeChatCount }) {
  const language = DEFAULT_REPORT_LANGUAGE;

  return `You write private daily intelligence briefings for the Italian Builders community.

Rules:
- Write in ${language === "it" ? "Italian" : language}.
- Summarize the previous day across all Telegram channels that had meaningful activity.
- Keep channel-specific details visible: each channel with news should have its own short section.
- Do not tag people, mention usernames, or attribute opinions to named members.
- Do not include private personal details.
- Capture the vibe of the conversation, the main topics, concrete links/resources, books, tweets/X posts, articles, tools, demos, repositories, videos, asks, launches, and decisions.
- If a URL is present, classify it when possible from the message context: tweet, book, article, tool, repo, video, event, product, or other.
- Include one "Fatto interessante" connected to the main topic. If messages do not support a factual insight, use a practical observation instead of inventing facts.
- Be specific and useful for someone who missed the day.
- Return JSON only. No markdown fences.

JSON shape:
{
  "title": "string",
  "date": "YYYY-MM-DD",
  "vibe": "string",
  "executiveTldr": "string",
  "mainTopics": ["string"],
  "channelDigests": [
    {
      "channel": "string",
      "topic": "string",
      "summary": "string",
      "highlights": ["string"],
      "resources": [{"title": "string", "url": "string", "type": "tweet|book|article|tool|repo|video|event|product|other", "whyItMatters": "string"}]
    }
  ],
  "crossChannelSignals": ["string"],
  "interestingFact": "string",
  "openQuestions": ["string"],
  "telegramText": "string"
}

The "telegramText" field must be a polished plain-text version under 3000 characters.

Community context:
Italian founders, builders, developers, designers, operators, AI, products, startups, open-source, and community projects.
Report date: ${reportDate}
Channels with activity: ${activeChatCount}
Messages: ${messageCount}`;
}

function buildDigestPrompt({ messages, reportDate, activeChatCount }) {
  return [
    {
      role: "system",
      content: digestInstructions({
        reportDate,
        messageCount: messages.length,
        activeChatCount,
      }),
    },
    {
      role: "user",
      content: `Create the previous-day digest from these Telegram messages.\n\n${formatDigestInput(messages)}`,
    },
  ];
}

function responseText(payload) {
  return compactText(payload?.choices?.[0]?.message?.content);
}

function parseDigestJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeDigestText(payload, fallbackText) {
  const telegramText = compactText(payload?.telegramText);
  if (telegramText) return telegramText;
  return compactText(fallbackText);
}

async function createOpenRouterDigest({
  messages,
  reportDate,
  activeChatCount,
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("OPENROUTER_API_KEY is required."), {
      statusCode: 500,
    });
  }

  const model = process.env.TELEGRAM_DIGEST_OPENROUTER_MODEL || DEFAULT_MODEL;
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        "http-referer": appBaseUrl(),
        "x-openrouter-title": "Italian Builders Telegram Digest",
      },
      body: JSON.stringify({
        model,
        messages: buildDigestPrompt({ messages, reportDate, activeChatCount }),
        max_tokens: 1800,
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    },
  );
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.error?.message || "OpenRouter digest request failed.",
    );
  }

  const text = responseText(payload);
  if (!text) throw new Error("OpenRouter returned an empty digest.");
  const summary = parseDigestJson(text);

  return {
    text: normalizeDigestText(summary, text),
    model,
    summary: summary || { telegramText: text },
    rawResponse: payload,
  };
}

function splitTelegramText(text) {
  const chunks = [];
  let remaining = text;

  while (remaining.length > MAX_TELEGRAM_MESSAGE_LENGTH) {
    const slice = remaining.slice(0, MAX_TELEGRAM_MESSAGE_LENGTH);
    const breakAt = Math.max(
      slice.lastIndexOf("\n\n"),
      slice.lastIndexOf("\n"),
    );
    const cut = breakAt > 1000 ? breakAt : MAX_TELEGRAM_MESSAGE_LENGTH;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

async function sendDigestToTelegram(chatId, text) {
  let firstMessageId = null;
  for (const chunk of splitTelegramText(text)) {
    const result = await telegramRequest("sendMessage", {
      chat_id: String(chatId),
      text: chunk,
      disable_web_page_preview: true,
    });
    if (!firstMessageId) firstMessageId = result.message_id;
  }
  return firstMessageId;
}

async function enabledChats(supabaseAdmin) {
  const { data, error } = await supabaseAdmin
    .from("telegram_digest_chats")
    .select(
      "chat_id, chat_title, chat_type, summary_context, is_enabled, report_language, report_time_zone",
    )
    .eq("is_enabled", true)
    .order("chat_title", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function existingReport(supabaseAdmin, reportDate) {
  const { data, error } = await supabaseAdmin
    .from("telegram_daily_reports")
    .select("id, sent_message_id")
    .eq("report_scope", "community")
    .eq("report_date", reportDate)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function dailyMessages(supabaseAdmin, chatId, reportDate) {
  const limit = Number(process.env.TELEGRAM_DIGEST_MAX_MESSAGES || 500);
  const { data, error } = await supabaseAdmin
    .from("telegram_digest_messages")
    .select("message_id, sent_at, text, text_urls")
    .eq("chat_id", chatId)
    .eq("message_local_date", reportDate)
    .order("sent_at", { ascending: true })
    .limit(Number.isFinite(limit) && limit > 0 ? limit : 500);
  if (error) throw error;
  return data || [];
}

async function saveReport({
  supabaseAdmin,
  reportDate,
  digest,
  messageCount,
  activeChatCount,
  sentMessageId,
}) {
  const { error } = await supabaseAdmin.from("telegram_daily_reports").upsert(
    {
      report_scope: "community",
      report_date: reportDate,
      message_count: messageCount,
      active_chat_count: activeChatCount,
      report_text: digest.text,
      summary_json: digest.summary,
      model: digest.model,
      prompt_version: PROMPT_VERSION,
      raw_response: digest.rawResponse,
      sent_message_id: sentMessageId,
      generated_at: new Date().toISOString(),
    },
    { onConflict: "report_scope,report_date" },
  );
  if (error) throw error;
}

async function runDailyReport({ date, force = false }) {
  const supabaseAdmin = getSupabaseAdmin();
  const reportDate = validateDate(date || defaultReportDate());
  const chats = await enabledChats(supabaseAdmin);
  const prior = await existingReport(supabaseAdmin, reportDate);
  if (prior?.sent_message_id && !force) {
    return {
      reportDate,
      results: [{ status: "skipped_existing_report" }],
    };
  }

  const results = [];
  const allMessages = [];

  for (const chat of chats) {
    const messages = await dailyMessages(
      supabaseAdmin,
      chat.chat_id,
      reportDate,
    );
    if (!messages.length) {
      results.push({
        chatId: String(chat.chat_id),
        chatTitle: chat.chat_title,
        status: "skipped_no_messages",
      });
      continue;
    }

    for (const message of messages) {
      allMessages.push({
        ...message,
        chat_id: chat.chat_id,
        chat_title: chat.chat_title,
        summary_context: chat.summary_context,
      });
    }

    results.push({
      chatId: String(chat.chat_id),
      chatTitle: chat.chat_title,
      status: "included",
      messageCount: messages.length,
    });
  }

  if (!allMessages.length) return { reportDate, results };

  const digest = await createOpenRouterDigest({
    messages: allMessages,
    reportDate,
    activeChatCount: results.filter((item) => item.status === "included")
      .length,
  });
  const ownerChatId = process.env.TELEGRAM_DIGEST_OWNER_CHAT_ID;
  const sentMessageId = ownerChatId
    ? await sendDigestToTelegram(ownerChatId, digest.text)
    : null;

  await saveReport({
    supabaseAdmin,
    reportDate,
    digest,
    messageCount: allMessages.length,
    activeChatCount: results.filter((item) => item.status === "included")
      .length,
    sentMessageId,
  });

  results.push({
    status: sentMessageId
      ? "sent_private_digest"
      : "saved_without_private_send",
    messageCount: allMessages.length,
    sentMessageId,
  });

  return { reportDate, results };
}

async function setupTelegramWebhook({ dropPendingUpdates = false } = {}) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    throw Object.assign(new Error("TELEGRAM_WEBHOOK_SECRET is required."), {
      statusCode: 500,
    });
  }

  return telegramRequest("setWebhook", {
    url: `${appBaseUrl()}/api/telegram/webhook`,
    secret_token: secret,
    allowed_updates: [
      "message",
      "edited_message",
      "channel_post",
      "edited_channel_post",
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
  requireTelegramWebhookSecret,
  runDailyReport,
  sendError,
  setupTelegramWebhook,
  storeTelegramUpdate,
};
