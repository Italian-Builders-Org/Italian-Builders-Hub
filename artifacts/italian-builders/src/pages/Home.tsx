import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch as ToggleSwitch } from "@/components/ui/switch";
import {
  Menu,
  X,
  ArrowRight,
  Send,
  Twitter,
  Linkedin,
  Globe,
  Link as LinkIcon,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  MapPin,
  Terminal,
  Activity,
  Database,
  Server,
  Code2,
  LogOut,
} from "lucide-react";
import {
  type CommunityProject,
  type Profile,
  type Project,
  supabase,
  useSupabaseSession,
} from "@/lib/supabase";
import {
  coordsForCityCountry,
  fallbackCoordsForLocation,
  locationLabel,
} from "@/lib/geo";
import { defaultAvatarUrl } from "@/lib/assets";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: Record<string, unknown>,
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

// --- Static Data ---

const WHO_FOR = [
  {
    title: "Builders",
    description: "People building products, startups and businesses.",
    icon: Terminal,
  },
  {
    title: "Contributors",
    description: "Developers, designers, marketers and operators.",
    icon: Code2,
  },
  {
    title: "Supporters",
    description: "Mentors, advisors and people helping the ecosystem grow.",
    icon: Activity,
  },
  {
    title: "Investors",
    description: "Angels, scouts and people looking for emerging talent.",
    icon: Database,
  },
];

const ROLES = [
  "Builder",
  "Developer",
  "Designer",
  "Founder",
  "Investor",
  "Student",
  "Supporter",
  "Other",
];

const EUROPE_GEOJSON_URL = "/maps/europe-italy-vector.geojson";
const MAP_OCEAN_COLOR = "#020817";
const MAP_COUNTRY_COLOR = "rgba(30, 64, 120, 0.96)";
const MAP_ITALY_COLOR = "rgba(37, 99, 235, 0.9)";
const MAP_ITALY_STROKE = "rgba(0, 0, 0, 0)";
const MAP_PIN_COLOR = "#3b82f6";
const MAP_PIN_OUTLINE = "rgba(239, 246, 255, 0.88)";
const MAP_PIN_RING = "rgba(15, 23, 42, 0.72)";
const anonymousProfileSelect =
  "id, username, full_name, headline, bio, avatar_url, cover_url, location, city, country, latitude, longitude, email, email_public, website_url, linkedin_url, x_url, github_url, youtube_url, instagram_url, role, skills, interests, looking_for, languages, intro_video_url, visibility, platform_role, onboarding_completed, created_at, updated_at";
const turnstileScriptSrc =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as
  | string
  | undefined;

let turnstileScriptPromise: Promise<void> | null = null;

function loadTurnstileScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${turnstileScriptSrc}"]`,
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Could not load security check.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = turnstileScriptSrc;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load security check."));
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

// --- Sub-components ---

type TechLabelsContextValue = {
  techLabels: boolean;
  setTechLabels: (value: boolean) => void;
};

const TechLabelsContext = React.createContext<TechLabelsContextValue>({
  techLabels: false,
  setTechLabels: () => {},
});

export function TechLabelProvider({ children }: { children: React.ReactNode }) {
  const [techLabels, setTechLabels] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("italian-builders-label-mode") === "tech";
  });

  useEffect(() => {
    window.localStorage.setItem(
      "italian-builders-label-mode",
      techLabels ? "tech" : "friendly",
    );
  }, [techLabels]);

  return (
    <TechLabelsContext.Provider value={{ techLabels, setTechLabels }}>
      {children}
    </TechLabelsContext.Provider>
  );
}

export function useTechLabels() {
  return React.useContext(TechLabelsContext);
}

function TechLabelToggle({ compact = false }: { compact?: boolean }) {
  const { techLabels, setTechLabels } = useTechLabels();

  return (
    <label
      className={`flex items-center gap-2 text-zinc-400 ${compact ? "justify-between" : ""}`}
    >
      <span className="text-[10px] font-mono uppercase tracking-wider">
        {techLabels ? "Community labels" : "Friendly labels"}
      </span>
      <ToggleSwitch
        checked={techLabels}
        onCheckedChange={setTechLabels}
        aria-label="Toggle community labels"
        className="h-4 w-8 border border-zinc-700 bg-zinc-800 data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-zinc-800"
      />
    </label>
  );
}

type BreadcrumbLabel = {
  friendly: string;
  tech: string;
};

const breadcrumbLabels: Record<string, BreadcrumbLabel> = {
  admin: { friendly: "Admin", tech: "ADMIN" },
  "admin/community-projects": {
    friendly: "Community projects",
    tech: "COMMUNITY_PROJECTS",
  },
  "admin/community-projects/new": {
    friendly: "New community project",
    tech: "NEW_COMMUNITY_PROJECT",
  },
  "admin/invites": { friendly: "Invites", tech: "INVITES" },
  "admin/members": { friendly: "Members", tech: "MEMBERS" },
  "admin/waitlist": { friendly: "Waitlist", tech: "WAITLIST" },
  builders: { friendly: "Builders", tech: "BUILDERS" },
  "community-projects": {
    friendly: "Community projects",
    tech: "COMMUNITY_PROJECTS",
  },
  dashboard: { friendly: "Dashboard", tech: "CONSOLE" },
  "dashboard/contributions": {
    friendly: "Contributions",
    tech: "CONTRIBUTIONS",
  },
  "dashboard/profile": { friendly: "Profile", tech: "PROFILE" },
  "dashboard/projects": { friendly: "Projects", tech: "PROJECTS" },
  "dashboard/projects/new": { friendly: "New project", tech: "NEW_PROJECT" },
  invite: { friendly: "Invite", tech: "INVITE" },
  join: { friendly: "Join", tech: "ACCESS_REQUEST" },
  mission: { friendly: "Mission", tech: "MISSION" },
  "os-projects": { friendly: "Open source", tech: "OPEN_SOURCE" },
  pantheon: { friendly: "Pantheon", tech: "PANTHEON" },
  privacy: { friendly: "Privacy", tech: "PRIVACY" },
  projects: { friendly: "Projects", tech: "PROJECTS" },
  "reset-password": { friendly: "Reset password", tech: "RESET_PASSWORD" },
  terms: { friendly: "Terms", tech: "TERMS" },
};

function humanizeBreadcrumbSegment(segment: string) {
  const decoded = decodeURIComponent(segment);
  return decoded
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function dynamicBreadcrumbLabel(
  segments: string[],
  index: number,
): BreadcrumbLabel {
  const segment = decodeURIComponent(segments[index] ?? "");
  const parentPath = segments.slice(0, index).join("/");

  if (parentPath === "builders") {
    const username = segment.replace(/^@+/, "");
    return { friendly: `@${username}`, tech: `@${username}` };
  }

  if (parentPath === "dashboard/projects") {
    return { friendly: "Edit project", tech: "PROJECT_EDITOR" };
  }

  if (parentPath === "admin/community-projects") {
    return {
      friendly: "Edit community project",
      tech: "COMMUNITY_PROJECT_EDITOR",
    };
  }

  if (parentPath === "invite") {
    return { friendly: "Invitation", tech: "INVITE_TOKEN" };
  }

  const label = humanizeBreadcrumbSegment(segment);
  return { friendly: label, tech: segment.toUpperCase() };
}

function labelForBreadcrumb(
  segments: string[],
  index: number,
  techLabels: boolean,
) {
  const path = segments.slice(0, index + 1).join("/");
  const label = breadcrumbLabels[path] ?? dynamicBreadcrumbLabel(segments, index);
  return techLabels ? label.tech : label.friendly;
}

function BreadcrumbBar() {
  const [location] = useLocation();
  const { techLabels } = useTechLabels();
  const pathname = location.split(/[?#]/)[0].replace(/\/+$/, "") || "/";

  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);

  return (
    <div className="border-t border-zinc-900 bg-zinc-950/95">
      <div className="container mx-auto px-4 md:px-6">
        <Breadcrumb className="py-2">
          <BreadcrumbList className="flex-nowrap overflow-x-auto whitespace-nowrap text-[11px] font-medium text-zinc-500 dt-scrollbar sm:text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/"
                className={techLabels ? "font-mono text-zinc-400" : ""}
              >
                {techLabels ? "ROOT" : "Home"}
              </BreadcrumbLink>
            </BreadcrumbItem>
            {segments.map((segment, index) => {
              const href = `/${segments.slice(0, index + 1).join("/")}`;
              const isCurrent = index === segments.length - 1;
              const label = labelForBreadcrumb(segments, index, techLabels);

              return (
                <React.Fragment key={`${href}-${segment}`}>
                  <BreadcrumbSeparator className="text-zinc-700" />
                  <BreadcrumbItem className="min-w-0">
                    {isCurrent ? (
                      <BreadcrumbPage
                        className={`max-w-[13rem] truncate text-zinc-200 sm:max-w-none ${
                          techLabels ? "font-mono" : ""
                        }`}
                      >
                        {label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        href={href}
                        className={`max-w-[10rem] truncate text-zinc-500 hover:text-zinc-200 sm:max-w-none ${
                          techLabels ? "font-mono" : ""
                        }`}
                      >
                        {label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}

function HeaderAuthControls({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const { techLabels } = useTechLabels();
  const { user, loading } = useSupabaseSession();
  const [profile, setProfile] = useState<Pick<
    Profile,
    "username" | "full_name" | "avatar_url" | "platform_role"
  > | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      if (!supabase || !user) {
        setProfile(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("username, full_name, avatar_url, platform_role")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setProfile(
          (data as Pick<
            Profile,
            "username" | "full_name" | "avatar_url" | "platform_role"
          > | null) ?? null,
        );
      }
    }
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function signOut() {
    await supabase?.auth.signOut();
    window.location.href = "/";
  }

  const linkClass = mobile
    ? "inline-flex h-9 w-full items-center justify-center rounded-sm border border-zinc-800 bg-zinc-950 px-3 text-xs font-semibold text-zinc-200 hover:bg-zinc-900"
    : "inline-flex h-8 items-center justify-center rounded-sm border border-zinc-800 bg-zinc-950 px-3 text-xs font-semibold text-zinc-200 hover:bg-zinc-900";
  const primaryClass = mobile
    ? "inline-flex h-9 w-full items-center justify-center rounded-sm bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-500"
    : "inline-flex h-8 items-center justify-center rounded-sm bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-500";

  if (loading) {
    return <div className={mobile ? "h-9" : "h-8 w-24"} />;
  }

  if (!user) {
    return (
      <div
        className={mobile ? "flex flex-col gap-3" : "flex items-center gap-3"}
      >
        <a href="/dashboard" onClick={onNavigate} className={linkClass}>
          {techLabels ? "SIGN_IN" : "Sign in"}
        </a>
        <a href="/join" onClick={onNavigate} className={primaryClass}>
          {techLabels ? "REQUEST_ACCESS" : "Join waitlist"}
        </a>
      </div>
    );
  }

  const isAdmin =
    profile?.platform_role === "admin" || profile?.platform_role === "owner";
  const profileHref = profile?.username
    ? `/builders/${profile.username}`
    : "/dashboard/profile";

  return (
    <div className={mobile ? "flex flex-col gap-3" : "flex items-center gap-2"}>
      <a
        href={profileHref}
        onClick={onNavigate}
        className={`${linkClass} gap-2`}
      >
        <img
          src={profile?.avatar_url || defaultAvatarUrl}
          alt=""
          className="h-5 w-5 rounded-sm border border-zinc-700 object-cover"
        />
        {techLabels ? "PROFILE" : "Profile"}
      </a>
      <a href="/dashboard" onClick={onNavigate} className={primaryClass}>
        {techLabels ? "CONSOLE" : "Dashboard"}
      </a>
      {isAdmin && (
        <a href="/admin" onClick={onNavigate} className={linkClass}>
          {techLabels ? "ADMIN" : "Admin"}
        </a>
      )}
      <button type="button" onClick={signOut} className={`${linkClass} gap-2`}>
        <LogOut size={14} /> {techLabels ? "SIGN_OUT" : "Sign out"}
      </button>
    </div>
  );
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { techLabels } = useTechLabels();
  const navLabelClass = `text-xs text-zinc-500 hover:text-zinc-100 transition-colors ${techLabels ? "font-mono uppercase" : "font-medium"}`;
  const mobileNavClass = `text-sm text-zinc-400 ${techLabels ? "font-mono uppercase" : "font-medium"}`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
      <div className="container mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center">
          <img
            src="/logo-vector.svg"
            alt="Italian Builders"
            className="dt-logo"
          />
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="/builders" className={navLabelClass}>
            {techLabels ? "/builders" : "Builders"}
          </a>
          <a href="/projects" className={navLabelClass}>
            {techLabels ? "/projects" : "Projects"}
          </a>
          <a href="/community-projects" className={navLabelClass}>
            {techLabels ? "/community-projects" : "Community projects"}
          </a>
          <a href="/pantheon" className={navLabelClass}>
            {techLabels ? "/pantheon" : "Pantheon"}
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <TechLabelToggle />
          <HeaderAuthControls />
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-1.5 text-zinc-400 hover:text-zinc-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-4 space-y-4">
          <nav className="flex flex-col space-y-3">
            <a
              href="/builders"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavClass}
            >
              {techLabels ? "/builders" : "Builders"}
            </a>
            <a
              href="/projects"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavClass}
            >
              {techLabels ? "/projects" : "Projects"}
            </a>
            <a
              href="/community-projects"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavClass}
            >
              {techLabels ? "/community-projects" : "Community projects"}
            </a>
            <a
              href="/pantheon"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavClass}
            >
              {techLabels ? "/pantheon" : "Pantheon"}
            </a>
          </nav>
          <div className="pt-4 border-t border-zinc-800 flex flex-col gap-3">
            <TechLabelToggle compact />
            <HeaderAuthControls
              mobile
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}
      <BreadcrumbBar />
    </header>
  );
}

type GlobePoint = {
  lat: number;
  lng: number;
  color: string;
  radius: number;
};

export type HomeMapBuilder = {
  id: string | number;
  name: string;
  username?: string;
  role: string;
  location: string;
  avatarUrl: string;
  highlight: string;
  tags: string[];
  lat: number;
  lng: number;
};

function validCoordinate(lat?: number | null, lng?: number | null) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function profileMapCoords(
  profile: Pick<
    Profile,
    "latitude" | "longitude" | "city" | "country" | "location"
  >,
) {
  if (validCoordinate(profile.latitude, profile.longitude)) {
    return [profile.latitude, profile.longitude] as [number, number];
  }
  return (
    coordsForCityCountry(profile.city, profile.country) ||
    fallbackCoordsForLocation(profile.location)
  );
}

function profileToMapBuilder(profile: Profile): HomeMapBuilder | null {
  const coords = profileMapCoords(profile);
  if (!coords) return null;

  return {
    id: profile.id,
    name: profile.full_name,
    username: profile.username,
    role: profile.headline || profile.role || "Builder",
    location: profileLocationLabel(profile),
    avatarUrl: profile.avatar_url || defaultAvatarUrl,
    highlight: profile.bio || "Building in the Italian Builders community.",
    tags: profile.skills?.length
      ? profile.skills.slice(0, 3)
      : [profile.role || "Builder"].filter(Boolean),
    lat: coords[0],
    lng: coords[1],
  };
}

type HomeDatabaseContent = {
  profiles: Profile[];
  projects: Project[];
  communityProjects: CommunityProject[];
  counts: {
    builders: number;
    projects: number;
    communityProjects: number;
  };
  loading: boolean;
  error: string | null;
};

const emptyHomeDatabaseContent: HomeDatabaseContent = {
  profiles: [],
  projects: [],
  communityProjects: [],
  counts: {
    builders: 0,
    projects: 0,
    communityProjects: 0,
  },
  loading: true,
  error: null,
};

function getSupabaseErrorMessage(
  error: { message?: string } | null | undefined,
) {
  return error?.message ?? null;
}

function useHomeDatabaseContent() {
  const [content, setContent] = useState<HomeDatabaseContent>(
    emptyHomeDatabaseContent,
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!supabase) {
        setContent({
          ...emptyHomeDatabaseContent,
          loading: false,
          error: "Database is not configured for this environment.",
        });
        return;
      }

      const [profileResponse, projectResponse, communityProjectResponse] =
        await Promise.all([
          supabase
            .from("profiles")
            .select(anonymousProfileSelect, { count: "exact" })
            .eq("visibility", "public")
            .order("created_at", { ascending: false })
            .limit(80),
          supabase
            .from("projects")
            .select(
              "*, profiles(username, full_name, avatar_url, headline), project_members(id), project_category_tags(position, project_categories(id, slug, name, group_name, sort_order, is_active, created_at, updated_at))",
              { count: "exact" },
            )
            .eq("is_public", true)
            .order("created_at", { ascending: false })
            .limit(24),
          supabase
            .from("community_projects")
            .select("*, community_project_members(id)", { count: "exact" })
            .eq("is_public", true)
            .order("created_at", { ascending: false })
            .limit(12),
        ]);

      if (cancelled) return;

      const error =
        getSupabaseErrorMessage(profileResponse.error) ||
        getSupabaseErrorMessage(projectResponse.error) ||
        getSupabaseErrorMessage(communityProjectResponse.error);

      const profiles = (profileResponse.data as Profile[] | null) ?? [];
      const projects = (projectResponse.data as Project[] | null) ?? [];
      const communityProjects =
        (communityProjectResponse.data as CommunityProject[] | null) ?? [];

      setContent({
        profiles,
        projects,
        communityProjects,
        counts: {
          builders: profileResponse.count ?? profiles.length,
          projects: projectResponse.count ?? projects.length,
          communityProjects:
            communityProjectResponse.count ?? communityProjects.length,
        },
        loading: false,
        error,
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return content;
}

function profileRole(profile: Profile) {
  return profile.headline || profile.role || "Builder";
}

function profileLocationLabel(profile: Profile) {
  return locationLabel({
    city: profile.city,
    country: profile.country,
    fallback: profile.location,
  });
}

function profileTags(profile: Profile) {
  const tags = profile.skills?.length
    ? profile.skills
    : [profile.role, profile.city].filter(Boolean);
  return tags.slice(0, 3) as string[];
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function projectCategoryLabels(
  project: Pick<Project, "category" | "project_category_tags">,
) {
  const relationLabels =
    project.project_category_tags
      ?.slice()
      .sort((a, b) => a.position - b.position)
      .map((tag) => tag.project_categories?.name)
      .filter(Boolean) ?? [];
  const labels = relationLabels.length
    ? relationLabels
    : [project.category].filter(Boolean);
  return Array.from(new Set(labels)).slice(0, 6) as string[];
}

function statusColor(status: string) {
  switch (status) {
    case "revenue":
    case "completed":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "live":
    case "active":
      return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    case "beta":
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
    case "idea":
    case "building":
    case "proposed":
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    case "paused":
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/30";
    default:
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/30";
  }
}

function communityProjectIcon(project: CommunityProject) {
  const category = project.category?.toLowerCase() ?? "";
  if (category.includes("data") || category.includes("directory"))
    return Database;
  if (category.includes("infra") || category.includes("server")) return Server;
  if (project.status === "active") return Activity;
  return Code2;
}

function communityProjectColor(project: CommunityProject) {
  if (project.status === "completed") return "text-emerald-400";
  if (project.status === "active") return "text-blue-400";
  if (project.status === "paused") return "text-zinc-400";
  return "text-amber-400";
}

function DatabaseStatusBanner({ error }: { error: string | null }) {
  const { techLabels } = useTechLabels();
  if (!error) return null;

  return (
    <section className="bg-zinc-950 border-b border-zinc-800">
      <div className="container mx-auto px-4 md:px-6 py-4">
        <div className="dt-card border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          {techLabels
            ? `DATABASE_READ_WARNING: ${error}`
            : `Database read warning: ${error}`}
        </div>
      </div>
    </section>
  );
}

export function BuilderGlobe({
  builders,
  activeBuilder,
}: {
  builders: HomeMapBuilder[];
  activeBuilder: HomeMapBuilder | null;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const activeBuilderRef = useRef(activeBuilder);
  const buildersRef = useRef(builders);

  const pointData = (
    allBuilders: HomeMapBuilder[],
    active: HomeMapBuilder | null,
  ): GlobePoint[] => {
    const base = allBuilders.map((builder) => ({
      lat: builder.lat,
      lng: builder.lng,
      color: builder.id === active?.id ? MAP_PIN_OUTLINE : MAP_PIN_COLOR,
      radius: builder.id === active?.id ? 0.17 : 0.075,
    }));

    return active
      ? [
          ...base,
          {
            lat: active.lat,
            lng: active.lng,
            color: MAP_PIN_COLOR,
            radius: 0.12,
          },
        ]
      : base;
  };

  const activeRing = (builder: HomeMapBuilder | null): GlobePoint[] => {
    return builder
      ? [
          {
            lat: builder.lat,
            lng: builder.lng,
            color: MAP_PIN_RING,
            radius: 0.12,
          },
        ]
      : [];
  };

  useEffect(() => {
    activeBuilderRef.current = activeBuilder;
    buildersRef.current = builders;
    globeRef.current?.pointsData(pointData(builders, activeBuilder));
    globeRef.current?.ringsData(activeRing(activeBuilder));
  }, [builders, activeBuilder]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let scene: any = null;
    let renderer: any = null;
    let resizeObserver: ResizeObserver | null = null;
    let removeScrollListener: (() => void) | null = null;
    let targetScroll = 0;
    let easedScroll = 0;
    let frame = 0;
    let disposed = false;

    Promise.all([import("three"), import("three-globe")]).then(
      ([THREE, threeGlobeModule]) => {
        if (disposed) return;

        const ThreeGlobe = threeGlobeModule.default;
        scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(18, 1, 0.1, 1200);
        camera.position.set(0, 0, 160);

        try {
          renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        } catch {
          scene.clear();
          return;
        }
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.domElement.style.display = "block";
        renderer.domElement.style.position = "relative";
        renderer.domElement.style.zIndex = "0";
        renderer.domElement.style.pointerEvents = "none";
        host.appendChild(renderer.domElement);

        const globe = new ThreeGlobe({
          waitForGlobeReady: false,
          animateIn: false,
        })
          .showAtmosphere(true)
          .atmosphereColor("#3b82f6")
          .atmosphereAltitude(0.11)
          .globeCurvatureResolution(2)
          .pointsData(pointData(buildersRef.current, activeBuilderRef.current))
          .pointLat("lat")
          .pointLng("lng")
          .pointColor("color")
          .pointAltitude(0.013)
          .pointRadius("radius")
          .pointResolution(16)
          .pointsMerge(false)
          .pointsTransitionDuration(600)
          .ringsData(activeRing(activeBuilderRef.current))
          .ringLat("lat")
          .ringLng("lng")
          .ringColor("color")
          .ringMaxRadius(0.95)
          .ringPropagationSpeed(0.38)
          .ringRepeatPeriod(1400)
          .polygonsData([])
          .polygonCapColor((feature: any) =>
            feature.properties?.ISO_A2 === "IT"
              ? MAP_ITALY_COLOR
              : MAP_COUNTRY_COLOR,
          )
          .polygonSideColor((feature: any) =>
            feature.properties?.ISO_A2 === "IT"
              ? "rgba(37, 99, 235, 0.18)"
              : "rgba(30, 58, 104, 0.1)",
          )
          .polygonStrokeColor((feature: any) =>
            feature.properties?.ISO_A2 === "IT"
              ? MAP_ITALY_STROKE
              : "rgba(0, 0, 0, 0)",
          )
          .polygonAltitude((feature: any) =>
            feature.properties?.ISO_A2 === "IT" ? 0.007 : 0.004,
          )
          .polygonCapCurvatureResolution(1);

        globeRef.current = globe;
        scene.add(globe);

        globe.globeMaterial(
          new THREE.MeshBasicMaterial({ color: MAP_OCEAN_COLOR }),
        );

        const ambient = new THREE.AmbientLight(0xb8c5d9, 2.2);
        const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
        keyLight.position.set(-90, 80, 140);
        const rimLight = new THREE.DirectionalLight(0x3b82f6, 1.6);
        rimLight.position.set(120, -40, -80);
        scene.add(ambient, keyLight, rimLight);

        const italyCoords = globe.getCoords(42.85, 12.45, 0);
        const italyVector = new THREE.Vector3(
          italyCoords.x,
          italyCoords.y,
          italyCoords.z,
        ).normalize();
        const italyTargetVector = new THREE.Vector3(0, 0.02, 1).normalize();
        const baseQuaternion = new THREE.Quaternion().setFromUnitVectors(
          italyVector,
          italyTargetVector,
        );
        const scrollQuaternion = new THREE.Quaternion();
        const driftQuaternion = new THREE.Quaternion();
        const xAxis = new THREE.Vector3(1, 0, 0);
        const yAxis = new THREE.Vector3(0, 1, 0);

        const resize = () => {
          const width = host.clientWidth || 720;
          const height = host.clientHeight || 520;
          renderer.setSize(width, height);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };

        const updateScroll = () => {
          const panel = host.closest("[data-globe-panel]");
          const rect =
            panel?.getBoundingClientRect() ?? host.getBoundingClientRect();
          const viewport = window.innerHeight || 1;
          const centerDelta =
            (rect.top + rect.height / 2 - viewport / 2) / viewport;
          targetScroll = Math.max(-1, Math.min(1, centerDelta));
        };

        const animate = () => {
          if (disposed) return;
          easedScroll += (targetScroll - easedScroll) * 0.06;
          const scrollAmount = Math.abs(easedScroll);
          const time = performance.now() * 0.00035;

          scrollQuaternion.setFromAxisAngle(xAxis, easedScroll * 0.045);
          driftQuaternion.setFromAxisAngle(yAxis, Math.sin(time) * 0.018);
          globe.quaternion
            .copy(scrollQuaternion)
            .multiply(driftQuaternion)
            .multiply(baseQuaternion);
          camera.position.z = 160 + scrollAmount * 105;

          renderer.render(scene, camera);
          frame = requestAnimationFrame(animate);
        };

        fetch(EUROPE_GEOJSON_URL)
          .then((res) =>
            res.ok
              ? res.json()
              : Promise.reject(new Error(`GeoJSON ${res.status}`)),
          )
          .then((europe) => {
            if (disposed) return;
            globe.polygonsData(europe.features ?? []);
          })
          .catch(() => {
            globe.polygonsData([]);
          });

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        window.addEventListener("scroll", updateScroll, { passive: true });
        removeScrollListener = () =>
          window.removeEventListener("scroll", updateScroll);
        resize();
        updateScroll();
        animate();
      },
    ).catch(() => {
      globeRef.current = null;
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      removeScrollListener?.();
      globeRef.current = null;
      if (renderer?.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
      renderer?.dispose();
      scene?.clear();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="relative z-0 h-full w-full overflow-hidden"
    />
  );
}

function Hero({ content }: { content: HomeDatabaseContent }) {
  const builders = useMemo(
    () =>
      content.profiles
        .map(profileToMapBuilder)
        .filter(Boolean) as HomeMapBuilder[],
    [content.profiles],
  );
  const stats = [
    { label: "Builders", value: formatCount(content.counts.builders) },
    { label: "Projects", value: formatCount(content.counts.projects) },
    {
      label: "Initiatives",
      value: formatCount(content.counts.communityProjects),
    },
  ];
  const { techLabels } = useTechLabels();

  const [active, setActive] = useState(0);

  useEffect(() => {
    if (builders.length === 0) return;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % builders.length);
    }, 2600);
    return () => clearInterval(id);
  }, [builders.length]);

  useEffect(() => {
    if (active >= builders.length) setActive(0);
  }, [active, builders.length]);

  const current = builders.length > 0 ? builders[active] : null;
  const avatarStack = content.profiles.slice(0, 3);
  const builderCountLabel = content.loading
    ? "Loading builders..."
    : `${formatCount(content.counts.builders)} builders indexed`;

  return (
    <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 border-b border-zinc-800 overflow-hidden bg-zinc-950">
      <div className="absolute inset-0 dt-grid-bg opacity-[0.6] pointer-events-none" />
      <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 xl:gap-16 items-center">
          <div className="flex-1 lg:flex-[0.9] max-w-2xl">
            <h1 className="text-[4.25rem] md:text-[7.5rem] font-black text-zinc-100 mb-8 leading-[0.92]">
              Connecting
              <br />
              the people
              <br />
              who <span className="text-blue-500 uppercase">build.</span>
            </h1>

            <p className="text-base md:text-lg text-zinc-400 mb-8 max-w-xl leading-relaxed">
              Italian Builders exists to help founders, developers, designers
              and makers discover each other, share projects and create
              opportunities.
              <br />
              <br />
              From AI and open source to SaaS, mobile apps and startups, what
              unites us is not what we build, but the fact that we choose to
              build.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <a
                href="#join"
                className="inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white font-mono uppercase text-xs dt-button rounded-sm w-full sm:w-auto"
              >
                {techLabels ? "REQUEST_ACCESS" : "Join Waitlist"}{" "}
                <ArrowRight size={16} className="ml-2" />
              </a>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
              <div className="flex -space-x-1">
                {avatarStack.map((profile) => (
                  <img
                    key={profile.id}
                    src={profile.avatar_url || defaultAvatarUrl}
                    className="w-6 h-6 border border-zinc-700 rounded-sm object-cover"
                    alt={profile.full_name}
                  />
                ))}
              </div>
              <div className="h-4 w-px bg-zinc-700" />
              <p>{builderCountLabel}</p>
            </div>
          </div>

          <div className="w-full lg:flex-[1.18] lg:max-w-none">
            <div className="dt-card isolate p-3 relative overflow-hidden">
              <div className="absolute inset-0 dt-grid-bg opacity-40 pointer-events-none" />

              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">
                  {techLabels ? "NODE_MAP" : "Builder map"}
                </span>
                <span className="text-[10px] font-mono text-blue-400 uppercase flex items-center gap-1">
                  <MapPin size={10} /> Italia
                </span>
              </div>

              <div
                data-globe-panel
                className="relative h-[330px] w-full sm:h-[420px] lg:h-[520px] xl:h-[590px]"
              >
                <BuilderGlobe builders={builders} activeBuilder={current} />

                {current && (
                  <div className="absolute bottom-2 left-2 right-2 z-20">
                    <div className="dt-card bg-zinc-950/80 backdrop-blur-sm p-2.5 flex items-center gap-3">
                      <img
                        src={current.avatarUrl}
                        alt={current.name}
                        className="w-8 h-8 object-cover border border-zinc-700 grayscale rounded-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          {current.username ? (
                            <a
                              href={`/builders/${current.username}`}
                              className="truncate text-xs font-bold text-zinc-100 hover:text-blue-300"
                            >
                              {current.name}
                            </a>
                          ) : (
                            <span className="truncate text-xs font-bold text-zinc-100">
                              {current.name}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 truncate">
                          {current.role} · {current.location}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-600 shrink-0">
                        {String(active + 1).padStart(2, "0")}/{builders.length}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-px mt-3 dt-border bg-zinc-800 relative z-10">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-zinc-950 px-3 py-2.5 text-center"
                  >
                    <div className="text-sm font-bold text-zinc-100">
                      {stat.value}
                    </div>
                    <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturedBuilders({
  profiles,
  loading,
}: {
  profiles: Profile[];
  loading: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { techLabels } = useTechLabels();

  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  );

  // Safe offset calculation
  const offset = profiles.length > 0 ? dayOfYear % profiles.length : 0;
  const todaysBuilders =
    profiles.length > 0
      ? [...profiles.slice(offset), ...profiles.slice(0, offset)]
      : [];

  const formattedDate = now.toISOString().split("T")[0];

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  return (
    <section
      id="builders"
      className="py-20 bg-zinc-950 border-b border-zinc-800"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <div className="text-xs font-mono text-blue-400 mb-2 font-semibold tracking-wider">
              {techLabels
                ? `DAILY_BUILDER_SET --date=${formattedDate}`
                : "Featured builders"}
            </div>
            <h2 className="text-3xl font-bold text-zinc-50 mb-2">
              Builder Highlights
            </h2>
            <p className="text-sm text-zinc-500 font-mono">
              {techLabels
                ? "Active nodes building products, startups and experiments across Italy."
                : "People building products, startups and experiments across Italy."}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition-colors rounded-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition-colors rounded-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="relative">
          {loading ? (
            <div className="dt-card p-6 text-sm font-mono text-zinc-500">
              {techLabels ? "LOADING_BUILDERS..." : "Loading builders..."}
            </div>
          ) : todaysBuilders.length === 0 ? (
            <div className="dt-card p-6 text-sm font-mono text-zinc-500">
              {techLabels ? "NO_PUBLIC_PROFILES" : "No public builders yet."}
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto dt-scrollbar snap-x snap-mandatory scroll-smooth pb-4"
            >
              {todaysBuilders.map((profile, i) => (
                <div
                  key={`${profile.id}-${i}`}
                  className="snap-start flex-shrink-0 w-80 dt-card p-5 flex flex-col group"
                >
                  <div className="flex items-start mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={profile.avatar_url || defaultAvatarUrl}
                        alt={profile.full_name}
                        className="w-10 h-10 object-cover border border-zinc-700 grayscale rounded-sm"
                      />
                      <div>
                        <h3 className="font-bold text-sm text-zinc-100">
                          {profile.full_name}
                        </h3>
                        <div className="text-xs font-mono text-zinc-500">
                          {profileRole(profile)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3 line-clamp-3 flex-grow border-l-2 border-zinc-700 pl-3 text-sm leading-relaxed text-zinc-300">
                    "
                    {profile.bio ||
                      "Building in the Italian Builders community."}
                    "
                  </div>

                  <div className="mb-4 flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 uppercase">
                    <MapPin size={10} /> {profileLocationLabel(profile)}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
                    {profileTags(profile).map((tag) => (
                      <span
                        key={tag}
                        className="dt-tag px-1.5 py-0.5 border border-zinc-800 bg-zinc-900 text-[10px] text-zinc-400 rounded-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-between h-8 rounded-sm border border-zinc-800 text-xs font-mono uppercase bg-zinc-900 hover:bg-zinc-800 hover:text-zinc-100 text-zinc-400"
                  >
                    <a href={`/builders/${profile.username}`}>
                      {techLabels ? "OPEN_PROFILE" : "View profile"}
                      <ArrowRight
                        size={14}
                        className="text-zinc-500 group-hover:text-zinc-200 transition-colors"
                      />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function BuilderProjects({
  projects,
  loading,
}: {
  projects: Project[];
  loading: boolean;
}) {
  // Use category filter query if active !== "All"
  const [active, setActive] = useState("All");
  const [showAll, setShowAll] = useState(false);
  const { techLabels } = useTechLabels();

  const categories = useMemo(
    () =>
      [
        "All",
        ...Array.from(
          new Set(projects.flatMap((project) => projectCategoryLabels(project))),
        ),
      ] as string[],
    [projects],
  );

  useEffect(() => {
    if (active !== "All" && !categories.includes(active)) {
      setActive("All");
    }
  }, [active, categories]);

  const filtered =
    active === "All"
      ? projects
      : projects.filter((project) =>
          projectCategoryLabels(project).includes(active),
        );
  const visible = showAll ? filtered : filtered.slice(0, 6);
  const hasMore = filtered.length > visible.length;

  return (
    <section
      id="projects"
      className="py-20 bg-zinc-900/40 border-b border-zinc-800"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-8">
          <div className="text-xs font-mono text-blue-400 mb-2 font-semibold tracking-wider">
            {techLabels ? "ARTIFACT_REGISTRY" : "Project showcase"}
          </div>
          <h2 className="text-3xl font-bold text-zinc-50 mb-2">
            {techLabels ? "Member Artifacts" : "Community Projects"}
          </h2>
          <p className="text-sm text-zinc-500 font-mono max-w-2xl">
            Discover products, startups, side projects and experiments created
            by members of the community.
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto dt-scrollbar pb-3 mb-6 md:flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActive(cat);
                setShowAll(false);
              }}
              className={`dt-tag px-3 py-1 text-xs border transition-colors flex-shrink-0 rounded-sm ${
                active === cat
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="dt-card p-6 text-sm font-mono text-zinc-500">
            {techLabels ? "LOADING_ARTIFACTS..." : "Loading projects..."}
          </div>
        ) : visible.length === 0 ? (
          <div className="dt-card p-6 text-sm font-mono text-zinc-500">
            {techLabels ? "NO_PUBLIC_ARTIFACTS" : "No public projects yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((project) => (
              <a
                key={project.id}
                href={`/projects/${project.slug}`}
                className="group dt-card flex flex-col"
              >
                <div className="aspect-[1200/630] w-full bg-zinc-900 border-b border-zinc-800 relative overflow-hidden">
                  {project.image_url ? (
                    <img
                      src={project.image_url}
                      alt={project.name}
                      className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                    />
                  ) : (
                    <div className="dt-grid-bg h-full opacity-50" />
                  )}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`dt-tag px-2 py-1 text-[10px] border rounded-sm ${statusColor(project.status)} backdrop-blur-sm`}
                    >
                      {project.status}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-grow">
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <h3 className="font-bold text-base text-zinc-100 leading-none">
                      {project.name}
                    </h3>
                  </div>

                  <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                    {project.tagline ||
                      project.description ||
                      "A project from the Italian Builders community."}
                  </p>

                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {projectCategoryLabels(project).map((category) => (
                      <span
                        key={category}
                        className="dt-tag text-[10px] text-zinc-500 border border-zinc-800 px-1.5 py-0.5 bg-zinc-900 rounded-sm"
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-3 border-t border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          project.profiles?.avatar_url || defaultAvatarUrl
                        }
                        alt={project.profiles?.full_name || "Builder"}
                        className="w-5 h-5 rounded-sm border border-zinc-700 grayscale"
                      />
                      <span className="text-xs font-mono text-zinc-300">
                        {project.profiles?.full_name || "Builder"}
                      </span>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-zinc-600 group-hover:text-blue-400 transition-colors"
                    />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-10 flex justify-center border-t border-zinc-800 pt-10">
            <Button
              onClick={() => setShowAll(true)}
              variant="outline"
              className="h-10 px-6 border-zinc-800 text-zinc-300 text-xs font-mono uppercase bg-zinc-950 hover:bg-zinc-900 hover:text-zinc-100 rounded-sm"
            >
              {techLabels ? "LOAD_MORE_ARTIFACTS" : "Show more projects"}{" "}
              <ChevronUp className="ml-2 rotate-180" size={14} />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

export function CommunityProjects({
  projects,
  loading,
}: {
  projects: CommunityProject[];
  loading: boolean;
}) {
  const { techLabels } = useTechLabels();

  return (
    <section
      id="os-projects"
      className="py-20 bg-zinc-950 border-b border-zinc-800"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="text-xs font-mono text-blue-400 mb-2 font-semibold tracking-wider">
            {techLabels ? "SHARED_WORKSTREAMS" : "Community initiatives"}
          </div>
          <h2 className="text-3xl font-bold text-zinc-50 mb-3">
            Community Initiatives
          </h2>
          <p className="text-sm text-zinc-500 font-mono">
            {techLabels
              ? "Shared execution tracks for discovery, collaboration and builder growth."
              : "Projects created together to help builders connect, collaborate and grow."}
          </p>
        </div>

        {loading ? (
          <div className="dt-card p-6 text-sm font-mono text-zinc-500">
            {techLabels
              ? "LOADING_WORKSTREAMS..."
              : "Loading community projects..."}
          </div>
        ) : projects.length === 0 ? (
          <div className="dt-card p-6 text-sm font-mono text-zinc-500">
            {techLabels
              ? "NO_SHARED_WORKSTREAMS"
              : "No community initiatives yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const Icon = communityProjectIcon(project);
              const memberCount =
                project.community_project_members?.length ?? 0;
              return (
                <a
                  key={project.id}
                  href={`/community-projects/${project.slug}`}
                  className="dt-card p-5 group flex flex-col hover:border-blue-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-8 h-8 rounded-sm bg-zinc-900 border border-zinc-800 flex items-center justify-center ${communityProjectColor(project)} group-hover:border-blue-500/40 transition-colors`}
                    >
                      <Icon size={16} />
                    </div>
                    <span className="dt-tag text-[10px] border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-zinc-500 rounded-sm">
                      {project.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-zinc-100 mb-2">
                    {project.name}
                  </h3>
                  <p className="text-sm text-zinc-400 mb-6 flex-grow">
                    {project.tagline ||
                      project.description ||
                      "Community initiative from Italian Builders."}
                  </p>

                  <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pt-4 border-t border-zinc-800">
                    <span className="dt-tag">
                      {project.category || "Community"}
                    </span>
                    <span className="text-blue-400 font-semibold group-hover:underline flex items-center gap-1">
                      {techLabels
                        ? `MEMBERS=${memberCount}`
                        : `${memberCount} contributors`}{" "}
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function TurnstileChallenge({
  siteKey,
  resetNonce,
  onVerify,
  onExpire,
  onError,
}: {
  siteKey: string;
  resetNonce: number;
  onVerify: (token: string) => void;
  onExpire: () => void;
  onError: (message: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const didMountRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "dark",
          callback: onVerify,
          "expired-callback": onExpire,
          "error-callback": () =>
            onError("Security check failed. Please try again."),
        });
      })
      .catch(() => {
        if (!cancelled) {
          onError("Security check could not load. Please refresh and retry.");
        }
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [onError, onExpire, onVerify, siteKey]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onExpire();
    }
  }, [onExpire, resetNonce]);

  return <div ref={containerRef} className="min-h-[65px]" />;
}

export function Join() {
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetNonce, setTurnstileResetNonce] = useState(0);
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const { techLabels } = useTechLabels();
  const formLabelClass = `text-xs text-zinc-400 ${techLabels ? "font-mono" : "font-medium"}`;
  const helperTextClass = `text-sm text-zinc-400 ${techLabels ? "font-mono" : ""}`;
  const smallHelperClass = `text-xs text-zinc-400 ${techLabels ? "font-mono" : ""}`;
  const inputClass = `bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 h-9 text-sm rounded-sm focus-visible:ring-1 focus-visible:ring-blue-500 ${techLabels ? "font-mono" : ""}`;
  const iconInputClass = `pl-8 bg-zinc-900 border-zinc-700 text-zinc-100 h-9 text-sm rounded-sm ${techLabels ? "font-mono" : ""}`;
  const buttonLabelClass = `w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white h-10 rounded-sm text-xs dt-button shadow-none disabled:opacity-50 ${techLabels ? "font-mono uppercase" : "font-semibold"}`;
  const isTurnstileConfigured = Boolean(turnstileSiteKey);
  const canSubmit = isTurnstileConfigured && Boolean(turnstileToken);

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
    setErrorMsg((current) =>
      current.includes("security check") || current.includes("Security check")
        ? ""
        : current,
    );
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken("");
  }, []);

  const handleTurnstileError = useCallback((message: string) => {
    setTurnstileToken("");
    setErrorMsg(message);
  }, []);

  useEffect(() => {
    async function loadWaitlistCount() {
      if (!supabase) return;
      const { count } = await supabase
        .from("waitlist_signups")
        .select("id", { count: "exact", head: true });
      setWaitlistCount(count ?? null);
    }
    loadWaitlistCount();
  }, [submitted]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);

    // Map empty optional fields to undefined
    const getValue = (key: string) => {
      const val = formData.get(key)?.toString();
      return val ? val.trim() : null;
    };

    try {
      if (!isTurnstileConfigured) {
        throw new Error("Security check is not configured. Please try later.");
      }
      if (!turnstileToken) {
        throw new Error("Complete the security check before submitting.");
      }

      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: String(formData.get("name") ?? "").trim(),
          email: String(formData.get("email") ?? "")
            .trim()
            .toLowerCase(),
          role: String(formData.get("role") ?? "").trim(),
          building: getValue("building"),
          telegramHandle: getValue("telegram"),
          xHandle: getValue("twitter"),
          linkedin: getValue("linkedin"),
          website: getValue("website"),
          projectUrl: getValue("project"),
          turnstileToken,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(
          payload?.error || "Could not submit the form. Please try again.",
        );
      }
      setSubmitted(true);
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Could not submit the form. Please try again.",
      );
      setTurnstileToken("");
      setTurnstileResetNonce((current) => current + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="join"
      className="py-24 bg-zinc-900 text-zinc-300 border-t-4 border-blue-600"
    >
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.86fr)_minmax(500px,1.14fr)] gap-16 lg:gap-14 xl:gap-16 items-start">
          <div>
            <div className="text-xs font-mono text-blue-400 mb-4 font-semibold tracking-wider uppercase flex items-center gap-2">
              <span>{techLabels ? "ACCESS_MATRIX" : "Who can join"}</span>
              {typeof waitlistCount === "number" && (
                <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-sm text-[10px]">
                  {techLabels
                    ? `${waitlistCount} queued`
                    : `${waitlistCount} waiting`}
                </span>
              )}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
              {techLabels ? "Request Access" : "Join the Community"}
            </h2>
            <p className={`${helperTextClass} mb-10`}>
              {techLabels
                ? "Submit your builder record. We will notify approved accounts when access opens."
                : "Tell us who you are and what you're building. We'll let you know when the platform launches."}
            </p>

            <div className="space-y-6">
              {WHO_FOR.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-sm bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={14} className="text-zinc-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-zinc-800 border border-zinc-700 p-6 sm:p-8 lg:p-9 rounded-sm dt-card relative overflow-hidden">
            {/* Terminal styling decorative top */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-zinc-900 border-b border-zinc-700 flex items-center px-3 gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/80"></div>
              <div className="w-2 h-2 rounded-full bg-amber-500/80"></div>
              <div className="w-2 h-2 rounded-full bg-green-500/80"></div>
              <span className="ml-2 text-[10px] font-mono text-zinc-500">
                {techLabels ? "ACCESS_REQUEST.form" : "Join request"}
              </span>
            </div>

            <div className="mt-4">
              {submitted ? (
                <div className="flex flex-col items-center justify-center text-center py-12 h-full">
                  <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-sm flex items-center justify-center mb-6">
                    <CheckCircle2 size={24} className="text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {techLabels ? "VERIFY_EMAIL_SENT" : "Check your email."}
                  </h3>
                  <p className={`${helperTextClass} mb-8 max-w-xs`}>
                    {techLabels
                      ? "Confirm the verification link before your builder record enters the queue."
                      : "Open the verification link we sent you. After that, your request will be added to the waitlist."}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSubmitted(false)}
                    className={`h-8 text-xs bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white rounded-sm ${techLabels ? "font-mono" : "font-semibold"}`}
                  >
                    {techLabels ? "NEW_REQUEST" : "Submit another"}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {techLabels ? "ACCESS_REQUEST" : "Join the Waitlist"}
                    </h3>
                    <p className={smallHelperClass}>
                      {techLabels
                        ? "Verify email before creating a pending builder record."
                        : "Tell us who you are and what you're building. We'll verify your email before adding you."}
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-sm mb-4">
                      <p
                        className={`text-xs text-red-400 ${techLabels ? "font-mono" : "font-medium"}`}
                      >
                        {techLabels ? "ERR:" : "Problem:"} {errorMsg}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="name" className={formLabelClass}>
                        {techLabels ? "FULL_NAME" : "Name"}{" "}
                        <span className="text-blue-400">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        placeholder="John Doe"
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="email" className={formLabelClass}>
                        {techLabels ? "EMAIL_ADDRESS" : "Email"}{" "}
                        <span className="text-blue-400">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        required
                        type="email"
                        placeholder="user@domain.com"
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="role" className={formLabelClass}>
                        {techLabels ? "ROLE_VECTOR" : "Role"}{" "}
                        <span className="text-blue-400">*</span>
                      </Label>
                      <Select required defaultValue={ROLES[0]} name="role">
                        <SelectTrigger
                          id="role"
                          className={`bg-zinc-900 border-zinc-700 text-zinc-100 h-9 text-sm rounded-sm focus:ring-1 focus:ring-blue-500 ${techLabels ? "font-mono" : ""}`}
                        >
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100 rounded-sm">
                          {ROLES.map((role) => (
                            <SelectItem
                              key={role}
                              value={role}
                              className={`focus:bg-zinc-700 focus:text-white text-xs ${techLabels ? "font-mono" : ""}`}
                            >
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="building" className={formLabelClass}>
                        {techLabels
                          ? "BUILD_CONTEXT"
                          : "What are you building?"}{" "}
                        <span className="text-zinc-600">
                          {techLabels ? "(optional)" : "(optional)"}
                        </span>
                      </Label>
                      <Input
                        id="building"
                        name="building"
                        placeholder="A short description, or 'looking for ideas'"
                        className={inputClass}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="telegram" className={formLabelClass}>
                          {techLabels ? "TELEGRAM_HANDLE" : "Telegram"}{" "}
                          <span className="text-blue-400">*</span>
                        </Label>
                        <div className="relative">
                          <Send
                            size={14}
                            className="absolute left-2.5 top-2.5 text-zinc-500"
                          />
                          <Input
                            id="telegram"
                            name="telegram"
                            required
                            placeholder="@username"
                            className={iconInputClass}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="twitter" className={formLabelClass}>
                          {techLabels ? "X_HANDLE (optional)" : "X (optional)"}
                        </Label>
                        <div className="relative">
                          <Twitter
                            size={14}
                            className="absolute left-2.5 top-2.5 text-zinc-500"
                          />
                          <Input
                            id="twitter"
                            name="twitter"
                            placeholder="@username"
                            className={iconInputClass}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="linkedin" className={formLabelClass}>
                          {techLabels
                            ? "LINKEDIN_URL (optional)"
                            : "LinkedIn (optional)"}
                        </Label>
                        <div className="relative">
                          <Linkedin
                            size={14}
                            className="absolute left-2.5 top-2.5 text-zinc-500"
                          />
                          <Input
                            id="linkedin"
                            name="linkedin"
                            placeholder="in/username"
                            className={iconInputClass}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="website" className={formLabelClass}>
                        {techLabels
                          ? "WEBSITE_URL (optional)"
                          : "Website (optional)"}
                      </Label>
                      <div className="relative">
                        <Globe
                          size={14}
                          className="absolute left-2.5 top-2.5 text-zinc-500"
                        />
                        <Input
                          id="website"
                          name="website"
                          type="url"
                          placeholder="https://..."
                          className={iconInputClass}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="project" className={formLabelClass}>
                        {techLabels
                          ? "PROJECT_URL (optional)"
                          : "Project URL (optional)"}
                      </Label>
                      <div className="relative">
                        <LinkIcon
                          size={14}
                          className="absolute left-2.5 top-2.5 text-zinc-500"
                        />
                        <Input
                          id="project"
                          name="project"
                          type="url"
                          placeholder="https://..."
                          className={iconInputClass}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-sm border border-zinc-700 bg-zinc-900/70 p-3">
                    {isTurnstileConfigured && turnstileSiteKey ? (
                      <TurnstileChallenge
                        siteKey={turnstileSiteKey}
                        resetNonce={turnstileResetNonce}
                        onVerify={handleTurnstileVerify}
                        onExpire={handleTurnstileExpire}
                        onError={handleTurnstileError}
                      />
                    ) : (
                      <p
                        className={`text-xs text-amber-300 ${techLabels ? "font-mono" : "font-medium"}`}
                      >
                        {techLabels
                          ? "SECURITY_CHECK_NOT_CONFIGURED"
                          : "Security check is not configured yet."}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || !canSubmit}
                    className={buttonLabelClass}
                  >
                    {isSubmitting
                      ? techLabels
                        ? "SUBMITTING..."
                        : "Submitting..."
                      : techLabels
                        ? "SUBMIT_ACCESS_REQUEST"
                        : "Join the Community"}
                  </Button>
                  <p
                    className={`text-[10px] text-center text-zinc-500 mt-3 ${techLabels ? "font-mono" : ""}`}
                  >
                    {techLabels
                      ? "Used only for access and launch updates."
                      : "We'll use this to keep you updated."}
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { techLabels } = useTechLabels();
  const { user, loading } = useSupabaseSession();

  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 pt-12 pb-8 text-zinc-400">
      <div className="container mx-auto px-4 md:px-6">
        <div
          className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12 ${techLabels ? "font-mono text-xs" : "text-sm"}`}
        >
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center mb-4 text-white">
              <img
                src="/logo-vector.svg"
                alt="Italian Builders"
                className="dt-logo-footer"
              />
            </div>
            <p className="text-zinc-500 mb-6 max-w-xs leading-relaxed">
              {techLabels
                ? "Builder graph for founders, developers, designers and creators operating across Italy."
                : "Connecting people who build. A community for builders, founders, developers, designers and creators across Italy."}
            </p>
            <div className="flex gap-4">
              <a
                href="https://x.com/italianbldrs"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-500 hover:text-white transition-colors"
                aria-label="X"
              >
                <Twitter size={16} />
              </a>
              <a
                href="https://www.linkedin.com/company/italian-builders-community/posts/?feedView=all"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-500 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={16} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/builders"
                  className="hover:text-white transition-colors"
                >
                  Directory
                </a>
              </li>
              <li>
                <a
                  href="/projects"
                  className="hover:text-white transition-colors"
                >
                  Showcase
                </a>
              </li>
              <li>
                <a
                  href="/community-projects"
                  className="hover:text-white transition-colors"
                >
                  {techLabels ? "/community-projects" : "Community projects"}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/mission"
                  className="hover:text-white transition-colors"
                >
                  Mission
                </a>
              </li>
              <li>
                <a
                  href="/pantheon"
                  className="hover:text-white transition-colors"
                >
                  Pantheon
                </a>
              </li>
              <li>
                <span className="flex flex-wrap items-center gap-2 text-zinc-500">
                  <span>Guides</span>
                  <span className="rounded-sm border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
                    {techLabels ? "COMING_SOON" : "Coming soon"}
                  </span>
                </span>
              </li>
              <li>
                <span className="flex flex-wrap items-center gap-2 text-zinc-500">
                  <span>Changelog</span>
                  <span className="rounded-sm border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
                    {techLabels ? "COMING_SOON" : "Coming soon"}
                  </span>
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/privacy"
                  className="hover:text-white transition-colors"
                >
                  {techLabels ? "PRIVACY_POLICY" : "Privacy policy"}
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white transition-colors">
                  {techLabels ? "TERMS_OF_SERVICE" : "Terms of service"}
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@italianbuilders.co"
                  className="hover:text-white transition-colors"
                >
                  {techLabels ? "CONTACT_ENDPOINT" : "Contact us"}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className={`pt-6 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4 ${techLabels ? "font-mono text-[10px]" : "text-xs"}`}
        >
          <p className="text-zinc-600">
            © {new Date().getFullYear()} ITALIAN BUILDERS. ALL RIGHTS RESERVED.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            {!loading && !user && (
              <a
                href="/dashboard"
                className="inline-flex h-8 items-center justify-center rounded-sm border border-zinc-800 px-3 text-xs font-semibold text-zinc-300 transition-colors hover:border-blue-500/60 hover:text-white"
              >
                {techLabels ? "MEMBER_LOGIN" : "Builders login"}
              </a>
            )}
            <TechLabelToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}

// --- Main Page Component ---

export default function Home() {
  const homeContent = useHomeDatabaseContent();

  return (
    <div className="dark-technical-theme min-h-screen">
      <Header />
      <main>
        <Hero content={homeContent} />
        <DatabaseStatusBanner error={homeContent.error} />
        <FeaturedBuilders
          profiles={homeContent.profiles}
          loading={homeContent.loading}
        />
        <BuilderProjects
          projects={homeContent.projects}
          loading={homeContent.loading}
        />
        <CommunityProjects
          projects={homeContent.communityProjects}
          loading={homeContent.loading}
        />
        <Join />
      </main>
      <Footer />
    </div>
  );
}
