const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const WIDTH = 1200;
const HEIGHT = 630;
const DEFAULT_MEMBER_COUNT = 635;
const DEFAULT_PUBLIC_BUILDERS = 62;
const DEFAULT_CITY_COUNT = 14;
const DEFAULT_PROJECT_COUNT = 9;

let cachedLogoDataUrl;
let cachedFonts;
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
      memberCount: DEFAULT_MEMBER_COUNT,
      publicBuilders: DEFAULT_PUBLIC_BUILDERS,
      cities: DEFAULT_CITY_COUNT,
      projects: DEFAULT_PROJECT_COUNT,
    };
  }

  const [waitlistCount, profileCount, cityResponse, projectCount] =
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
      supabase
        .from("profiles")
        .select("city")
        .eq("visibility", "public")
        .not("city", "is", null),
      readCount(
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("is_public", true),
      ),
    ]);

  const cityCount = Array.isArray(cityResponse.data)
    ? new Set(
        cityResponse.data
          .map((profile) =>
            String(profile.city || "")
              .trim()
              .toLowerCase(),
          )
          .filter(Boolean),
      ).size
    : null;

  return {
    memberCount: Math.max(
      waitlistCount ?? DEFAULT_MEMBER_COUNT,
      profileCount ?? DEFAULT_MEMBER_COUNT,
    ),
    publicBuilders: profileCount ?? DEFAULT_PUBLIC_BUILDERS,
    cities: cityCount || DEFAULT_CITY_COUNT,
    projects: projectCount ?? DEFAULT_PROJECT_COUNT,
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
      "artifacts/italian-builders/public/logo-vector-dark-mattoni.svg",
    ),
    path.join(
      process.cwd(),
      "artifacts/italian-builders/dist/public/logo-vector-dark-mattoni.svg",
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

function readFontData(fileName) {
  const candidates = [
    path.join(
      process.cwd(),
      "artifacts/italian-builders/public/fonts",
      fileName,
    ),
    path.join(
      process.cwd(),
      "artifacts/italian-builders/dist/public/fonts",
      fileName,
    ),
  ];
  const fontPath = candidates.find((candidate) => fs.existsSync(candidate));
  return fontPath ? fs.readFileSync(fontPath) : null;
}

function readFonts() {
  if (cachedFonts) return cachedFonts;

  const regular = readFontData("Inter-Regular.otf");
  const black = readFontData("Inter-Black.otf");
  cachedFonts = [
    regular
      ? { name: "Inter", data: regular, weight: 400, style: "normal" }
      : null,
    black ? { name: "Inter", data: black, weight: 900, style: "normal" } : null,
  ].filter(Boolean);
  return cachedFonts;
}

function HeroNavItem({ label }) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        color: "#08100b",
        fontSize: 11,
        fontWeight: 900,
        textTransform: "uppercase",
      },
    },
    label,
  );
}

function HeaderButton({ label }) {
  return h(
    "div",
    {
      style: {
        height: 30,
        border: "2px solid #08100b",
        padding: "0 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#08100b",
        fontSize: 11,
        fontWeight: 900,
        textTransform: "uppercase",
      },
    },
    label,
  );
}

function StatBlock({ value, label, accent }) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        paddingTop: 22,
        width: 120,
      },
    },
    h(
      "div",
      {
        style: {
          color: "#08100b",
          fontSize: 68,
          fontWeight: 900,
          lineHeight: 0.9,
          letterSpacing: -1,
        },
      },
      value,
    ),
    h(
      "div",
      {
        style: {
          marginTop: 10,
          color: "#4f5248",
          display: "flex",
          flexDirection: "column",
          fontSize: 10,
          fontWeight: 900,
          textTransform: "uppercase",
        },
      },
      label,
      accent
        ? h(
            "span",
            {
              style: {
                color: "#1b8a45",
                display: "flex",
                marginTop: 4,
              },
            },
            accent,
          )
        : null,
    ),
  );
}

function buildImage(stats) {
  const logo = readLogoDataUrl();
  const memberCount = formatCount(stats.memberCount);
  const publicBuilderCount = formatCount(stats.publicBuilders);
  const cityCount = formatCount(stats.cities);
  const projectCount = formatCount(stats.projects);

  return h(
    "div",
    {
      style: {
        width: WIDTH,
        height: HEIGHT,
        background: "#f2ecdf",
        color: "#08100b",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "Inter, Arial, sans-serif",
      },
    },
    h(
      "div",
      {
        style: {
          width: "100%",
          height: 54,
          borderBottom: "2px solid #08100b",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
        },
      },
      logo
        ? h("img", {
            src: logo,
            width: 258,
            height: 40,
            style: { width: 258, height: 40, objectFit: "contain" },
          })
        : h(
            "div",
            {
              style: {
                color: "#08100b",
                fontSize: 30,
                fontWeight: 900,
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
            gap: 23,
            alignItems: "center",
          },
        },
        h(HeroNavItem, { label: "Builders" }),
        h(HeroNavItem, { label: "Projects" }),
        h(HeroNavItem, { label: "Community projects" }),
        h(HeroNavItem, { label: "Content" }),
        h(HeroNavItem, { label: "Pantheon" }),
        h(HeaderButton, { label: "Dashboard" }),
      ),
    ),
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          height: 492,
          justifyContent: "space-between",
          padding: "42px 38px 20px",
        },
      },
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
          },
        },
        h(
          "div",
          {
            style: {
              color: "#08100b",
              fontSize: 112,
              lineHeight: 0.88,
              fontWeight: 900,
              letterSpacing: -4,
              display: "flex",
              flexDirection: "column",
            },
          },
          h("span", null, "Connecting"),
          h("span", null, "the people"),
        ),
        h(
          "div",
          {
            style: {
              color: "#08100b",
              fontSize: 104,
              lineHeight: 0.92,
              fontWeight: 900,
              letterSpacing: -4,
              display: "flex",
              alignItems: "baseline",
            },
          },
          h("span", null, "who"),
          h(
            "span",
            { style: { color: "#1b8a45", marginLeft: 28, fontSize: 118 } },
            "Build.",
          ),
        ),
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "flex-start",
            gap: 48,
          },
        },
        h(
          "div",
          {
            style: {
              width: 395,
              color: "#4f5248",
              fontSize: 21,
              lineHeight: 1.28,
              fontWeight: 400,
              display: "flex",
              flexDirection: "column",
            },
          },
          h("span", null, "Italian Builders exists to connect developers,"),
          h("span", null, "designers, founders, creators, researchers, and"),
          h("span", null, "entrepreneurs across Italy."),
        ),
        h(
          "div",
          {
            style: {
              width: 640,
              borderTop: "2px solid #08100b",
              display: "flex",
              justifyContent: "space-between",
            },
          },
          h(StatBlock, {
            value: memberCount,
            label: "Members",
            accent: "Telegram",
          }),
          h(StatBlock, { value: publicBuilderCount, label: "Builders" }),
          h(StatBlock, { value: cityCount, label: "Cities" }),
          h(StatBlock, { value: projectCount, label: "Projects" }),
        ),
      ),
    ),
    h(
      "div",
      {
        style: {
          height: 84,
          borderTop: "2px solid #08100b",
          alignItems: "center",
          justifyContent: "center",
          display: "flex",
        },
      },
      h(
        "div",
        {
          style: {
            color: "#08100b",
            display: "flex",
            fontSize: 42,
            fontWeight: 900,
            letterSpacing: -1,
          },
        },
        "The Manifesto",
      ),
    ),
  );
}

module.exports = async function handler(req, res) {
  const stats = await getHomeStats().catch(() => ({
    memberCount: DEFAULT_MEMBER_COUNT,
    publicBuilders: DEFAULT_PUBLIC_BUILDERS,
    cities: DEFAULT_CITY_COUNT,
    projects: DEFAULT_PROJECT_COUNT,
  }));
  const { ImageResponse } = await import("@vercel/og");
  const response = new ImageResponse(buildImage(stats), {
    width: WIDTH,
    height: HEIGHT,
    fonts: readFonts(),
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
