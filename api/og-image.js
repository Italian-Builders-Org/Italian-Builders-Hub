const {
  verifySupabaseUser,
} = require("../server/api/_r2-storage");
const {
  importOpenGraphImage,
} = require("../server/api/_og-image-import");

function headerValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function parseBody(body) {
  if (typeof body === "string") return JSON.parse(body);
  if (body && Buffer.isBuffer(body)) return JSON.parse(body.toString("utf8"));
  if (body && typeof body === "object") return body;
  return {};
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const authorization = headerValue(req.headers.authorization);

  try {
    const user = await verifySupabaseUser(authorization);
    const body = parseBody(req.body);
    if (typeof body.url !== "string") throw new Error("URL is required.");
    const userId = String(body.userId || "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new Error("Valid user id is required.");
    if (user.id !== userId) {
      res.status(403).json({ error: "You can only import images for your own account." });
      return;
    }

    const result = await importOpenGraphImage({ pageUrl: body.url, userId });
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 400).json({
      error: error instanceof Error ? error.message : "Could not import Open Graph image.",
    });
  }
};
