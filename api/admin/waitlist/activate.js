const { activateWaitlistSignup, sendError } = require("../../_admin-waitlist");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    res.status(200).json(await activateWaitlistSignup(req, req.body?.id));
  } catch (error) {
    sendError(res, error);
  }
};
