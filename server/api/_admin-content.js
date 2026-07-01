const { createClient } = require("@supabase/supabase-js");
const { safeFetch } = require("./_safe-fetch");

let cachedSupabaseAdmin;

function getSupabaseAdmin() {
  if (cachedSupabaseAdmin) return cachedSupabaseAdmin;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw Object.assign(
      new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required."),
      { statusCode: 500 },
    );
  }

  cachedSupabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedSupabaseAdmin;
}

function headerValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function bearerToken(req) {
  const authorization = headerValue(req.headers.authorization);
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

function parseBody(body) {
  if (typeof body === "string") return JSON.parse(body);
  if (body && Buffer.isBuffer(body)) return JSON.parse(body.toString("utf8"));
  if (body && typeof body === "object") return body;
  return {};
}

async function requireAdmin(req) {
  const token = bearerToken(req);
  if (!token) {
    throw Object.assign(new Error("Missing bearer token."), {
      statusCode: 401,
    });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    throw Object.assign(new Error("Invalid or expired session."), {
      statusCode: 401,
    });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .in("platform_role", ["admin", "owner"])
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) {
    throw Object.assign(new Error("Admin access required."), {
      statusCode: 403,
    });
  }

  return { user: data.user };
}

function compactText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function htmlDecode(value) {
  return compactText(value)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function metaContent(html, names) {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`,
        "i",
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
        "i",
      ),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return htmlDecode(match[1]);
    }
  }
  return null;
}

function pageTitle(html) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? htmlDecode(match[1]) : null;
}

function youtubeId(url) {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0];
  if (host === "youtube.com" || host === "m.youtube.com") {
    return url.searchParams.get("v");
  }
  return null;
}

function providerForUrl(url) {
  const host = url.hostname.replace(/^www\./, "");
  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtu.be"
  ) {
    return "YouTube";
  }
  if (host === "x.com" || host === "twitter.com") return "X";
  if (host === "linkedin.com") return "LinkedIn";
  return host;
}

async function previewContentUrl(req, rawBody) {
  await requireAdmin(req);
  const body = parseBody(rawBody);
  const rawUrl = compactText(body.url);

  if (!rawUrl) {
    throw Object.assign(new Error("URL is required."), { statusCode: 400 });
  }

  const response = await safeFetch(rawUrl, {
    timeoutMs: 8000,
    maxRedirects: 3,
    headers: {
      "user-agent":
        "ItalianBuildersBot/1.0 (+https://italianbuilders.co; content preview)",
      accept: "text/html,application/xhtml+xml",
    },
  });
  const finalUrl = new URL(response.url);
  const provider = providerForUrl(finalUrl);
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("text/html")) {
    return {
      url: finalUrl.toString(),
      provider,
      title: finalUrl.hostname,
      description: null,
      imageUrl: null,
    };
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const html = buffer.toString("utf8").slice(0, 2_000_000);
  const videoId = youtubeId(finalUrl);
  const imageUrl =
    metaContent(html, ["og:image", "twitter:image", "twitter:image:src"]) ||
    (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null);

  return {
    url: finalUrl.toString(),
    provider,
    title: metaContent(html, ["og:title", "twitter:title"]) || pageTitle(html),
    description: metaContent(html, [
      "og:description",
      "twitter:description",
      "description",
    ]),
    imageUrl,
  };
}

function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    error: error instanceof Error ? error.message : "Internal server error.",
  });
}

module.exports = {
  previewContentUrl,
  sendError,
};
