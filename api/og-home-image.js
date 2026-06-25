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

function Stat({ label, value }) {
  return h(
    "div",
    {
      style: {
        width: 244,
        height: 108,
        border: "1px solid #2b2b31",
        background: "#111114",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 24px",
      },
    },
    h(
      "div",
      {
        style: {
          color: "#f4f4f5",
          fontSize: 34,
          fontWeight: 850,
          letterSpacing: 0,
          lineHeight: 1,
        },
      },
      value,
    ),
    h(
      "div",
      {
        style: {
          marginTop: 12,
          color: "#a1a1aa",
          fontSize: 17,
          fontWeight: 750,
          letterSpacing: 0,
        },
      },
      label,
    ),
  );
}

function ConnectorRow({ label, active }) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        height: 52,
        color: active ? "#e4e4e7" : "#71717a",
        fontSize: 22,
        fontWeight: 800,
        letterSpacing: 0,
      },
    },
    h("div", {
      style: {
        width: 16,
        height: 16,
        borderRadius: 999,
        background: active ? "#1b8a45" : "#3f3f46",
        border: active ? "3px solid #b8f5ce" : "3px solid #71717a",
        display: "flex",
      },
    }),
    label,
  );
}

function buildImage(stats) {
  const logo = readLogoDataUrl();
  const signupCount = formatCount(stats.signupCount);
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
        background:
          "linear-gradient(135deg, rgba(27,138,69,0.22) 0%, rgba(7,7,8,0) 30%, rgba(185,44,44,0.2) 100%)",
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
    h(
      "div",
      {
        style: {
          position: "absolute",
          left: 68,
          top: 58,
          display: "flex",
          alignItems: "center",
          height: 74,
        },
      },
      logo
        ? h("img", {
            src: logo,
            width: 408,
            height: 64,
            style: { width: 408, height: 64, objectFit: "contain" },
          })
        : h(
            "div",
            {
              style: {
                color: "#fff",
                fontSize: 42,
                fontWeight: 900,
                letterSpacing: 0,
                display: "flex",
              },
            },
            "Italian Builders",
          ),
    ),
    h(
      "div",
      {
        style: {
          position: "absolute",
          left: 70,
          top: 170,
          width: 660,
          display: "flex",
          flexDirection: "column",
        },
      },
      h(
        "div",
        {
          style: {
            color: "#a1a1aa",
            fontSize: 24,
            fontWeight: 850,
            letterSpacing: 3,
            textTransform: "uppercase",
          },
        },
        "Live community index",
      ),
      h(
        "div",
        {
          style: {
            marginTop: 24,
            color: "#ffffff",
            fontSize: signupCount.length > 5 ? 104 : 124,
            lineHeight: 0.9,
            fontWeight: 900,
            letterSpacing: 0,
          },
        },
        signupCount,
      ),
      h(
        "div",
        {
          style: {
            marginTop: 18,
            color: "#f4f4f5",
            fontSize: 48,
            lineHeight: 1.03,
            fontWeight: 900,
            letterSpacing: 0,
          },
        },
        "builders signed up",
      ),
      h(
        "div",
        {
          style: {
            marginTop: 26,
            color: "#d4d4d8",
            fontSize: 24,
            lineHeight: 1.24,
            fontWeight: 700,
            letterSpacing: 0,
          },
        },
        "A live graph of Italian founders, makers, developers and operators.",
      ),
    ),
    h(
      "div",
      {
        style: {
          position: "absolute",
          right: 70,
          top: 88,
          width: 338,
          height: 350,
          border: "1px solid #2b2b31",
          background: "rgba(17,17,20,0.94)",
          display: "flex",
          flexDirection: "column",
          padding: "30px 30px",
        },
      },
      h(
        "div",
        {
          style: {
            color: "#71717a",
            fontSize: 16,
            fontWeight: 850,
            letterSpacing: 4,
            textTransform: "uppercase",
            display: "flex",
          },
        },
        "Network status",
      ),
      h(
        "div",
        {
          style: {
            marginTop: 24,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          },
        },
        h(ConnectorRow, { label: "Members joining", active: true }),
        h(ConnectorRow, { label: "Profiles publishing", active: true }),
        h(ConnectorRow, { label: "Projects shipping", active: true }),
        h(ConnectorRow, { label: "Shared work forming", active: true }),
      ),
      h("div", {
        style: {
          marginTop: 20,
          height: 2,
          background: "#1b8a45",
          display: "flex",
        },
      }),
    ),
    h(
      "div",
      {
        style: {
          position: "absolute",
          left: 70,
          right: 70,
          bottom: 34,
          display: "flex",
          gap: 18,
        },
      },
      h(Stat, { label: "public profiles", value: publicBuilderCount }),
      h(Stat, { label: "builder projects", value: projectCount }),
      h(Stat, { label: "community projects", value: communityProjectCount }),
      h(
        "div",
        {
          style: {
            flex: 1,
            height: 108,
            border: "1px solid #b92c2c",
            background: "#2a0d0d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fee2e2",
            fontSize: 21,
            fontWeight: 850,
            letterSpacing: 0,
            padding: "0 22px",
          },
        },
        "Request access and add your build",
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
