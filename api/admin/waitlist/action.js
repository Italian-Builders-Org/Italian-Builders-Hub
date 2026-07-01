const {
  activateWaitlistBatch,
  activateWaitlistSignup,
  sendError,
} = require("../../../server/api/_admin-waitlist");
const { previewContentUrl } = require("../../../server/api/_admin-content");
const {
  parseBody,
  requireBearerSecret,
  requireTelegramWebhookSecret,
  runDailyReport,
  setupTelegramWebhook,
  storeTelegramUpdate,
} = require("../../../server/api/_telegram-digest");

function queryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const action = queryValue(req.query.action);
  const id = queryValue(req.query.id) || req.body?.id;

  try {
    if (action === "telegram-webhook") {
      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed." });
        return;
      }
      requireTelegramWebhookSecret(req);
      const update = parseBody(req.body);
      const result = await storeTelegramUpdate(update);
      res.status(200).json({ ok: true, ...result });
      return;
    }

    if (action === "telegram-daily-report") {
      if (req.method !== "GET" && req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed." });
        return;
      }
      requireBearerSecret(
        req,
        ["TELEGRAM_DIGEST_CRON_SECRET", "CRON_SECRET"],
        "TELEGRAM_DIGEST_CRON_SECRET or CRON_SECRET",
      );
      const body = req.method === "POST" ? parseBody(req.body) : {};
      const result = await runDailyReport({
        date: req.query?.date || body.date,
        force:
          req.query?.force === "1" ||
          req.query?.force === "true" ||
          body.force === true,
      });
      res.status(200).json({ ok: true, ...result });
      return;
    }

    if (action === "telegram-setup-webhook") {
      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed." });
        return;
      }
      requireBearerSecret(
        req,
        ["TELEGRAM_SETUP_SECRET", "TELEGRAM_DIGEST_CRON_SECRET", "CRON_SECRET"],
        "TELEGRAM_SETUP_SECRET, TELEGRAM_DIGEST_CRON_SECRET, or CRON_SECRET",
      );
      const body = parseBody(req.body);
      const result = await setupTelegramWebhook({
        dropPendingUpdates: body.dropPendingUpdates === true,
      });
      res.status(200).json({ ok: true, result });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed." });
      return;
    }

    if (action === "activate") {
      res.status(200).json(await activateWaitlistSignup(req, id));
      return;
    }

    if (action === "activate-batch") {
      res.status(200).json(await activateWaitlistBatch(req, req.body?.ids));
      return;
    }

    if (action === "content-preview") {
      res.status(200).json(await previewContentUrl(req, req.body));
      return;
    }

    res.status(404).json({ error: "Admin waitlist action not found." });
  } catch (error) {
    sendError(res, error);
  }
};
