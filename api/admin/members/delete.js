const { deleteMember, sendError } = require("../../_admin-members");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    res.status(200).json(await deleteMember(req, req.body));
  } catch (error) {
    sendError(res, error);
  }
};
