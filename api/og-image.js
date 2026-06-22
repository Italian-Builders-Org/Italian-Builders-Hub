const {
  assertMediaInput,
  createObjectKey,
  uploadR2Object,
  verifySupabaseUser,
} = require("../server/api/_r2-storage");
const {
  safeFetch,
  validatePublicHttpUrl,
} = require("../server/api/_safe-fetch");

const MAX_HTML_BYTES = 750_000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function headerValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function parseBody(body) {
  if (typeof body === "string") return JSON.parse(body);
  if (body && Buffer.isBuffer(body)) return JSON.parse(body.toString("utf8"));
  if (body && typeof body === "object") return body;
  return {};
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function firstMetaContent(html, names) {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["'][^>]*>`, "i"),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeHtml(match[1]);
    }
  }
  return null;
}

function fileExtension(contentType, imageUrl) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  const fromPath = imageUrl.pathname.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return fromPath && fromPath.length <= 8 ? fromPath : "jpg";
}

async function readLimited(response, limit) {
  const reader = response.body?.getReader();
  if (!reader) {
    if (response.body?.[Symbol.asyncIterator]) {
      const chunks = [];
      let total = 0;
      for await (const chunk of response.body) {
        const bytes = Buffer.from(chunk);
        total += bytes.byteLength;
        if (total > limit) throw new Error("Response is too large.");
        chunks.push(bytes);
      }
      return new Uint8Array(Buffer.concat(chunks, total));
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > limit) throw new Error("Response is too large.");
    return bytes;
  }

  const chunks = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > limit) throw new Error("Response is too large.");
      chunks.push(value);
    }
  }

  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
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
    const pageUrl = await validatePublicHttpUrl(body.url.trim());
    const userId = String(body.userId || "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new Error("Valid user id is required.");
    if (user.id !== userId) {
      res.status(403).json({ error: "You can only import images for your own account." });
      return;
    }

    const pageResponse = await safeFetch(pageUrl, {
      headers: {
        "user-agent": "ItalianBuildersBot/1.0 (+https://italian-builders.vercel.app)",
        accept: "text/html,application/xhtml+xml",
      },
    });

    if (!pageResponse.ok) {
      res.status(422).json({ error: `Could not fetch project page (${pageResponse.status}).` });
      return;
    }

    const htmlBytes = await readLimited(pageResponse, MAX_HTML_BYTES);
    const html = new TextDecoder().decode(htmlBytes);
    const ogImage = firstMetaContent(html, ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"]);
    if (!ogImage) {
      res.status(404).json({ error: "No Open Graph image found for that URL." });
      return;
    }

    const imageUrl = await validatePublicHttpUrl(
      ogImage,
      pageResponse.url || pageUrl,
    );

    const imageResponse = await safeFetch(imageUrl, {
      headers: {
        "user-agent": "ItalianBuildersBot/1.0 (+https://italian-builders.vercel.app)",
        accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,*/*",
      },
    });

    if (!imageResponse.ok) {
      res.status(422).json({ error: `Could not fetch Open Graph image (${imageResponse.status}).` });
      return;
    }

    const contentType = imageResponse.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(contentType)) {
      res.status(415).json({ error: "Open Graph media is not a supported image type." });
      return;
    }

    const imageBytes = await readLimited(imageResponse, MAX_IMAGE_BYTES);
    const extension = fileExtension(contentType, imageUrl);
    assertMediaInput({
      folder: "projects",
      contentType,
      size: imageBytes.byteLength,
    });

    const objectPath = createObjectKey({
      userId,
      folder: "projects",
      fileName: `og.${extension}`,
      contentType,
      prefix: "og",
    });
    const publicUrl = await uploadR2Object({
      objectKey: objectPath,
      body: imageBytes,
      contentType,
    });

    res.status(200).json({ imageUrl: publicUrl, sourceImageUrl: imageUrl.toString() });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      error: error instanceof Error ? error.message : "Could not import Open Graph image.",
    });
  }
};
