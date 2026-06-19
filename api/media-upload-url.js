module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  res.status(410).json({
    error: "Direct presigned media uploads are retired. Use /api/media-upload.",
  });
};
