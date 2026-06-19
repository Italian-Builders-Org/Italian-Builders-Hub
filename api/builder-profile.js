const fs = require("fs");
const path = require("path");
const {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  absoluteUrl,
  escapeHtml,
  fetchPublicProfile,
  normalizeUsername,
  profileDescription,
  profileTitle,
  siteOrigin,
} = require("./_profile-og");

let cachedIndexHtml;

function readIndexHtml() {
  if (cachedIndexHtml) return cachedIndexHtml;
  const candidates = [
    path.join(
      process.cwd(),
      "artifacts/italian-builders/dist/public/index.html",
    ),
    path.join(process.cwd(), "artifacts/italian-builders/index.html"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      cachedIndexHtml = fs.readFileSync(candidate, "utf8");
      return cachedIndexHtml;
    }
  }
  throw new Error("Could not find Italian Builders index.html.");
}

function removeManagedMetadata(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(
      /\s*<meta\s+(?:name|property)=["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'][^>]*>\s*/gi,
      "\n",
    );
}

function injectMetadata(html, metadata) {
  const tags = [
    `<title>${escapeHtml(metadata.title)}</title>`,
    `<meta name="description" content="${escapeHtml(metadata.description)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta property="og:title" content="${escapeHtml(metadata.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(metadata.description)}" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:url" content="${escapeHtml(metadata.url)}" />`,
    `<meta property="og:image" content="${escapeHtml(metadata.image)}" />`,
    `<meta property="og:image:secure_url" content="${escapeHtml(metadata.image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escapeHtml(metadata.imageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(metadata.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(metadata.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(metadata.image)}" />`,
    `<meta name="twitter:image:alt" content="${escapeHtml(metadata.imageAlt)}" />`,
  ].join("\n    ");

  return removeManagedMetadata(html).replace(
    "</head>",
    `    ${tags}\n  </head>`,
  );
}

module.exports = async function handler(req, res) {
  const origin = siteOrigin(req);
  const username = normalizeUsername(
    req.query?.username || req.url?.split("/builders/")[1]?.split(/[?#]/)[0],
  );
  const profile = username
    ? await fetchPublicProfile(username).catch(() => null)
    : null;
  const title = profile ? profileTitle(profile) : DEFAULT_TITLE;
  const description = profile
    ? profileDescription(profile)
    : DEFAULT_DESCRIPTION;
  const pagePath = username ? `/builders/${username}` : "/builders";
  const imagePath = username
    ? `/api/og-profile-image?username=${encodeURIComponent(username)}`
    : "/opengraph.jpg";
  const html = injectMetadata(readIndexHtml(), {
    title,
    description,
    url: absoluteUrl(pagePath, origin),
    image: absoluteUrl(imagePath, origin),
    imageAlt: profile
      ? `${profile.full_name} on Italian Builders`
      : "Italian Builders",
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    profile ? "s-maxage=300, stale-while-revalidate=86400" : "no-store",
  );
  res.status(200).send(html);
};
