const {
  parseBody,
  requireBearerSecret,
  requireTelegramWebhookSecret,
  runDailyReport,
  sendError,
  setupTelegramWebhook,
  storeTelegramUpdate,
} = require("../server/api/_telegram-digest");

function actionForRequest(req) {
  return String(req.query?.action || "").trim();
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const action = actionForRequest(req);

  try {
    if (action === "webhook") {
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

    if (action === "daily-report") {
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

    if (action === "setup-webhook") {
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

    res.status(404).json({ error: "Unknown Telegram action." });
  } catch (error) {
    sendError(res, error);
  }
};
