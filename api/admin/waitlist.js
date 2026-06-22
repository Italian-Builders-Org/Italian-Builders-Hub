const {
  createDirectInvite,
  listWaitlist,
  sendError,
} = require("../_admin-waitlist");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    if (req.method === "POST") {
      res.status(201).json(await createDirectInvite(req, req.body));
      return;
    }

    res.status(200).json(await listWaitlist(req));
  } catch (error) {
    sendError(res, error);
  }
};
