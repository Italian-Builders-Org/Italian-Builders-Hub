const crypto = require("crypto");

const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
const SIGNED_UPLOAD_TTL_SECONDS = 5 * 60;
const CACHE_CONTROL = "public, max-age=31536000, immutable";

const allowedMediaTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);

const allowedFolders = new Set(["profile", "projects", "community-projects"]);

function rfc3986(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function pathForObject(bucket, objectKey) {
  return `/${bucket}/${objectKey.split("/").map(rfc3986).join("/")}`;
}

function hmac(key, data, encoding) {
  return crypto.createHmac("sha256", key).update(data).digest(encoding);
}

function sha256(data, encoding = "hex") {
  return crypto.createHash("sha256").update(data).digest(encoding);
}

function amzDate(date = new Date()) {
  const value = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { long: value, short: value.slice(0, 8) };
}

function signingKey(secretAccessKey, dateStamp) {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, "auto");
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
}

function canonicalQuery(params) {
  return [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${rfc3986(key)}=${rfc3986(value)}`)
    .join("&");
}

function requireR2Config() {
  const config = {
    accountId: process.env.R2_ACCOUNT_ID,
    bucket: process.env.R2_BUCKET_NAME,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    endpoint: process.env.R2_ENDPOINT,
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL || process.env.VITE_R2_PUBLIC_BASE_URL,
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`R2 is not configured. Missing: ${missing.join(", ")}.`);
  }

  return {
    ...config,
    endpoint: config.endpoint.replace(/\/$/, ""),
    publicBaseUrl: config.publicBaseUrl.replace(/\/$/, ""),
  };
}

function publicUrlForObject(config, objectKey) {
  return `${config.publicBaseUrl}/${objectKey.split("/").map(rfc3986).join("/")}`;
}

function safeExtension(fileName, contentType) {
  const fromName = String(fileName || "")
    .split(".")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (fromName) return fromName.slice(0, 8);
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/gif") return "gif";
  if (contentType === "video/mp4") return "mp4";
  if (contentType === "video/webm") return "webm";
  return "bin";
}

function assertMediaInput({ folder, contentType, size }) {
  if (!allowedFolders.has(folder)) {
    throw new Error("Invalid media folder.");
  }

  if (!allowedMediaTypes.has(contentType)) {
    throw new Error("Use a JPG, PNG, WebP, GIF, MP4, or WebM file.");
  }

  if (!Number.isFinite(size) || size <= 0) {
    throw new Error("File size is required.");
  }

  if (size > MAX_MEDIA_BYTES) {
    throw new Error("Files must be 10 MB or smaller.");
  }
}

function createObjectKey({ userId, folder, fileName, contentType, prefix = "" }) {
  const extension = safeExtension(fileName, contentType);
  const id = crypto.randomUUID();
  const filename = prefix ? `${prefix}-${id}.${extension}` : `${id}.${extension}`;
  return `${userId}/${folder}/${filename}`;
}

function signedHeadersString(headers) {
  return Object.keys(headers)
    .map((key) => key.toLowerCase())
    .sort()
    .join(";");
}

function canonicalHeadersString(headers) {
  return Object.entries(headers)
    .map(([key, value]) => [key.toLowerCase(), String(value).trim().replace(/\s+/g, " ")])
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}\n`)
    .join("");
}

function signRequest({ method, path, query = "", headers, payloadHash, config, date = amzDate() }) {
  const { long, short } = date;
  const signedHeaders = signedHeadersString(headers);
  const canonicalRequest = [
    method,
    path,
    query,
    canonicalHeadersString(headers),
    signedHeaders,
    payloadHash,
  ].join("\n");
  const scope = `${short}/auto/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", long, scope, sha256(canonicalRequest)].join("\n");
  const signature = hmac(signingKey(config.secretAccessKey, short), stringToSign, "hex");

  return {
    authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    amzDate: long,
    signedHeaders,
    signature,
    scope,
  };
}

function createPresignedPutUrl({ objectKey, contentType }) {
  const config = requireR2Config();
  const endpointUrl = new URL(config.endpoint);
  const path = pathForObject(config.bucket, objectKey);
  const headers = {
    "cache-control": CACHE_CONTROL,
    "content-type": contentType,
    host: endpointUrl.host,
  };
  const { long, short } = amzDate();
  const scope = `${short}/auto/s3/aws4_request`;
  const signedHeaders = signedHeadersString(headers);
  const params = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${config.accessKeyId}/${scope}`,
    "X-Amz-Date": long,
    "X-Amz-Expires": String(SIGNED_UPLOAD_TTL_SECONDS),
    "X-Amz-SignedHeaders": signedHeaders,
  });
  const query = canonicalQuery(params);
  const canonicalRequest = [
    "PUT",
    path,
    query,
    canonicalHeadersString(headers),
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", long, scope, sha256(canonicalRequest)].join("\n");
  const signature = hmac(signingKey(config.secretAccessKey, short), stringToSign, "hex");
  params.set("X-Amz-Signature", signature);

  return {
    uploadUrl: `${config.endpoint}${path}?${canonicalQuery(params)}`,
    publicUrl: publicUrlForObject(config, objectKey),
    objectKey,
    headers: {
      "cache-control": CACHE_CONTROL,
      "content-type": contentType,
    },
    expiresIn: SIGNED_UPLOAD_TTL_SECONDS,
  };
}

async function uploadR2Object({ objectKey, body, contentType }) {
  const config = requireR2Config();
  const endpointUrl = new URL(config.endpoint);
  const path = pathForObject(config.bucket, objectKey);
  const payload = Buffer.from(body);
  const payloadHash = sha256(payload);
  const date = amzDate();
  const headers = {
    "cache-control": CACHE_CONTROL,
    "content-type": contentType,
    host: endpointUrl.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": date.long,
  };
  const signature = signRequest({
    method: "PUT",
    path,
    headers,
    payloadHash,
    config,
    date,
  });
  headers.authorization = signature.authorization;
  headers["x-amz-date"] = signature.amzDate;

  const response = await fetch(`${config.endpoint}${path}`, {
    method: "PUT",
    headers,
    body: payload,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `R2 upload failed with status ${response.status}.`);
  }

  return publicUrlForObject(config, objectKey);
}

async function verifySupabaseUser(authorization) {
  if (!authorization?.startsWith("Bearer ")) {
    const error = new Error("Authentication required.");
    error.statusCode = 401;
    throw error;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Authentication is not configured.");
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
    headers: {
      apikey: supabaseKey,
      authorization,
    },
  });

  if (!response.ok) {
    const error = new Error("Authentication required.");
    error.statusCode = 401;
    throw error;
  }

  return response.json();
}

module.exports = {
  CACHE_CONTROL,
  MAX_MEDIA_BYTES,
  allowedMediaTypes,
  assertMediaInput,
  createObjectKey,
  createPresignedPutUrl,
  safeExtension,
  uploadR2Object,
  verifySupabaseUser,
};
