const { listWaitlist, sendError } = require("../_admin-waitlist");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    res.status(200).json(await listWaitlist(req));
  } catch (error) {
    sendError(res, error);
  }
};
