import type {
  Builder,
  DirectoryStats,
  OsProject,
  Project,
  WaitlistCount,
  WaitlistSignup,
} from "@workspace/api-client-react";

export function hasItems<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

export function isDirectoryStats(value: unknown): value is DirectoryStats {
  if (!value || typeof value !== "object") return false;
  const stats = value as Partial<Record<keyof DirectoryStats, unknown>>;
  return (
    typeof stats.builders === "string" &&
    typeof stats.regions === "string" &&
    typeof stats.cities === "string"
  );
}

export function isWaitlistCount(value: unknown): value is WaitlistCount {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as Partial<WaitlistCount>).count === "number",
  );
}

export function isWaitlistSignup(value: unknown): value is WaitlistSignup {
  if (!value || typeof value !== "object") return false;
  const signup = value as Partial<WaitlistSignup>;
  return (
    typeof signup.id === "number" &&
    typeof signup.name === "string" &&
    typeof signup.email === "string" &&
    typeof signup.role === "string" &&
    typeof signup.createdAt === "string"
  );
}

export const STATIC_DIRECTORY_STATS: DirectoryStats = {
  builders: "500+",
  regions: "20",
  cities: "60+",
};

export const STATIC_BUILDERS: Builder[] = [
  {
    id: 1,
    name: "Marco Rossi",
    role: "Founder",
    location: "Milano",
    avatarUrl: "/images/avatar-1.png",
    highlight: "Bootstrapping Supersync to $12k MRR, solo.",
    tags: ["SaaS", "Developer Tools"],
  },
  {
    id: 2,
    name: "Sofia Bianchi",
    role: "AI Engineer",
    location: "Torino",
    avatarUrl: "/images/avatar-2.png",
    highlight: "Shipping generative UI tooling with Lumina AI.",
    tags: ["AI", "Design"],
  },
  {
    id: 3,
    name: "Luca Ferrari",
    role: "Infra Developer",
    location: "Bologna",
    avatarUrl: "/images/avatar-3.png",
    highlight: "Building Postgres branching for preview envs.",
    tags: ["Developer Tools", "Open Source"],
  },
  {
    id: 4,
    name: "Giulia Romano",
    role: "Product Lead",
    location: "Roma",
    avatarUrl: "/images/avatar-4.png",
    highlight: "Designing a CRM for boutique agencies.",
    tags: ["B2B", "SaaS"],
  },
  {
    id: 5,
    name: "Alessandro Conti",
    role: "Founder",
    location: "Napoli",
    avatarUrl: "/images/avatar-5.png",
    highlight: "Fiat-to-crypto rails for EU merchants.",
    tags: ["Crypto", "Fintech"],
  },
  {
    id: 6,
    name: "Elena Marino",
    role: "Creator",
    location: "Firenze",
    avatarUrl: "/images/avatar-6.png",
    highlight: "Open-source storefront for digital creators.",
    tags: ["Open Source", "E-commerce"],
  },
  {
    id: 7,
    name: "Davide Greco",
    role: "Indie Hacker",
    location: "Verona",
    avatarUrl: "/images/avatar-7.png",
    highlight: "Automating boring ops with no-code flows.",
    tags: ["Automation", "No-Code"],
  },
  {
    id: 8,
    name: "Chiara Esposito",
    role: "Designer & Dev",
    location: "Palermo",
    avatarUrl: "/images/avatar-8.png",
    highlight: "Crafting calm consumer apps for iOS.",
    tags: ["Consumer Apps", "Mobile"],
  },
  {
    id: 9,
    name: "Matteo Galli",
    role: "Solo Founder",
    location: "Genova",
    avatarUrl: "/images/avatar-9.png",
    highlight: "AI copilots for indie developers.",
    tags: ["AI", "Developer Tools"],
  },
  {
    id: 10,
    name: "Francesca Lombardi",
    role: "Growth",
    location: "Padova",
    avatarUrl: "/images/avatar-10.png",
    highlight: "Scaling a B2C habit-tracking app to 50k users.",
    tags: ["B2C", "Mobile"],
  },
];

export const STATIC_PROJECTS: Project[] = [
  {
    id: 1,
    name: "Supersync",
    category: "SaaS",
    description: "Automated bidirectional sync between Linear and GitHub issues.",
    builder: "Marco Rossi",
    status: "Revenue",
    statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    imageUrl: "/images/project-1.png",
    avatarUrl: "/images/avatar-1.png",
  },
  {
    id: 2,
    name: "Lumina AI",
    category: "AI",
    description: "Generative UI components from simple text prompts.",
    builder: "Sofia Bianchi",
    status: "Beta",
    statusColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    imageUrl: "/images/project-2.png",
    avatarUrl: "/images/avatar-2.png",
  },
  {
    id: 3,
    name: "BaseLayer",
    category: "Developer Tools",
    description: "Postgres database branching for instant preview environments.",
    builder: "Luca Ferrari",
    status: "Live",
    statusColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    imageUrl: "/images/project-3.png",
    avatarUrl: "/images/avatar-3.png",
  },
  {
    id: 4,
    name: "Nexus",
    category: "B2B",
    description: "CRM for specialized independent consulting agencies.",
    builder: "Giulia Romano",
    status: "MVP",
    statusColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    imageUrl: "/images/project-4.png",
    avatarUrl: "/images/avatar-4.png",
  },
  {
    id: 5,
    name: "CryptFlow",
    category: "Crypto",
    description: "Fiat-to-crypto onramp API for European merchants.",
    builder: "Alessandro Conti",
    status: "Revenue",
    statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    imageUrl: "/images/project-5.png",
    avatarUrl: "/images/avatar-5.png",
  },
  {
    id: 6,
    name: "OpenStore",
    category: "Open Source",
    description: "Self-hosted alternative to Shopify for digital creators.",
    builder: "Elena Marino",
    status: "Beta",
    statusColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    imageUrl: "/images/project-6.png",
    avatarUrl: "/images/avatar-6.png",
  },
  {
    id: 7,
    name: "Pulse",
    category: "B2C",
    description: "Real-time audience analytics for independent creators.",
    builder: "Davide Greco",
    status: "Beta",
    statusColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    imageUrl: "/images/project-7.png",
    avatarUrl: "/images/avatar-7.png",
  },
  {
    id: 8,
    name: "Forms.it",
    category: "SaaS",
    description: "An Italian-first form builder with native invoicing support.",
    builder: "Chiara Esposito",
    status: "Live",
    statusColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    imageUrl: "/images/project-8.png",
    avatarUrl: "/images/avatar-8.png",
  },
  {
    id: 9,
    name: "DevKit",
    category: "Developer Tools",
    description: "Production-ready starter kits for solo founders shipping fast.",
    builder: "Matteo Galli",
    status: "MVP",
    statusColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    imageUrl: "/images/project-9.png",
    avatarUrl: "/images/avatar-9.png",
  },
];

export const STATIC_OS_PROJECTS: OsProject[] = [
  {
    id: 1,
    title: "Builder Directory",
    description: "Discover members and what they're building.",
    status: "v1.0.0-rc",
    category: "Directory",
    icon: "Database",
    color: "text-blue-400",
  },
  {
    id: 2,
    title: "Builder Profiles",
    description: "Public profiles to showcase projects, skills and experience.",
    status: "rfc",
    category: "Profiles",
    icon: "Code2",
    color: "text-zinc-400",
  },
  {
    id: 3,
    title: "Project Showcase",
    description: "A place to launch projects, get feedback and find collaborators.",
    status: "v0.9.0",
    category: "Showcase",
    icon: "Server",
    color: "text-indigo-400",
  },
];
