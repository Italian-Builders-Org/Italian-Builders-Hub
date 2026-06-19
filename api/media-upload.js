const {
  MAX_MEDIA_BYTES,
  assertMediaInput,
  createObjectKey,
  uploadR2Object,
  verifySupabaseUser,
} = require("./_r2-storage");

function headerValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function requestValue(req, key) {
  const queryValue = req.query?.[key];
  if (queryValue) return headerValue(queryValue);
  return headerValue(req.headers[`x-media-${key}`]);
}

async function readBody(req, limit) {
  if (Buffer.isBuffer(req.body)) {
    if (req.body.byteLength > limit) {
      throw new Error("Files must be 10 MB or smaller.");
    }
    return req.body;
  }

  if (typeof req.body === "string") {
    const buffer = Buffer.from(req.body);
    if (buffer.byteLength > limit) {
      throw new Error("Files must be 10 MB or smaller.");
    }
    return buffer;
  }

  if (req.body && typeof req.body === "object") {
    throw new Error("Upload body must be raw file bytes.");
  }

  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.byteLength;
    if (total > limit) throw new Error("Files must be 10 MB or smaller.");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks, total);
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
    const folder = String(requestValue(req, "folder") || "");
    const fileName = String(requestValue(req, "file-name") || "upload");
    const contentType = String(
      headerValue(req.headers["content-type"]) || "",
    ).split(";")[0];
    const contentLength = Number(
      headerValue(req.headers["content-length"]) || 0,
    );

    if (Number.isFinite(contentLength) && contentLength > MAX_MEDIA_BYTES) {
      throw new Error("Files must be 10 MB or smaller.");
    }

    const body = await readBody(req, MAX_MEDIA_BYTES);
    assertMediaInput({ folder, contentType, size: body.byteLength });

    const objectKey = createObjectKey({
      userId: user.id,
      folder,
      fileName,
      contentType,
    });
    const publicUrl = await uploadR2Object({ objectKey, body, contentType });

    res.status(200).json({ publicUrl, objectKey });
  } catch (error) {
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({
      error: error instanceof Error ? error.message : "Could not upload media.",
    });
  }
};
