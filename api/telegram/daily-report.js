const {
  parseBody,
  requireBearerSecret,
  runDailyReport,
  sendError,
} = require("../../server/api/_telegram-digest");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
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
  } catch (error) {
    sendError(res, error);
  }
};
