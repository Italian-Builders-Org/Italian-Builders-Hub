function headerValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanBaseUrl(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  let url;
  try {
    url = new URL(trimmed);
  } catch {
    throw Object.assign(new Error("APP_BASE_URL must be an http or https URL."), {
      statusCode: 500,
    });
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw Object.assign(new Error("APP_BASE_URL must be an http or https URL."), {
      statusCode: 500,
    });
  }
  return url.toString().replace(/\/+$/, "");
}

function isProduction(env) {
  return env.NODE_ENV === "production" || env.VERCEL_ENV === "production";
}

function appBaseUrl(req, env = process.env) {
  const configured = cleanBaseUrl(env.APP_BASE_URL);
  if (configured) return configured;

  if (isProduction(env)) {
    throw Object.assign(new Error("APP_BASE_URL is required in production."), {
      statusCode: 500,
    });
  }

  const headers = req?.headers || {};
  const host = headerValue(headers["x-forwarded-host"]) || headers.host;
  if (!host) {
    throw Object.assign(new Error("Request host is required."), {
      statusCode: 500,
    });
  }

  const protocol = headerValue(headers["x-forwarded-proto"]) || "https";
  return `${protocol}://${host}`.replace(/\/+$/, "");
}

module.exports = {
  appBaseUrl,
};
