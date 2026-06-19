const {
  assertMediaInput,
  createObjectKey,
  createPresignedPutUrl,
  verifySupabaseUser,
} = require("./_r2-storage");

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

  try {
    const authorization = headerValue(req.headers.authorization);
    const user = await verifySupabaseUser(authorization);
    const body = parseBody(req.body);
    const folder = String(body.folder || "");
    const fileName = String(body.fileName || "");
    const contentType = String(body.contentType || "");
    const size = Number(body.size);

    assertMediaInput({ folder, contentType, size });

    const objectKey = createObjectKey({
      userId: user.id,
      folder,
      fileName,
      contentType,
    });

    res.status(200).json(createPresignedPutUrl({ objectKey, contentType }));
  } catch (error) {
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({
      error: error instanceof Error ? error.message : "Could not prepare media upload.",
    });
  }
};
