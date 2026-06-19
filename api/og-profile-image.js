const {
  absoluteUrl,
  compactText,
  fetchPublicProfile,
  fetchPublicProfileProjects,
  initials,
  isHttpUrl,
  normalizeUsername,
  profileRoleLine,
  siteOrigin,
  truncateText,
} = require("./_profile-og");

function h(type, props, ...children) {
  return {
    type,
    props: {
      ...(props || {}),
      children: children.length <= 1 ? children[0] : children,
    },
  };
}

function cleanImageUrl(value, origin) {
  const url = absoluteUrl(value, origin);
  return isHttpUrl(url) ? url : null;
}

function Avatar({ src, name }) {
  return h(
    "div",
    {
      style: {
        position: "absolute",
        left: 68,
        top: 58,
        width: 198,
        height: 198,
        background: "#18181b",
        border: "1px solid #27272a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      },
    },
    src
      ? h("img", {
          src,
          width: 198,
          height: 198,
          style: { width: 198, height: 198, objectFit: "cover" },
        })
      : h(
          "div",
          {
            style: {
              color: "#f4f4f5",
              fontSize: 68,
              fontWeight: 800,
              letterSpacing: 0,
            },
          },
          initials(name),
        ),
  );
}

function Tag({ children }) {
  return h(
    "div",
    {
      style: {
        height: 44,
        border: "2px solid #52525b",
        color: "#d4d4d8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 16px",
        fontSize: 18,
        fontWeight: 800,
        fontFamily: "JetBrains Mono, monospace",
        letterSpacing: 4,
        textTransform: "uppercase",
      },
    },
    children,
  );
}

function LocationBadge({ location }) {
  return h(
    "div",
    {
      style: {
        position: "absolute",
        right: 72,
        top: 202,
        height: 44,
        border: "2px solid #52525b",
        color: "#d4d4d8",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 16px",
        fontSize: 18,
        fontWeight: 800,
        fontFamily: "JetBrains Mono, monospace",
        letterSpacing: 4,
        textTransform: "uppercase",
      },
    },
    h(
      "div",
      {
        style: {
          width: 16,
          height: 16,
          border: "3px solid #e4e4e7",
          borderRadius: 999,
          display: "flex",
        },
      },
      h("div", {
        style: {
          width: 4,
          height: 4,
          margin: 3,
          borderRadius: 999,
          background: "#e4e4e7",
        },
      }),
    ),
    location,
  );
}

function ProjectTile({ project, index, origin }) {
  const src = cleanImageUrl(project?.image_url, origin);
  const label = truncateText(
    compactText(project?.name) || `Project ${index + 1}`,
    28,
  );
  return h(
    "div",
    {
      style: {
        width: 342,
        height: 178,
        border: "2px solid #27272a",
        background: "#18181d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      },
    },
    src
      ? h("img", {
          src,
          width: 342,
          height: 178,
          style: { width: 342, height: 178, objectFit: "cover" },
        })
      : h(
          "div",
          {
            style: {
              color: "#71717a",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 0,
            },
          },
          label,
        ),
  );
}

function buildImage(profile, projects, origin) {
  const name = compactText(profile.full_name) || "Italian Builder";
  const headline = truncateText(profileRoleLine(profile), 64);
  const location = compactText(
    profile.location || profile.city || profile.country || "Italy",
  );
  const avatarUrl = cleanImageUrl(profile.avatar_url, origin);
  const skills = Array.isArray(profile.skills)
    ? profile.skills.filter(Boolean).slice(0, 3)
    : [];
  const tagLabels = (
    skills.length ? skills : ["Builder", "Product", "Italy"]
  ).slice(0, 3);
  const projectSlots = [
    ...projects
      .filter((project) => project?.image_url || project?.name)
      .slice(0, 3),
  ];
  while (projectSlots.length < 3)
    projectSlots.push({ name: `Project ${projectSlots.length + 1}` });
  const displayUrl = `italianbuilders.co/${profile.username}`;

  return h(
    "div",
    {
      style: {
        width: "1200px",
        height: "630px",
        background: "#070708",
        color: "#f4f4f5",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Inter, Arial, sans-serif",
      },
    },
    h(Avatar, { src: avatarUrl, name }),
    h(
      "div",
      {
        style: {
          position: "absolute",
          left: 294,
          top: 72,
          width: 820,
          display: "flex",
          flexDirection: "column",
        },
      },
      h(
        "div",
        {
          style: {
            color: "#ffffff",
            fontSize: name.length > 30 ? 45 : 52,
            lineHeight: 1.04,
            fontWeight: 800,
            letterSpacing: 0,
          },
        },
        name,
      ),
      h(
        "div",
        {
          style: {
            marginTop: 22,
            color: "#a1a1aa",
            fontSize: 30,
            lineHeight: 1.15,
            fontWeight: 700,
            letterSpacing: 0,
          },
        },
        headline,
      ),
      h(
        "div",
        {
          style: {
            marginTop: 40,
            display: "flex",
            gap: 14,
          },
        },
        ...tagLabels.map((tag) => h(Tag, { key: tag }, tag)),
      ),
    ),
    h(LocationBadge, { location }),
    h(
      "div",
      {
        style: {
          position: "absolute",
          left: 68,
          right: 68,
          top: 278,
          display: "flex",
          gap: 22,
        },
      },
      ...projectSlots.map((project, index) =>
        h(ProjectTile, {
          project,
          index,
          origin,
          key: `${project.name || "project"}-${index}`,
        }),
      ),
    ),
    h(
      "div",
      {
        style: {
          position: "absolute",
          left: 66,
          right: 66,
          bottom: 46,
          height: 74,
          border: "1px solid #2563eb",
          background: "#06183d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#f4f4f5",
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: 0,
        },
      },
      displayUrl,
    ),
  );
}

module.exports = async function handler(req, res) {
  const username = normalizeUsername(req.query?.username);
  const profile = username
    ? await fetchPublicProfile(username).catch(() => null)
    : null;
  if (!profile) {
    res.status(404).json({ error: "Public profile not found." });
    return;
  }

  const origin = siteOrigin(req);
  const projects = await fetchPublicProfileProjects(profile.id).catch(() => []);
  const { ImageResponse } = await import("@vercel/og");
  const response = new ImageResponse(buildImage(profile, projects, origin), {
    width: 1200,
    height: 630,
  });

  res.statusCode = 200;
  response.headers.forEach((value, key) => {
    if (!["cache-control", "content-type"].includes(key.toLowerCase()))
      res.setHeader(key, value);
  });
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=86400");
  const arrayBuffer = await response.arrayBuffer();
  res.end(Buffer.from(arrayBuffer));
};
