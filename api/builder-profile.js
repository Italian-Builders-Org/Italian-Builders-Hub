const fs = require("fs");
const path = require("path");
const {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  absoluteUrl,
  escapeHtml,
  fetchPublicProfile,
  jsonLdScriptContent,
  normalizeUsername,
  profileDescription,
  profileTitle,
  siteOrigin,
} = require("../server/api/_profile-og");

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
    )
    .replace(/\s*<link\s+rel=["']canonical["'][^>]*>\s*/gi, "\n")
    .replace(
      /\s*<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi,
      "\n",
    );
}

function injectMetadata(html, metadata) {
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${metadata.origin}/#organization`,
      name: "Italian Builders",
      url: `${metadata.origin}/`,
      logo: absoluteUrl("/logo-vector.svg", metadata.origin),
      email: "info@italianbuilders.co",
      sameAs: [
        "https://x.com/italianbldrs",
        "https://www.linkedin.com/company/italian-builders-community/posts/?feedView=all",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "@id": `${metadata.url}#webpage`,
      url: metadata.url,
      name: metadata.title,
      description: metadata.description,
      mainEntity: metadata.profile
        ? {
            "@type": "Person",
            "@id": `${metadata.url}#person`,
            name: metadata.profile.full_name,
            alternateName: metadata.profile.username,
            description: metadata.description,
            image: absoluteUrl(metadata.profile.avatar_url, metadata.origin),
            jobTitle:
              metadata.profile.headline || metadata.profile.role || undefined,
            knowsAbout: Array.isArray(metadata.profile.skills)
              ? metadata.profile.skills
              : undefined,
            address:
              metadata.profile.city || metadata.profile.country
                ? {
                    "@type": "PostalAddress",
                    addressLocality: metadata.profile.city || undefined,
                    addressCountry: metadata.profile.country || undefined,
                  }
                : undefined,
          }
        : undefined,
    },
  ];
  const tags = [
    `<title>${escapeHtml(metadata.title)}</title>`,
    `<meta name="description" content="${escapeHtml(metadata.description)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<link rel="canonical" href="${escapeHtml(metadata.url)}" />`,
    `<meta property="og:site_name" content="Italian Builders" />`,
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
    `<script type="application/ld+json">${jsonLdScriptContent(schema)}</script>`,
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
    : "/opengraph.png";
  const html = injectMetadata(readIndexHtml(), {
    title,
    description,
    origin,
    url: absoluteUrl(pagePath, origin),
    image: absoluteUrl(imagePath, origin),
    imageAlt: profile
      ? `${profile.full_name} on Italian Builders`
      : "Italian Builders",
    profile,
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    profile ? "s-maxage=300, stale-while-revalidate=86400" : "no-store",
  );
  res.status(200).send(html);
};

module.exports._internal = {
  injectMetadata,
  removeManagedMetadata,
};
