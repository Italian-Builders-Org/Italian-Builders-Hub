const fs = require("fs");
const path = require("path");

const WIDTH = 1200;
const HEIGHT = 630;
const HOME_STATS = {
  memberCount: 635,
  builders: 62,
  cities: 14,
  projects: 9,
};

let cachedLogoDataUrl;
let cachedFonts;

function h(type, props, ...children) {
  return {
    type,
    props: {
      ...(props || {}),
      children: children.length <= 1 ? children[0] : children,
    },
  };
}

function formatCount(value) {
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
  const builderCount = formatCount(stats.builders);
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
          h(StatBlock, { value: builderCount, label: "Builders" }),
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
  const { ImageResponse } = await import("@vercel/og");
  const response = new ImageResponse(buildImage(HOME_STATS), {
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
