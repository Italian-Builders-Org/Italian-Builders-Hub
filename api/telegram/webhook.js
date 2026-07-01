const {
  parseBody,
  requireTelegramWebhookSecret,
  sendError,
  storeTelegramUpdate,
} = require("../../server/api/_telegram-digest");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    requireTelegramWebhookSecret(req);
    const update = parseBody(req.body);
    const result = await storeTelegramUpdate(update);
    res.status(200).json({ ok: true, ...result });
  } catch (error) {
    sendError(res, error);
  }
};
