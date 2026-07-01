const {
  previewContentUrl,
  sendError,
} = require("../../../server/api/_admin-content");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    res.status(200).json(await previewContentUrl(req, req.body));
  } catch (error) {
    sendError(res, error);
  }
};
