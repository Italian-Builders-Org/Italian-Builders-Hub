const {
  activateWaitlistBatch,
  activateWaitlistSignup,
  sendError,
} = require("../../../server/api/_admin-waitlist");

function queryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const action = queryValue(req.query.action);
  const id = queryValue(req.query.id) || req.body?.id;

  try {
    if (action === "activate") {
      res.status(200).json(await activateWaitlistSignup(req, id));
      return;
    }

    if (action === "activate-batch") {
      res.status(200).json(await activateWaitlistBatch(req, req.body?.ids));
      return;
    }

    res.status(404).json({ error: "Admin waitlist action not found." });
  } catch (error) {
    sendError(res, error);
  }
};
