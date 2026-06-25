import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import type {
  CommunityProject,
  Profile,
  Project,
  ProjectMember,
} from "@/lib/supabase";

const siteName = "Italian Builders";
const siteOrigin =
  (import.meta.env.VITE_APP_BASE_URL as string | undefined)?.replace(
    /\/$/,
    "",
  ) || "https://italianbuilders.co";
const defaultDescription =
  "Discover founders, makers, technical contributors, and operators building from Italy.";
const defaultImage = absoluteUrl("/api/og-home-image");
const socialProfiles = [
  "https://x.com/italianbldrs",
  "https://www.linkedin.com/company/italian-builders-community/posts/?feedView=all",
];

type JsonLdValue =
  | undefined
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

type SeoConfig = {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article" | "profile";
  robots?: string;
  jsonLd?: JsonLdValue[];
};

function cleanText(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function truncate(value: string | null | undefined, maxLength: number) {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  const sliced = text.slice(0, maxLength - 1);
  const lastSpace = sliced.lastIndexOf(" ");
  return `${(lastSpace > 48 ? sliced.slice(0, lastSpace) : sliced).trim()}...`;
}

export function absoluteUrl(value = "/") {
  try {
    return new URL(value, siteOrigin).toString();
  } catch {
    return siteOrigin;
  }
}

function pageId(path = "/") {
  return `${absoluteUrl(path)}#webpage`;
}

function organizationSchema(): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteOrigin}/#organization`,
    name: siteName,
    url: siteOrigin,
    logo: absoluteUrl("/logo-vector.svg"),
    email: "info@italianbuilders.co",
    sameAs: socialProfiles,
  };
}

function websiteSchema(): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteOrigin}/#website`,
    name: siteName,
    url: siteOrigin,
    publisher: { "@id": `${siteOrigin}/#organization` },
    inLanguage: "en",
  };
}

function webPageSchema(config: SeoConfig): JsonLdValue {
  const path = config.path || "/";
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": pageId(path),
    url: absoluteUrl(path),
    name: config.title,
    description: config.description,
    isPartOf: { "@id": `${siteOrigin}/#website` },
    about: { "@id": `${siteOrigin}/#organization` },
    inLanguage: "en",
    primaryImageOfPage: config.image
      ? { "@type": "ImageObject", url: absoluteUrl(config.image) }
      : undefined,
  };
}

function breadcrumbSchema(path: string, title: string): JsonLdValue | null {
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const itemListElement = [
    {
      "@type": "ListItem",
      position: 1,
      name: siteName,
      item: siteOrigin,
    },
    ...segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      const isLast = index === segments.length - 1;
      return {
        "@type": "ListItem",
        position: index + 2,
        name: isLast
          ? title.replace(/\s+\|\s+Italian Builders$/, "")
          : titleCase(segment.replace(/-/g, " ")),
        item: absoluteUrl(href),
      };
    }),
  ];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function routeConfig(path: string): SeoConfig {
  const normalized = path === "" ? "/" : path;
  const noIndex = { robots: "noindex, nofollow" };

  if (
    normalized.startsWith("/dashboard") ||
    normalized.startsWith("/admin") ||
    normalized.startsWith("/invite") ||
    normalized.startsWith("/reset-password")
  ) {
    return {
      title: "Member area | Italian Builders",
      description: "Private Italian Builders member area.",
      path: normalized,
      ...noIndex,
    };
  }

  if (normalized === "/builders") {
    return {
      title: "Italian builder directory | Italian Builders",
      description:
        "Browse public profiles from Italian founders, makers, developers, designers, operators, and technical contributors.",
      path: "/builders",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": pageId("/builders"),
          name: "Italian builder directory",
          url: absoluteUrl("/builders"),
          isPartOf: { "@id": `${siteOrigin}/#website` },
        },
      ],
    };
  }

  if (normalized === "/projects") {
    return {
      title: "Italian builder projects | Italian Builders",
      description:
        "Explore live products, experiments, and open-source work from the Italian Builders network.",
      path: "/projects",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": pageId("/projects"),
          name: "Italian builder projects",
          url: absoluteUrl("/projects"),
          isPartOf: { "@id": `${siteOrigin}/#website` },
        },
      ],
    };
  }

  if (normalized === "/community-projects") {
    return {
      title: "Community projects | Italian Builders",
      description:
        "Discover shared workstreams and community-maintained projects from Italian Builders members.",
      path: "/community-projects",
    };
  }

  if (normalized === "/os-projects") {
    return {
      title: "Open-source projects | Italian Builders",
      description:
        "Community-maintained open-source projects and shared infrastructure for Italian builders.",
      path: "/os-projects",
    };
  }

  if (normalized === "/pantheon") {
    return {
      title: "Pantheon of Italian innovators | Italian Builders",
      description:
        "A library of the greatest Italian inventors, scientists, artists and builders, from Leonardo da Vinci and Galileo to Olivetti and Faggin, and why they shaped the modern world.",
      path: "/pantheon",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": pageId("/pantheon"),
          name: "Pantheon of Italian innovators",
          url: absoluteUrl("/pantheon"),
          isPartOf: { "@id": `${siteOrigin}/#website` },
        },
      ],
    };
  }

  if (normalized === "/mission") {
    return {
      title: "Mission | Italian Builders",
      description:
        "Italian Builders exists to connect people who build products, companies, software, creative work, and technology in or connected to Italy.",
      path: "/mission",
    };
  }

  if (normalized === "/hp-2") {
    return {
      title: "Homepage preview 02 | Italian Builders",
      description:
        "Hidden alternate homepage proposal for the Italian Builders community.",
      path: "/hp-2",
      ...noIndex,
    };
  }

  if (normalized === "/join") {
    return {
      title: "Request access | Italian Builders",
      description:
        "Request access to Italian Builders and share what you are building with the community.",
      path: "/join",
    };
  }

  if (normalized === "/privacy") {
    return {
      title: "Privacy Policy | Italian Builders",
      description:
        "How Italian Builders collects, uses, stores, and protects information for the community.",
      path: "/privacy",
    };
  }

  if (normalized === "/terms") {
    return {
      title: "Terms of Service | Italian Builders",
      description:
        "The basic rules for using the Italian Builders website and community features.",
      path: "/terms",
    };
  }

  return {
    title: "Italian Builders | founders, makers and technical contributors",
    description: defaultDescription,
    path: normalized,
  };
}

function setMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([name, value]) => {
    element?.setAttribute(name, value);
  });
  element.setAttribute("data-seo-managed", "true");
}

function setLink(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLLinkElement>(selector);
  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([name, value]) => {
    element?.setAttribute(name, value);
  });
  element.setAttribute("data-seo-managed", "true");
}

function appendJsonLdSchema(schema: Exclude<JsonLdValue, undefined | null>) {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-seo-managed", "true");
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);
}

function applySeo(config: SeoConfig) {
  const path = config.path || window.location.pathname || "/";
  const canonical = absoluteUrl(path);
  const image = absoluteUrl(config.image || defaultImage);
  const robots = config.robots || "index, follow, max-image-preview:large";

  document.title = config.title;
  setMeta('meta[name="description"]', {
    name: "description",
    content: config.description,
  });
  setMeta('meta[name="robots"]', { name: "robots", content: robots });
  setLink('link[rel="canonical"]', { rel: "canonical", href: canonical });

  setMeta('meta[property="og:site_name"]', {
    property: "og:site_name",
    content: siteName,
  });
  setMeta('meta[property="og:title"]', {
    property: "og:title",
    content: config.title,
  });
  setMeta('meta[property="og:description"]', {
    property: "og:description",
    content: config.description,
  });
  setMeta('meta[property="og:type"]', {
    property: "og:type",
    content: config.type || "website",
  });
  setMeta('meta[property="og:url"]', {
    property: "og:url",
    content: canonical,
  });
  setMeta('meta[property="og:image"]', {
    property: "og:image",
    content: image,
  });
  setMeta('meta[property="og:image:secure_url"]', {
    property: "og:image:secure_url",
    content: image,
  });
  setMeta('meta[property="og:image:type"]', {
    property: "og:image:type",
    content: "image/png",
  });
  setMeta('meta[property="og:image:width"]', {
    property: "og:image:width",
    content: "1200",
  });
  setMeta('meta[property="og:image:height"]', {
    property: "og:image:height",
    content: "630",
  });
  setMeta('meta[property="og:image:alt"]', {
    property: "og:image:alt",
    content: config.imageAlt || siteName,
  });
  setMeta('meta[name="twitter:card"]', {
    name: "twitter:card",
    content: "summary_large_image",
  });
  setMeta('meta[name="twitter:title"]', {
    name: "twitter:title",
    content: config.title,
  });
  setMeta('meta[name="twitter:description"]', {
    name: "twitter:description",
    content: config.description,
  });
  setMeta('meta[name="twitter:image"]', {
    name: "twitter:image",
    content: image,
  });
  setMeta('meta[name="twitter:image:alt"]', {
    name: "twitter:image:alt",
    content: config.imageAlt || siteName,
  });

  document
    .querySelectorAll(
      'script[type="application/ld+json"][data-seo-managed], script[type="application/ld+json"][data-seo-static]',
    )
    .forEach((element) => element.remove());

  if (!robots.includes("noindex")) {
    const breadcrumb = breadcrumbSchema(path, config.title);
    const jsonLd = [
      organizationSchema(),
      websiteSchema(),
      webPageSchema({ ...config, path, image }),
      ...(breadcrumb ? [breadcrumb] : []),
      ...(config.jsonLd || []),
    ];
    jsonLd.filter((schema) => schema != null).forEach(appendJsonLdSchema);
  }
}

export function Seo(config: SeoConfig) {
  const stableConfig = useMemo(() => config, [JSON.stringify(config)]);

  useEffect(() => {
    applySeo(stableConfig);
  }, [stableConfig]);

  return null;
}

export function RouteSeo() {
  const [location] = useLocation();
  const config = routeConfig(location);
  return <Seo {...config} />;
}

export function profileSeo(profile: Profile): SeoConfig {
  const path = `/builders/${profile.username}`;
  const title = `${profile.full_name} | Italian Builders`;
  const description = truncate(
    profile.bio ||
      profile.headline ||
      profile.role ||
      "Builder on Italian Builders",
    155,
  );
  const sameAs = [
    profile.website_url,
    profile.linkedin_url,
    profile.x_url,
    profile.github_url,
    profile.youtube_url,
    profile.instagram_url,
  ].filter(Boolean);

  return {
    title,
    description,
    path,
    type: "profile",
    image: `/api/og-profile-image?username=${encodeURIComponent(profile.username)}`,
    imageAlt: `${profile.full_name} on Italian Builders`,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "@id": pageId(path),
        name: title,
        url: absoluteUrl(path),
        mainEntity: {
          "@type": "Person",
          "@id": `${absoluteUrl(path)}#person`,
          name: profile.full_name,
          alternateName: profile.username,
          description,
          image: profile.avatar_url
            ? absoluteUrl(profile.avatar_url)
            : undefined,
          jobTitle: profile.headline || profile.role || undefined,
          knowsAbout: profile.skills?.length ? profile.skills : undefined,
          sameAs: sameAs.length ? sameAs : undefined,
          address:
            profile.city || profile.country
              ? {
                  "@type": "PostalAddress",
                  addressLocality: profile.city || undefined,
                  addressCountry: profile.country || undefined,
                }
              : undefined,
        },
      },
    ],
  };
}

export function projectSeo(project: Project): SeoConfig {
  const path = `/projects/${project.slug}`;
  const title = `${project.name} | Italian Builders`;
  const description = truncate(
    project.tagline ||
      project.description ||
      "A project from the Italian Builders community.",
    155,
  );
  const image = project.image_url || defaultImage;
  const contributors = [
    project.profiles,
    ...(project.project_members || []).map(
      (member: ProjectMember) => member.profiles,
    ),
  ].filter(Boolean);

  return {
    title,
    description,
    path,
    image,
    imageAlt: project.name,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": project.is_open_source ? "SoftwareSourceCode" : "CreativeWork",
        "@id": `${absoluteUrl(path)}#project`,
        name: project.name,
        url: absoluteUrl(path),
        description,
        image: image ? absoluteUrl(image) : undefined,
        dateCreated: project.created_at,
        dateModified: project.updated_at,
        creator: project.profiles?.full_name
          ? {
              "@type": "Person",
              name: project.profiles.full_name,
              url: project.profiles.username
                ? absoluteUrl(`/builders/${project.profiles.username}`)
                : undefined,
            }
          : { "@id": `${siteOrigin}/#organization` },
        contributor: contributors.map((profile) => ({
          "@type": "Person",
          name: profile?.full_name,
          url: profile?.username
            ? absoluteUrl(`/builders/${profile.username}`)
            : undefined,
        })),
        sameAs: [
          project.website_url,
          project.demo_url,
          project.github_url,
        ].filter(Boolean),
        keywords: projectCategoryNames(project),
      },
    ],
  };
}

export function communityProjectSeo(project: CommunityProject): SeoConfig {
  const path = `/community-projects/${project.slug}`;
  const title = `${project.name} | Italian Builders`;
  const description = truncate(
    project.tagline ||
      project.description ||
      "A shared Italian Builders community project.",
    155,
  );

  return {
    title,
    description,
    path,
    image: project.image_url || defaultImage,
    imageAlt: project.name,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "@id": `${absoluteUrl(path)}#community-project`,
        name: project.name,
        url: absoluteUrl(path),
        description,
        image: project.image_url ? absoluteUrl(project.image_url) : undefined,
        dateCreated: project.created_at,
        dateModified: project.updated_at,
        creator: { "@id": `${siteOrigin}/#organization` },
        contributor: (project.community_project_members || [])
          .map((member) => member.profiles)
          .filter(Boolean)
          .map((profile) => ({
            "@type": "Person",
            name: profile?.full_name,
            url: profile?.username
              ? absoluteUrl(`/builders/${profile.username}`)
              : undefined,
          })),
        sameAs: [project.website_url, project.repo_url].filter(Boolean),
        keywords: [project.category].filter(Boolean),
      },
    ],
  };
}

function projectCategoryNames(project: Project) {
  return (
    project.project_category_tags
      ?.map((item) => item.project_categories?.name)
      .filter(Boolean) || [project.category].filter(Boolean)
  );
}
