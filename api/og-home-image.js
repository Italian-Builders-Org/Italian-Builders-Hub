const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const WIDTH = 1200;
const HEIGHT = 630;
const DEFAULT_SIGNUP_COUNT = 0;

let cachedLogoDataUrl;
let cachedSupabase;

function h(type, props, ...children) {
  return {
    type,
    props: {
      ...(props || {}),
      children: children.length <= 1 ? children[0] : children,
    },
  };
}

function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) return null;
  return { supabaseUrl, supabaseKey };
}

function getSupabase() {
  if (cachedSupabase) return cachedSupabase;
  const config = getSupabaseConfig();
  if (!config) return null;

  cachedSupabase = createClient(config.supabaseUrl, config.supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return cachedSupabase;
}

async function readCount(query) {
  const { count, error } = await query;
  if (error) return null;
  return typeof count === "number" ? count : null;
}

async function getHomeStats() {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      signupCount: DEFAULT_SIGNUP_COUNT,
      publicBuilders: null,
      projects: null,
      communityProjects: null,
    };
  }

  const [waitlistCount, profileCount, projectCount, communityProjectCount] =
    await Promise.all([
      readCount(
        supabase
          .from("waitlist_signups")
          .select("id", { count: "exact", head: true }),
      ),
      readCount(
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("visibility", "public"),
      ),
      readCount(
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("is_public", true),
      ),
      readCount(
        supabase
          .from("community_projects")
          .select("id", { count: "exact", head: true })
          .eq("is_public", true),
      ),
    ]);

  return {
    signupCount: Math.max(
      waitlistCount ?? DEFAULT_SIGNUP_COUNT,
      profileCount ?? DEFAULT_SIGNUP_COUNT,
    ),
    publicBuilders: profileCount,
    projects: projectCount,
    communityProjects: communityProjectCount,
  };
}

function formatCount(value) {
  if (typeof value !== "number") return "Live";
  return new Intl.NumberFormat("en").format(value);
}

function readLogoDataUrl() {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;

  const candidates = [
    path.join(
      process.cwd(),
      "artifacts/italian-builders/public/logo-vector.svg",
    ),
    path.join(
      process.cwd(),
      "artifacts/italian-builders/dist/public/logo-vector.svg",
    ),
  ];
  const logoPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!logoPath) return null;

  const svg = fs.readFileSync(logoPath, "utf8");
  cachedLogoDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString(
    "base64",
  )}`;
  return cachedLogoDataUrl;
}

function HeroNavItem({ label }) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        color: "#71717a",
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: 2.2,
        textTransform: "uppercase",
      },
    },
    "/",
    label,
  );
}

function buildImage(stats) {
  const logo = readLogoDataUrl();
  const publicBuilderCount = formatCount(stats.publicBuilders);
  const projectCount = formatCount(stats.projects);
  const communityProjectCount = formatCount(stats.communityProjects);

  return h(
    "div",
    {
      style: {
        width: WIDTH,
        height: HEIGHT,
        background: "#070708",
        color: "#f4f4f5",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Inter, Arial, sans-serif",
      },
    },
    h("div", {
      style: {
        position: "absolute",
        inset: 0,
        background: "#09090b",
        display: "flex",
      },
    }),
    h("div", {
      style: {
        position: "absolute",
        left: 0,
        top: 0,
        width: WIDTH,
        height: HEIGHT,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        opacity: 0.38,
        display: "flex",
      },
    }),
    h("div", {
      style: {
        position: "absolute",
        right: -72,
        top: -90,
        width: 690,
        height: 690,
        borderRadius: 999,
        background: "rgba(37,99,235,0.18)",
        display: "flex",
      },
    }),
    h(
      "div",
      {
        style: {
          position: "absolute",
          left: 0,
          top: 0,
          width: WIDTH,
          height: 54,
          borderBottom: "1px solid #27272a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 72px",
        },
      },
      logo
        ? h("img", {
            src: logo,
            width: 181,
            height: 28,
            style: { width: 181, height: 28, objectFit: "contain" },
          })
        : h(
            "div",
            {
              style: {
                color: "#fff",
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: 0,
                display: "flex",
              },
            },
            "Italian Builders",
          ),
      h(
        "div",
        {
          style: {
            display: "flex",
            gap: 56,
            alignItems: "center",
          },
        },
        h(HeroNavItem, { label: "Builders" }),
        h(HeroNavItem, { label: "Projects" }),
        h(HeroNavItem, { label: "Community projects" }),
      ),
    ),
    h(
      "div",
      {
        style: {
          position: "absolute",
          left: 72,
          top: 116,
          width: 584,
          display: "flex",
          flexDirection: "column",
        },
      },
      h(
        "div",
        {
          style: {
            color: "#60a5fa",
            fontSize: 17,
            fontWeight: 850,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            display: "flex",
          },
        },
        "> Community graph --Italy",
      ),
      h(
        "div",
        {
          style: {
            marginTop: 30,
            color: "#ffffff",
            fontSize: 78,
            lineHeight: 0.92,
            fontWeight: 900,
            letterSpacing: 0,
            display: "flex",
            flexDirection: "column",
          },
        },
        h("span", null, "Connecting"),
        h("span", null, "the people"),
        h(
          "span",
          { style: { display: "flex" } },
          "who",
          h("span", { style: { color: "#3b82f6", marginLeft: 18 } }, "BUILD."),
        ),
      ),
      h(
        "div",
        {
          style: {
            marginTop: 28,
            color: "#a1a1aa",
            fontSize: 22,
            lineHeight: 1.36,
            fontWeight: 500,
            letterSpacing: 0,
            display: "flex",
            flexDirection: "column",
          },
        },
        h("span", null, "Italian Builders exists to help founders, developers,"),
        h("span", null, "designers and makers discover each other, share"),
        h("span", null, "projects and create opportunities."),
      ),
      h(
        "div",
        {
          style: {
            marginTop: 28,
            display: "flex",
            alignItems: "center",
            gap: 14,
          },
        },
        h(
          "div",
          {
            style: {
              height: 44,
              padding: "0 22px",
              background: "#2563eb",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 1.1,
              textTransform: "uppercase",
            },
          },
          "Join waitlist",
        ),
        h(
          "div",
          {
            style: {
              color: "#71717a",
              display: "flex",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 2.4,
              textTransform: "uppercase",
            },
          },
          "Builders / Projects / Initiatives",
        ),
      ),
    ),
    h(
      "div",
      {
        style: {
          position: "absolute",
          right: 64,
          top: 148,
          width: 438,
          height: 390,
          border: "1px solid #2b2b31",
          background: "rgba(9,9,11,0.92)",
          display: "flex",
          flexDirection: "column",
          padding: "18px 18px",
        },
      },
      h(
        "div",
        {
          style: {
            color: "#71717a",
            fontSize: 13,
            fontWeight: 850,
            letterSpacing: 3,
            textTransform: "uppercase",
            display: "flex",
            justifyContent: "space-between",
          },
        },
        h("span", null, "Builder map"),
        h("span", { style: { color: "#60a5fa" } }, "Italia"),
      ),
      h("div", {
        style: {
          position: "absolute",
          left: 18,
          right: 18,
          top: 50,
          bottom: 18,
          border: "1px solid #2b2b31",
          display: "flex",
        },
      }),
      h("div", {
        style: {
          position: "absolute",
          left: 140,
          top: 132,
          width: 192,
          height: 192,
          borderRadius: 999,
          border: "1px solid rgba(59,130,246,0.28)",
          background: "rgba(30,64,175,0.16)",
          display: "flex",
        },
      }),
      ...[
        [232, 190],
        [190, 218],
        [260, 252],
        [300, 300],
        [150, 274],
      ].map(([left, top], index) =>
        h("div", {
          key: index,
          style: {
            position: "absolute",
            left,
            top,
            width: index === 0 ? 10 : 8,
            height: index === 0 ? 10 : 8,
            borderRadius: 999,
            background: "#3b82f6",
            boxShadow: "0 0 18px rgba(59,130,246,0.95)",
            display: "flex",
          },
        }),
      ),
      h(
        "div",
        {
          style: {
            position: "absolute",
            left: 46,
            right: 46,
            bottom: 36,
            height: 66,
            border: "1px solid #2b2b31",
            background: "rgba(9,9,11,0.84)",
            display: "flex",
          },
        },
        h(
          "div",
          {
            style: {
              width: "33.333%",
              borderRight: "1px solid #2b2b31",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            },
          },
          h("div", { style: { fontSize: 20, color: "#f4f4f5" } }, publicBuilderCount),
          h("div", { style: { fontSize: 10, color: "#71717a", letterSpacing: 1.8, textTransform: "uppercase" } }, "Builders"),
        ),
        h(
          "div",
          {
            style: {
              width: "33.333%",
              borderRight: "1px solid #2b2b31",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            },
          },
          h("div", { style: { fontSize: 20, color: "#f4f4f5" } }, projectCount),
          h("div", { style: { fontSize: 10, color: "#71717a", letterSpacing: 1.8, textTransform: "uppercase" } }, "Projects"),
        ),
        h(
          "div",
          {
            style: {
              width: "33.333%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            },
          },
          h("div", { style: { fontSize: 20, color: "#f4f4f5" } }, communityProjectCount),
          h("div", { style: { fontSize: 10, color: "#71717a", letterSpacing: 1.8, textTransform: "uppercase" } }, "Ideas"),
        ),
      ),
    ),
    h(
      "div",
      {
        style: {
          position: "absolute",
          left: 72,
          right: 72,
          bottom: 30,
          borderTop: "1px solid #27272a",
          paddingTop: 10,
          justifyContent: "flex-end",
          display: "flex",
        },
      },
      h(
        "div",
        {
          style: {
            color: "#71717a",
            display: "flex",
            fontSize: 15,
            fontWeight: 700,
          },
        },
        "italianbuilders.co",
      ),
    ),
  );
}

module.exports = async function handler(req, res) {
  const stats = await getHomeStats().catch(() => ({
    signupCount: DEFAULT_SIGNUP_COUNT,
    publicBuilders: null,
    projects: null,
    communityProjects: null,
  }));
  const { ImageResponse } = await import("@vercel/og");
  const response = new ImageResponse(buildImage(stats), {
    width: WIDTH,
    height: HEIGHT,
  });

  res.statusCode = 200;
  response.headers.forEach((value, key) => {
    if (!["cache-control", "content-type"].includes(key.toLowerCase())) {
      res.setHeader(key, value);
    }
  });
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=86400");
  const arrayBuffer = await response.arrayBuffer();
  res.end(Buffer.from(arrayBuffer));
};
