const {
  parseBody,
  requireBearerSecret,
  sendError,
  setupTelegramWebhook,
} = require("../../server/api/_telegram-digest");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
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
  } catch (error) {
    sendError(res, error);
  }
};
