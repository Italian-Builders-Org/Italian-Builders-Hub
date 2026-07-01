const {
  assertMediaInput,
  createObjectKey,
  uploadR2Object,
} = require("./_r2-storage");
const {
  safeFetch,
  validatePublicHttpUrl,
} = require("./_safe-fetch");

const MAX_HTML_BYTES = 750_000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function firstMetaContent(html, names) {
  return metaContents(html, names)[0] || null;
}

function metaContents(html, names) {
  const values = [];
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
      if (match?.[1]) values.push(decodeHtml(match[1]));
    }
  }
  return [...new Set(values)];
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
  const reader = response.body?.getReader?.();
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

async function importOpenGraphImage({ pageUrl, userId }) {
  const publicPageUrl = await validatePublicHttpUrl(String(pageUrl || "").trim());

  const pageResponse = await safeFetch(publicPageUrl, {
    headers: {
      "user-agent": "ItalianBuildersBot/1.0 (+https://italianbuilders.co)",
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!pageResponse.ok) {
    const error = new Error(`Could not fetch project page (${pageResponse.status}).`);
    error.statusCode = 422;
    throw error;
  }

  const htmlBytes = await readLimited(pageResponse, MAX_HTML_BYTES);
  const html = new TextDecoder().decode(htmlBytes);
  const ogImages = metaContents(html, [
    "og:image:secure_url",
    "og:image",
    "twitter:image",
    "twitter:image:src",
  ]);
  if (ogImages.length === 0) {
    const error = new Error("No Open Graph image found for that URL.");
    error.statusCode = 404;
    throw error;
  }

  let lastError;
  for (const ogImage of ogImages) {
    try {
      return await importOpenGraphImageCandidate({
        ogImage,
        pageResponseUrl: pageResponse.url || publicPageUrl,
        userId,
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Could not import Open Graph image.");
}

async function importOpenGraphImageCandidate({
  ogImage,
  pageResponseUrl,
  userId,
}) {
  const imageUrl = await validatePublicHttpUrl(ogImage, pageResponseUrl);

  const imageResponse = await safeFetch(imageUrl, {
    headers: {
      "user-agent": "ItalianBuildersBot/1.0 (+https://italianbuilders.co)",
      accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,*/*",
    },
  });

  if (!imageResponse.ok) {
    const error = new Error(`Could not fetch Open Graph image (${imageResponse.status}).`);
    error.statusCode = 422;
    throw error;
  }

  const contentType = imageResponse.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(contentType)) {
    const error = new Error("Open Graph media is not a supported image type.");
    error.statusCode = 415;
    throw error;
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

  return { imageUrl: publicUrl, sourceImageUrl: imageUrl.toString() };
}

module.exports = {
  firstMetaContent,
  importOpenGraphImage,
  metaContents,
  readLimited,
};
