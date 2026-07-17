import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  Github,
  Globe,
  Search,
  Sparkles,
} from "lucide-react";
import {
  Hp2DirectoryJoinForm,
  Hp2Footer,
  R2HeaderAuthControls,
} from "@/pages/Hp2";
import {
  Hp2MerchInterestForm,
  MERCH_CAPS,
  type MerchCapColor,
} from "@/pages/Hp2Merch";
import { PIONEERS, PIONEER_CATEGORIES, type Pioneer } from "@/data/pioneers";
import { PIONEER_MEDIA, type PioneerMediaItem } from "@/data/pioneersMedia";
import {
  STATIC_BUILDERS,
  STATIC_OS_PROJECTS,
  STATIC_PROJECTS,
  hasItems,
} from "@/data/directory";
import { defaultAvatarUrl } from "@/lib/assets";
import { supabase, useSupabaseSession } from "@/lib/supabase";
import { normalizeItalianCitySearch } from "@/lib/geo";
import { Seo, communityProjectSeo, profileSeo, projectSeo } from "@/lib/seo";
import { openCookieSettings } from "@/components/CookieConsentBanner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  CommunityProject,
  Profile,
  Project,
  ProjectLookingFor,
} from "@/lib/supabase";

const publicProfileSelect =
  "id, username, full_name, headline, bio, avatar_url, cover_url, location, city, country, latitude, longitude, province_code, email, email_public, website_url, linkedin_url, x_url, github_url, youtube_url, instagram_url, role, skills, interests, looking_for, languages, intro_video_url, visibility, platform_role, onboarding_completed, created_at, updated_at";
const projectCategoryRelationSelect =
  "project_category_tags(position, project_categories(id, slug, name, group_name, sort_order, is_active, created_at, updated_at))";
const allFilterValue = "All";

type R2SelectOption = {
  value: string;
  label: string;
};

function sortedUnique(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]),
  ).sort((a, b) => a.localeCompare(b));
}

function profileLocationOption(profile: Profile): R2SelectOption | null {
  const city = profile.city?.trim();
  if (!city) return null;

  const province = profile.province_code?.trim().toUpperCase() ?? "";
  const value = `${province || "unknown"}:${normalizeItalianCitySearch(city)}`;

  return {
    value,
    label: province ? `${city} (${province})` : city,
  };
}

function uniqueLocationOptions(options: Array<R2SelectOption | null>) {
  const seen = new Set<string>();
  return options
    .filter((option): option is R2SelectOption => Boolean(option))
    .filter((option) => {
      if (seen.has(option.value)) return false;
      seen.add(option.value);
      return true;
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

function profileMatchesLocation(
  profile: Profile,
  province: string,
  city: string,
) {
  if (
    province !== allFilterValue &&
    profile.province_code?.toUpperCase() !== province
  ) {
    return false;
  }

  if (city !== allFilterValue) {
    return profileLocationOption(profile)?.value === city;
  }

  return true;
}

const r2PrimaryLinks = [
  { href: "/builders", label: "Builders" },
  { href: "/projects", label: "Projects" },
  { href: "/community-projects", label: "Community projects" },
  { href: "/content", label: "Content" },
  { href: "/os-projects", label: "Open source" },
  { href: "/pantheon", label: "Pantheon" },
  { href: "/merch", label: "Merch" },
  { href: "/mission", label: "Mission" },
];

const missionParagraphs = [
  "Italian Builders exists to connect people who build.",
  "Our goal is to create the home for Italian builders of all ages and experience levels, a place where ideas, projects, knowledge, and opportunities can be shared.",
  "We believe talent is not the problem.",
  "Across Italy, developers, designers, founders, creators, researchers, and entrepreneurs are building remarkable products, companies, and technologies every day. Too often, however, these people remain isolated, work alone, or never meet the collaborators, partners, investors, or friends who could help them take the next step.",
  "Our mission is to make those connections easier, more frequent, and more natural.",
  "We want to create a space where people can meet, share what they are building, exchange ideas, collaborate, and bring new projects to life together.",
  "We believe the best opportunities are born from relationships, and that great projects are often the result of the right people meeting at the right time.",
  "Whether it's software, startups, open-source projects, artificial intelligence, hardware, content, automation, or any other form of creation, what unites us is not what we build.",
  "What unites us is that we choose to build.",
];

function R2Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="hp2-page hp2-subpage">
      <header className="hp2-mast">
        <a href="/" className="hp2-logo-link" aria-label="Italian Builders">
          <img src="/logo-vector-dark-mattoni.svg" alt="Italian Builders" />
        </a>
        <nav aria-label="Primary navigation">
          {r2PrimaryLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          <R2HeaderAuthControls />
        </nav>
      </header>
      <R2BreadcrumbBar />
      <main>{children}</main>
      <Hp2Footer />
    </div>
  );
}

function R2BreadcrumbBar() {
  const [location] = useLocation();
  const pathname = location.split(/[?#]/)[0].replace(/\/+$/, "") || "/";

  if (pathname === "/") return null;

  const segments = pathname.replace(/^\/+/, "").split("/").filter(Boolean);

  return (
    <div className="hp2-breadcrumbs">
      <a href="/">Home</a>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const label = decodeURIComponent(segment)
          .replace(/[-_]+/g, " ")
          .replace(/\b\w/g, (character) => character.toUpperCase());
        const isCurrent = index === segments.length - 1;

        return (
          <span key={href}>
            <span aria-hidden="true">/</span>
            {isCurrent ? <strong>{label}</strong> : <a href={href}>{label}</a>}
          </span>
        );
      })}
    </div>
  );
}

function R2Hero({
  label,
  title,
  copy,
  meta,
}: {
  label: string;
  title: string;
  copy: string;
  meta?: React.ReactNode;
}) {
  return (
    <section className="hp2-subhero">
      <div>
        <p className="hp2-subhero-label">{label}</p>
        <h1 className="css-text-balance">{title}</h1>
      </div>
      <div className="hp2-subhero-side">
        <p className="css-text-balance">{copy}</p>
        {meta}
      </div>
    </section>
  );
}

function R2Loading({ label = "Loading..." }: { label?: string }) {
  return <div className="hp2-state">{label}</div>;
}

function R2Empty({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="hp2-state">
      <strong>{title}</strong>
      <span>{copy}</span>
    </div>
  );
}

function R2Search({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="hp2-filterbar">
      <label className="hp2-search-field">
        <Search size={16} />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      </label>
      {children}
    </div>
  );
}

function R2Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<string | R2SelectOption>;
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => {
        const value = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

function R2Tags({ items }: { items?: (string | null | undefined)[] }) {
  const tags = (items ?? []).filter(Boolean).slice(0, 6) as string[];
  if (tags.length === 0) return null;
  return (
    <div className="hp2-tags">
      {tags.map((tag) => (
        <span key={tag}>{tag}</span>
      ))}
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function normalizeExternalUrl(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
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

function cleanLookingForItems(items?: ProjectLookingFor[] | null) {
  return (items ?? [])
    .map((item) => ({
      tag: String(item?.tag ?? "").trim(),
      message: String(item?.message ?? "").trim(),
    }))
    .filter((item) => item.tag.length > 0)
    .slice(0, 6);
}

function profileLocation(
  profile: Pick<Profile, "city" | "country" | "location">,
) {
  return (
    [profile.city, profile.country].filter(Boolean).join(", ") ||
    profile.location ||
    "Italy"
  );
}

function useR2Profiles() {
  const { user, loading: sessionLoading } = useSupabaseSession();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (sessionLoading) return;
      if (!supabase) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const visibleStatuses = user?.id ? ["public", "members"] : ["public"];
      const { data } = await supabase
        .from("profiles")
        .select(publicProfileSelect)
        .in("visibility", visibleStatuses)
        .order("created_at", { ascending: false });
      setProfiles((data as Profile[] | null) ?? []);
      setLoading(false);
    }
    load();
  }, [sessionLoading, user?.id]);

  return { profiles, loading, user };
}

function useR2Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("projects")
        .select(
          `*, profiles(username, full_name, avatar_url, headline), project_members(id), ${projectCategoryRelationSelect}`,
        )
        .eq("is_public", true)
        .order("created_at", { ascending: false });
      setProjects((data as Project[] | null) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return { projects, loading };
}

function useR2CommunityProjects() {
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("community_projects")
        .select("*, community_project_members(id)")
        .eq("is_public", true)
        .order("created_at", { ascending: false });
      setProjects((data as CommunityProject[] | null) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return { projects, loading };
}

export function Hp2BuildersPage() {
  const { profiles, loading, user } = useR2Profiles();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState(allFilterValue);
  const [province, setProvince] = useState(allFilterValue);
  const [city, setCity] = useState(allFilterValue);
  const [skill, setSkill] = useState(allFilterValue);
  const [need, setNeed] = useState(allFilterValue);
  const memberDiscoveryEnabled = Boolean(user?.id);
  const fallbackBuilders =
    profiles.length === 0 && !loading ? STATIC_BUILDERS : [];
  const roles = useMemo(
    () => sortedUnique(profiles.map((profile) => profile.role)),
    [profiles],
  );
  const provinces = useMemo(
    () =>
      sortedUnique(
        profiles.map((profile) => profile.province_code?.toUpperCase()),
      ),
    [profiles],
  );
  const cities = useMemo(() => {
    const candidates =
      province === allFilterValue
        ? profiles
        : profiles.filter(
            (profile) => profile.province_code?.toUpperCase() === province,
          );
    return uniqueLocationOptions(candidates.map(profileLocationOption));
  }, [profiles, province]);
  const skills = useMemo(
    () => sortedUnique(profiles.flatMap((profile) => profile.skills ?? [])),
    [profiles],
  );
  const needs = useMemo(
    () =>
      sortedUnique(profiles.flatMap((profile) => profile.looking_for ?? [])),
    [profiles],
  );

  useEffect(() => {
    setCity(allFilterValue);
  }, [province]);

  const filteredProfiles = profiles.filter((profile) => {
    const normalizedQuery = query.toLowerCase();
    const haystack =
      `${profile.full_name} ${profile.username} ${profile.headline ?? ""} ${profile.bio ?? ""} ${profile.city ?? ""} ${profile.province_code ?? ""} ${profile.skills?.join(" ") ?? ""} ${profile.looking_for?.join(" ") ?? ""}`.toLowerCase();
    const matchesMemberFilters =
      !memberDiscoveryEnabled ||
      (profileMatchesLocation(profile, province, city) &&
        (skill === allFilterValue || profile.skills?.includes(skill)) &&
        (need === allFilterValue || profile.looking_for?.includes(need)));

    return (
      haystack.includes(normalizedQuery) &&
      (role === allFilterValue || profile.role === role) &&
      matchesMemberFilters
    );
  });
  const hasActiveFilters =
    query.trim().length > 0 ||
    role !== allFilterValue ||
    province !== allFilterValue ||
    city !== allFilterValue ||
    skill !== allFilterValue ||
    need !== allFilterValue;

  return (
    <R2Shell>
      <R2Hero
        label="Directory"
        title="Find Italian builders."
        copy={
          memberDiscoveryEnabled
            ? "Community-visible member records with location, skills, collaboration signals, and the work people are building now."
            : "Public member records, photos where available, location, skills, and the work people are building now."
        }
        meta={
          <div className="hp2-substats">
            <span>{profiles.length || STATIC_BUILDERS.length} builders</span>
            <span>{roles.length} roles</span>
          </div>
        }
      />
      <section className="hp2-list-section">
        <R2Search
          value={query}
          onChange={setQuery}
          placeholder="Search builders, cities, skills..."
        >
          <R2Select
            value={role}
            onChange={setRole}
            options={[
              { value: allFilterValue, label: "All roles" },
              ...roles.map((item) => ({ value: item, label: item })),
            ]}
          />
          {memberDiscoveryEnabled && (
            <>
              <R2Select
                value={province}
                onChange={setProvince}
                options={[
                  { value: allFilterValue, label: "All provinces" },
                  ...provinces.map((item) => ({ value: item, label: item })),
                ]}
              />
              <R2Select
                value={city}
                onChange={setCity}
                options={[
                  { value: allFilterValue, label: "All comuni" },
                  ...cities,
                ]}
              />
              <R2Select
                value={skill}
                onChange={setSkill}
                options={[
                  { value: allFilterValue, label: "All skills" },
                  ...skills.map((item) => ({ value: item, label: item })),
                ]}
              />
              <R2Select
                value={need}
                onChange={setNeed}
                options={[
                  { value: allFilterValue, label: "All needs" },
                  ...needs.map((item) => ({ value: item, label: item })),
                ]}
              />
            </>
          )}
        </R2Search>
        {loading ? (
          <R2Loading label="Loading builders..." />
        ) : filteredProfiles.length > 0 ? (
          <div className="hp2-card-grid">
            {filteredProfiles.map((profile) => (
              <a
                key={profile.id}
                className="hp2-person-card"
                href={`/builders/${profile.username}`}
              >
                <div className="hp2-person-card-head">
                  <img
                    src={profile.avatar_url || defaultAvatarUrl}
                    alt={profile.full_name}
                  />
                  <div>
                    <h2>{profile.full_name}</h2>
                    <p>@{profile.username}</p>
                  </div>
                </div>
                <p className="hp2-person-card-role">
                  {profile.headline || profile.role || "Builder"}
                </p>
                <p className="hp2-person-card-meta">
                  {profileLocation(profile)}
                  {profile.province_code ? ` · ${profile.province_code}` : ""}
                </p>
                <p className="hp2-person-card-bio">
                  {profile.bio || "This member has not added a bio yet."}
                </p>
                <R2Tags items={profile.skills} />
                {memberDiscoveryEnabled &&
                  (profile.looking_for?.length ?? 0) > 0 && (
                    <R2Tags items={profile.looking_for} />
                  )}
                <span className="hp2-person-card-action">
                  View profile <ArrowRight size={13} />
                </span>
              </a>
            ))}
          </div>
        ) : fallbackBuilders.length > 0 ? (
          <div className="hp2-card-grid">
            {fallbackBuilders.map((builder) => (
              <article key={builder.id} className="hp2-person-card">
                <div className="hp2-person-card-head">
                  <img src={builder.avatarUrl} alt={builder.name} />
                  <div>
                    <h2>{builder.name}</h2>
                    <p>{builder.location}</p>
                  </div>
                </div>
                <p className="hp2-person-card-role">{builder.role}</p>
                <p className="hp2-person-card-bio">{builder.highlight}</p>
                <R2Tags items={builder.tags} />
              </article>
            ))}
          </div>
        ) : (
          <R2Empty
            title={
              hasActiveFilters ? "No matching builders" : "No builders yet"
            }
            copy={
              hasActiveFilters
                ? "Try another city, provincia, skill, or search query."
                : "Once invited members complete onboarding, they will appear here."
            }
          />
        )}
      </section>
    </R2Shell>
  );
}

export function Hp2BuilderProfilePage() {
  const params = useParams<{ username: string }>();
  const { user, loading: sessionLoading } = useSupabaseSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (sessionLoading) return;
      if (!supabase || !params.username) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const visibleStatuses = user?.id ? ["public", "members"] : ["public"];
      const { data } = await supabase
        .from("profiles")
        .select(publicProfileSelect)
        .eq("username", params.username)
        .in("visibility", visibleStatuses)
        .maybeSingle();
      const nextProfile = (data as Profile | null) ?? null;
      setProfile(nextProfile);
      if (nextProfile) {
        const { data: projectData } = await supabase
          .from("projects")
          .select(
            `*, profiles(username, full_name, avatar_url, headline), project_members(id), ${projectCategoryRelationSelect}`,
          )
          .eq("owner_id", nextProfile.id)
          .eq("is_public", true)
          .order("created_at", { ascending: false });
        setProjects((projectData as Project[] | null) ?? []);
      }
      setLoading(false);
    }
    load();
  }, [params.username, sessionLoading, user?.id]);

  if (loading) {
    return (
      <R2Shell>
        <section className="hp2-list-section">
          <R2Loading label="Loading profile..." />
        </section>
      </R2Shell>
    );
  }

  if (!profile) {
    return (
      <R2Shell>
        <R2Hero
          label="Builder"
          title="Profile not found."
          copy="This builder profile is private, unlisted, or does not exist."
        />
      </R2Shell>
    );
  }

  const links = [
    { label: "Website", href: profile.website_url, icon: Globe },
    { label: "GitHub", href: profile.github_url, icon: Github },
    { label: "LinkedIn", href: profile.linkedin_url, icon: ExternalLink },
    { label: "X", href: profile.x_url, icon: ExternalLink },
  ].filter((link) => normalizeExternalUrl(link.href));

  return (
    <R2Shell>
      <Seo {...profileSeo(profile)} path={`/builders/${profile.username}`} />
      <section className="hp2-profile-hero">
        <div className="hp2-profile-media">
          {profile.cover_url && <img src={profile.cover_url} alt="" />}
        </div>
        <div className="hp2-profile-main">
          <div className="hp2-profile-identity">
            <img
              src={profile.avatar_url || defaultAvatarUrl}
              alt={profile.full_name}
            />
            <div>
              <p className="hp2-subhero-label">@{profile.username}</p>
              <h1 className="css-text-balance">{profile.full_name}</h1>
              <p>{profile.headline || profile.role || "Builder"}</p>
              {links.length > 0 && (
                <div className="hp2-profile-links">
                  {links.map((link) => {
                    const Icon = link.icon;
                    return (
                      <a
                        key={link.label}
                        href={normalizeExternalUrl(link.href) || "#"}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Icon size={14} />
                        {link.label}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <section className="hp2-profile-content">
        <div className="hp2-profile-column">
          <article className="hp2-profile-panel">
            <h2>About</h2>
            <p>{profile.bio || "This member has not added a bio yet."}</p>
          </article>
          <article className="hp2-profile-panel">
            <h2>Personal projects</h2>
            {projects.length > 0 ? (
              <div className="hp2-row-list">
                {projects.map((project) => (
                  <a key={project.id} href={`/projects/${project.slug}`}>
                    <strong>{project.name}</strong>
                    <span>{project.tagline || project.description}</span>
                    <ArrowRight size={15} />
                  </a>
                ))}
              </div>
            ) : (
              <p>No public personal projects yet.</p>
            )}
          </article>
        </div>
        <aside className="hp2-profile-sidebar">
          <section className="hp2-profile-panel">
            <h2>Details</h2>
            <dl>
              <div>
                <dt>Role</dt>
                <dd>{profile.role || "Builder"}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{profileLocation(profile)}</dd>
              </div>
              <div>
                <dt>Joined</dt>
                <dd>{formatDate(profile.created_at) || "Member"}</dd>
              </div>
              {profile.email_public && profile.email && (
                <div>
                  <dt>Email</dt>
                  <dd>{profile.email}</dd>
                </div>
              )}
            </dl>
          </section>
          <section className="hp2-profile-panel">
            <h2>Skills</h2>
            <R2Tags items={profile.skills} />
          </section>
          {(profile.looking_for?.length ?? 0) > 0 && (
            <section className="hp2-profile-panel">
              <h2>Looking for</h2>
              <R2Tags items={profile.looking_for} />
            </section>
          )}
          {(profile.languages?.length ?? 0) > 0 && (
            <section className="hp2-profile-panel">
              <h2>Languages</h2>
              <R2Tags items={profile.languages} />
            </section>
          )}
        </aside>
      </section>
    </R2Shell>
  );
}

export function Hp2ProjectsPage() {
  const { projects, loading } = useR2Projects();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const fallbackProjects =
    projects.length === 0 && !loading ? STATIC_PROJECTS : [];
  const categories = [
    "All",
    ...Array.from(new Set(projects.flatMap(projectCategoryLabels))),
  ];
  const statuses = [
    "All",
    "idea",
    "building",
    "beta",
    "live",
    "revenue",
    "paused",
  ];
  const filteredProjects = projects.filter((project) => {
    const labels = projectCategoryLabels(project);
    const haystack =
      `${project.name} ${project.tagline ?? ""} ${project.description ?? ""} ${labels.join(" ")}`.toLowerCase();
    return (
      haystack.includes(query.toLowerCase()) &&
      (category === "All" || labels.includes(category)) &&
      (status === "All" || project.status === status)
    );
  });

  return (
    <R2Shell>
      <R2Hero
        label="Projects"
        title="Products shipping from the network."
        copy="A public showcase of software, tools, experiments, open-source work, and companies built by Italian builders."
        meta={
          <div className="hp2-substats">
            <span>{projects.length || STATIC_PROJECTS.length} projects</span>
            <span>
              {categories.length > 1 ? categories.length - 1 : 0} categories
            </span>
          </div>
        }
      />
      <section className="hp2-list-section">
        <R2Search
          value={query}
          onChange={setQuery}
          placeholder="Search projects..."
        >
          {categories.length > 1 && (
            <R2Select
              value={category}
              onChange={setCategory}
              options={categories}
            />
          )}
          <R2Select value={status} onChange={setStatus} options={statuses} />
        </R2Search>
        {loading ? (
          <R2Loading label="Loading projects..." />
        ) : filteredProjects.length > 0 ? (
          <div className="hp2-project-grid">
            {filteredProjects.map((project) => (
              <R2ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : fallbackProjects.length > 0 ? (
          <div className="hp2-project-grid">
            {fallbackProjects.map((project) => (
              <article key={project.id} className="hp2-project-card">
                <div className="hp2-project-card-media">
                  <img src={project.imageUrl} alt={project.name} />
                </div>
                <div>
                  <div className="hp2-project-card-head">
                    <h2>{project.name}</h2>
                    <span>{project.status}</span>
                  </div>
                  <p>{project.description}</p>
                  <R2Tags items={[project.category]} />
                  <small>{project.builder}</small>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <R2Empty
            title="No public projects yet"
            copy="Members can add projects from their dashboard."
          />
        )}
      </section>
    </R2Shell>
  );
}

function R2ProjectCard({ project }: { project: Project }) {
  const labels = projectCategoryLabels(project);
  const contributorCount = project.project_members?.length ?? 0;
  return (
    <a className="hp2-project-card" href={`/projects/${project.slug}`}>
      <div className="hp2-project-card-media">
        {project.image_url ? (
          <img src={project.image_url} alt={project.name} />
        ) : (
          <div className="hp2-project-card-fallback" aria-hidden="true">
            {project.name.slice(0, 2)}
          </div>
        )}
      </div>
      <div>
        <div className="hp2-project-card-head">
          <h2>{project.name}</h2>
          <span>{project.status}</span>
        </div>
        <p>{project.tagline || project.description || "Project record"}</p>
        <R2Tags items={labels} />
        {contributorCount > 0 && (
          <small>
            {contributorCount} contributor{contributorCount === 1 ? "" : "s"}
          </small>
        )}
        <span className="hp2-card-action">
          View project <ArrowRight size={13} />
        </span>
      </div>
    </a>
  );
}

export function Hp2ProjectDetailPage() {
  const params = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase || !params.slug) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("projects")
        .select(
          `*, profiles(username, full_name, avatar_url, headline), project_members(*, profiles!project_members_profile_id_fkey(username, full_name, avatar_url, headline)), ${projectCategoryRelationSelect}`,
        )
        .eq("slug", params.slug)
        .eq("is_public", true)
        .maybeSingle();
      setProject((data as Project | null) ?? null);
      setLoading(false);
    }
    load();
  }, [params.slug]);

  if (loading) {
    return (
      <R2Shell>
        <section className="hp2-list-section">
          <R2Loading label="Loading project..." />
        </section>
      </R2Shell>
    );
  }

  if (!project) {
    return (
      <R2Shell>
        <R2Hero
          label="Project"
          title="Project not found."
          copy="This project is private or does not exist."
        />
      </R2Shell>
    );
  }

  const links = [
    { label: "Website", href: project.website_url, icon: Globe },
    { label: "Demo", href: project.demo_url, icon: ExternalLink },
    { label: "GitHub", href: project.github_url, icon: Github },
  ].filter((link) => normalizeExternalUrl(link.href));
  const lookingFor = cleanLookingForItems(project.looking_for);

  return (
    <R2Shell>
      <Seo {...projectSeo(project)} path={`/projects/${project.slug}`} />
      <R2Hero
        label={projectCategoryLabels(project).join(" / ") || "Project"}
        title={project.name}
        copy={
          project.tagline ||
          project.description ||
          "Project record from Italian Builders."
        }
        meta={
          <div className="hp2-substats">
            <span>{project.status}</span>
            <span>{formatDate(project.created_at) || "Public project"}</span>
          </div>
        }
      />
      <section className="hp2-profile-content hp2-record-content">
        <div className="hp2-profile-column">
          <article className="hp2-profile-panel">
            {project.image_url && (
              <img
                className="hp2-record-image"
                src={project.image_url}
                alt={project.name}
              />
            )}
            <h2>About</h2>
            <p>{project.description || "No description yet."}</p>
          </article>
        </div>
        <aside className="hp2-profile-sidebar">
          <section className="hp2-profile-panel">
            <h2>Contributors</h2>
            <div className="hp2-mini-people">
              {project.profiles?.username && (
                <a href={`/builders/${project.profiles.username}`}>
                  <img
                    src={project.profiles.avatar_url || defaultAvatarUrl}
                    alt=""
                  />
                  <span>
                    <strong>{project.profiles.full_name}</strong>
                    <small>Owner</small>
                  </span>
                </a>
              )}
              {(project.project_members ?? []).map((member) => (
                <a
                  key={member.id}
                  href={
                    member.profiles?.username
                      ? `/builders/${member.profiles.username}`
                      : "/builders"
                  }
                >
                  <img
                    src={member.profiles?.avatar_url || defaultAvatarUrl}
                    alt=""
                  />
                  <span>
                    <strong>{member.profiles?.full_name || "Member"}</strong>
                    <small>{member.role || "Contributor"}</small>
                  </span>
                </a>
              ))}
            </div>
          </section>
          {lookingFor.length > 0 && (
            <section className="hp2-profile-panel">
              <h2>Looking for</h2>
              <div className="hp2-need-list">
                {lookingFor.map((item) => (
                  <div key={item.tag}>
                    <strong>{item.tag}</strong>
                    <span>{item.message || "Open to conversations."}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
          {links.length > 0 && (
            <section className="hp2-profile-panel">
              <h2>Links</h2>
              <div className="hp2-link-stack">
                {links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.label}
                      href={normalizeExternalUrl(link.href) || "#"}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Icon size={15} />
                      {link.label}
                    </a>
                  );
                })}
              </div>
            </section>
          )}
        </aside>
      </section>
    </R2Shell>
  );
}

export function Hp2CommunityProjectsPage() {
  const { projects, loading } = useR2CommunityProjects();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const statuses = ["All", "proposed", "active", "paused", "completed"];
  const filteredProjects = projects.filter((project) => {
    const haystack =
      `${project.name} ${project.tagline ?? ""} ${project.description ?? ""} ${project.category ?? ""}`.toLowerCase();
    return (
      haystack.includes(query.toLowerCase()) &&
      (status === "All" || project.status === status)
    );
  });

  return (
    <R2Shell>
      <R2Hero
        label="Community projects"
        title="Shared projects and open-source work."
        copy="Platform-maintained projects where builders can contribute, collaborate, and ship together."
        meta={
          <div className="hp2-substats">
            <span>{projects.length} workstreams</span>
            <span>public records</span>
          </div>
        }
      />
      <section className="hp2-list-section">
        <R2Search
          value={query}
          onChange={setQuery}
          placeholder="Search community projects..."
        >
          <R2Select value={status} onChange={setStatus} options={statuses} />
        </R2Search>
        {loading ? (
          <R2Loading label="Loading community projects..." />
        ) : filteredProjects.length > 0 ? (
          <div className="hp2-project-grid">
            {filteredProjects.map((project) => (
              <R2CommunityProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <R2Empty
            title="No community projects yet"
            copy="Admins can create the first community project from the admin area."
          />
        )}
      </section>
    </R2Shell>
  );
}

function R2CommunityProjectCard({ project }: { project: CommunityProject }) {
  const count = project.community_project_members?.length ?? 0;
  return (
    <a
      className="hp2-project-card hp2-compact-card"
      href={`/community-projects/${project.slug}`}
    >
      <div>
        <div className="hp2-project-card-head">
          <h2>{project.name}</h2>
          <span>{project.status}</span>
        </div>
        <p>{project.tagline || project.description || "Community project."}</p>
        <div className="hp2-card-footer">
          <small>{project.category || "Community"}</small>
          <small>
            {count} contributor{count === 1 ? "" : "s"}
          </small>
        </div>
      </div>
    </a>
  );
}

export function Hp2OpenSourcePage() {
  return (
    <R2Shell>
      <R2Hero
        label="Open source"
        title="Shared infrastructure for Italian builders."
        copy="Community-maintained projects that make discovery, collaboration, and open building easier."
        meta={
          <div className="hp2-substats">
            <span>{STATIC_OS_PROJECTS.length} projects</span>
            <span>Community maintained</span>
          </div>
        }
      />
      <section className="hp2-list-section">
        <div className="hp2-project-grid">
          {STATIC_OS_PROJECTS.map((project) => (
            <a
              key={project.id}
              className="hp2-project-card hp2-compact-card"
              href="#"
            >
              <div>
                <div className="hp2-project-card-head">
                  <h2>{project.title}</h2>
                  <span>{project.status}</span>
                </div>
                <p>{project.description}</p>
                <div className="hp2-card-footer">
                  <small>{project.category}</small>
                  <span className="hp2-card-action">
                    View project <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </R2Shell>
  );
}

export function Hp2CommunityProjectDetailPage() {
  const params = useParams<{ slug: string }>();
  const [project, setProject] = useState<CommunityProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase || !params.slug) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("community_projects")
        .select(
          "*, community_project_members(*, profiles!community_project_members_profile_id_fkey(username, full_name, avatar_url, headline))",
        )
        .eq("slug", params.slug)
        .eq("is_public", true)
        .maybeSingle();
      setProject((data as CommunityProject | null) ?? null);
      setLoading(false);
    }
    load();
  }, [params.slug]);

  if (loading) {
    return (
      <R2Shell>
        <section className="hp2-list-section">
          <R2Loading label="Loading community project..." />
        </section>
      </R2Shell>
    );
  }

  if (!project) {
    return (
      <R2Shell>
        <R2Hero
          label="Community project"
          title="Project not found."
          copy="This community project is private or does not exist."
        />
      </R2Shell>
    );
  }

  return (
    <R2Shell>
      <Seo
        {...communityProjectSeo(project)}
        path={`/community-projects/${project.slug}`}
      />
      <R2Hero
        label={project.category || "Community project"}
        title={project.name}
        copy={
          project.tagline || project.description || "Shared community work."
        }
        meta={
          <div className="hp2-substats">
            <span>{project.status}</span>
            <span>
              {project.community_project_members?.length ?? 0} contributors
            </span>
          </div>
        }
      />
      <section className="hp2-profile-content hp2-record-content">
        <div className="hp2-profile-column">
          <article className="hp2-profile-panel">
            {project.image_url && (
              <img
                className="hp2-record-image"
                src={project.image_url}
                alt={project.name}
              />
            )}
            <h2>About</h2>
            <p>{project.description || "No description yet."}</p>
          </article>
        </div>
        <aside className="hp2-profile-sidebar">
          <section className="hp2-profile-panel">
            <h2>Links</h2>
            <div className="hp2-link-stack">
              {normalizeExternalUrl(project.website_url) && (
                <a
                  href={normalizeExternalUrl(project.website_url) || "#"}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Globe size={15} />
                  Website
                </a>
              )}
              {normalizeExternalUrl(project.repo_url) && (
                <a
                  href={normalizeExternalUrl(project.repo_url) || "#"}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github size={15} />
                  Repository
                </a>
              )}
            </div>
          </section>
          <section className="hp2-profile-panel">
            <h2>Contributors</h2>
            {(project.community_project_members ?? []).length === 0 ? (
              <p>No contributors assigned yet.</p>
            ) : (
              <div className="hp2-mini-people">
                {(project.community_project_members ?? []).map((member) => (
                  <a
                    key={member.id}
                    href={
                      member.profiles?.username
                        ? `/builders/${member.profiles.username}`
                        : "/builders"
                    }
                  >
                    <img
                      src={member.profiles?.avatar_url || defaultAvatarUrl}
                      alt=""
                    />
                    <span>
                      <strong>{member.profiles?.full_name || "Member"}</strong>
                      <small>{member.role || "Contributor"}</small>
                    </span>
                  </a>
                ))}
              </div>
            )}
          </section>
        </aside>
      </section>
    </R2Shell>
  );
}

export function Hp2PantheonPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [activePioneer, setActivePioneer] = useState<Pioneer | null>(null);
  const categories = ["All", ...PIONEER_CATEGORIES];
  const filtered = PIONEERS.filter((pioneer) => {
    const haystack =
      `${pioneer.name} ${pioneer.role} ${pioneer.tagline} ${pioneer.fields.join(" ")}`.toLowerCase();
    return (
      haystack.includes(query.toLowerCase()) &&
      (category === "All" || pioneer.category === category)
    );
  });

  return (
    <R2Shell>
      <R2Hero
        label="Pantheon"
        title="Italian builders before us."
        copy="A reference wall for the people whose work made new industries, sciences, tools, and cultures possible."
      />
      <section className="hp2-list-section">
        <div className="hp2-pioneer-filterbar">
          <div className="hp2-filter-chips">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={category === item ? "is-active" : ""}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <R2Search
            value={query}
            onChange={setQuery}
            placeholder="Search names, fields, eras..."
          />
        </div>
        <div className="hp2-pioneer-grid">
          {filtered.map((pioneer) => (
            <R2PioneerCard
              key={pioneer.slug}
              pioneer={pioneer}
              onOpen={setActivePioneer}
            />
          ))}
        </div>
      </section>
      <R2PioneerDialog
        pioneer={activePioneer}
        onClose={() => setActivePioneer(null)}
      />
    </R2Shell>
  );
}

function R2PioneerCard({
  pioneer,
  onOpen,
}: {
  pioneer: Pioneer;
  onOpen: (pioneer: Pioneer) => void;
}) {
  return (
    <button
      type="button"
      className="hp2-pioneer-card"
      onClick={() => onOpen(pioneer)}
      aria-label={`Read the biography of ${pioneer.name}`}
    >
      <div className="hp2-pioneer-media">
        <img
          src={pioneer.portrait ?? pioneer.work?.image}
          alt={pioneer.name}
          loading="lazy"
          decoding="async"
          width="360"
          height="450"
          sizes="(max-width: 680px) 100vw, (max-width: 980px) 50vw, 25vw"
        />
        <span>{pioneer.category}</span>
      </div>
      <div>
        <h2>{pioneer.name}</h2>
        <p>{pioneer.tagline}</p>
        <small>
          {pioneer.role} · {pioneer.lifespan}
        </small>
        <span className="hp2-pioneer-action">
          Read biography <ArrowUpRight size={14} />
        </span>
      </div>
    </button>
  );
}

function R2PioneerMedia({ item }: { item: PioneerMediaItem }) {
  return (
    <figure className="hp2-pioneer-dialog-media">
      <img src={item.src} alt={item.caption} loading="lazy" />
      <figcaption>{item.caption}</figcaption>
    </figure>
  );
}

function R2PioneerBiography({ pioneer }: { pioneer: Pioneer }) {
  const headerImage = pioneer.portrait ?? pioneer.work?.image;
  const media = (PIONEER_MEDIA[pioneer.slug] ?? []).filter(
    (item) => item.src !== headerImage,
  );
  const lastIndex = pioneer.bio.length - 1;
  const trailing = media.filter(
    (item) => item.after > lastIndex || item.after < 0,
  );

  return (
    <div className="hp2-pioneer-biography">
      {pioneer.bio.map((paragraph, index) => (
        <div key={paragraph.slice(0, 32)}>
          <p>{paragraph}</p>
          {media
            .filter((item) => item.after === index)
            .map((item) => (
              <R2PioneerMedia key={item.src} item={item} />
            ))}
        </div>
      ))}
      {trailing.map((item) => (
        <R2PioneerMedia key={item.src} item={item} />
      ))}
    </div>
  );
}

function R2PioneerDialog({
  pioneer,
  onClose,
}: {
  pioneer: Pioneer | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(pioneer)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="hp2-pioneer-dialog">
        {pioneer && (
          <>
            <header className="hp2-pioneer-dialog-head">
              <img
                src={pioneer.portrait ?? pioneer.work?.image}
                alt={pioneer.name}
              />
              <div>
                <span>{pioneer.category}</span>
                <DialogTitle>{pioneer.name}</DialogTitle>
                <DialogDescription>
                  {pioneer.role} · {pioneer.lifespan}
                </DialogDescription>
                <small>
                  {pioneer.origin} · {pioneer.era}
                </small>
              </div>
            </header>
            <div className="hp2-pioneer-dialog-body">
              <section className="hp2-pioneer-why">
                <h2>
                  <Sparkles size={14} /> Why they matter
                </h2>
                <p>{pioneer.whyGreat}</p>
              </section>
              {pioneer.facts?.length ? (
                <dl className="hp2-pioneer-facts">
                  {pioneer.facts.map((fact) => (
                    <div key={fact.label}>
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              <section>
                <h2>The story</h2>
                <R2PioneerBiography pioneer={pioneer} />
              </section>
              <section>
                <h2>Key contributions</h2>
                <ul className="hp2-pioneer-contributions">
                  {pioneer.contributions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
              <footer className="hp2-pioneer-dialog-foot">
                <div className="hp2-tags">
                  {pioneer.fields.map((field) => (
                    <span key={field}>{field}</span>
                  ))}
                </div>
                <a href={pioneer.wikipedia} target="_blank" rel="noreferrer">
                  Learn more <ArrowUpRight size={14} />
                </a>
              </footer>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function Hp2MissionPage() {
  return (
    <R2Shell>
      <R2Hero
        label="Mission"
        title="Italian Builders exists to connect people who build."
        copy="The community is built around relationships: ideas, projects, knowledge, opportunities, and the right people meeting at the right time."
      />
      <section className="hp2-manifesto hp2-mission-body">
        <div className="hp2-mission-layout">
          <article className="hp2-mission-copy">
            {missionParagraphs.slice(1).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>
          <aside className="hp2-mission-aside">
            <p className="hp2-subhero-label">Core idea</p>
            <strong>What unites us is that we choose to build.</strong>
            <a href="/join">
              Join the community <ArrowRight size={14} />
            </a>
          </aside>
        </div>
      </section>
    </R2Shell>
  );
}

export function Hp2JoinPage() {
  return (
    <R2Shell>
      <section className="hp2-join">
        <div className="hp2-join-copy">
          <h1 className="css-text-balance">Join the directory</h1>
          <p className="css-text-balance">
            Tell the community who you are, what you are building, and where
            your work can be found.
          </p>
        </div>
        <Hp2DirectoryJoinForm />
      </section>
    </R2Shell>
  );
}

export function Hp2MerchPage() {
  const [selectedColor, setSelectedColor] = useState<MerchCapColor>("navy");
  const activeCap =
    MERCH_CAPS.find((cap) => cap.id === selectedColor) ?? MERCH_CAPS[0];

  return (
    <R2Shell>
      <div className="hp2-merch-page">
        <div className="hp2-merch-shell">
          <R2Hero
            label="Merch"
            title="Italian Builders caps."
            copy="Classic baseball cap with the three-square mark. One size. Choose a color, leave shipping details, then pay later via Stripe email link."
            meta={
              <a className="hp2-merch-hero-cta" href="#interest">
                Register interest <ArrowRight size={14} />
              </a>
            }
          />

          <section
            className="hp2-list-section hp2-merch-product"
            aria-label="Cap interest"
          >
            <div className="hp2-merch-stage">
              <div className="hp2-merch-stage-visual">
                <figure className="hp2-merch-stage-media">
                  <img
                    key={activeCap.id}
                    src={activeCap.image}
                    alt={`Italian Builders cap in ${activeCap.label}`}
                    width={1024}
                    height={1024}
                    decoding="async"
                  />
                </figure>
                <div className="hp2-merch-thumb-row" role="list">
                  {MERCH_CAPS.map((cap) => {
                    const selected = selectedColor === cap.id;
                    return (
                      <button
                        key={cap.id}
                        type="button"
                        role="listitem"
                        className={`hp2-merch-thumb${selected ? " is-selected" : ""}`}
                        aria-pressed={selected}
                        aria-label={`Preview ${cap.label}`}
                        onClick={() => setSelectedColor(cap.id)}
                      >
                        <img
                          src={cap.image}
                          alt=""
                          width={320}
                          height={320}
                          loading="lazy"
                          decoding="async"
                        />
                        <span>{cap.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="hp2-merch-stage-copy">
                <Hp2MerchInterestForm
                  selectedColor={selectedColor}
                  onColorChange={setSelectedColor}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </R2Shell>
  );
}

export function Hp2PrivacyPage() {
  return (
    <R2LegalPage
      label="Privacy"
      title="Privacy Policy"
      intro="This policy explains what Italian Builders collects, why we collect it, and how we use the services that power the community."
      sections={[
        [
          "Who we are",
          <p>
            Italian Builders is a community for people who build products,
            companies, software, creative work, and technology in or connected
            to Italy. In this policy, Italian Builders, we, us, and our mean the
            operators of the Italian Builders website and community.
          </p>,
        ],
        [
          "Information we collect",
          <LegalList
            items={[
              "Waitlist and invite information, such as name, email address, role, what you are building, website or project links, and social handles you choose to provide.",
              "Merchandising interest information, such as name, email, phone, preferred product color, quantity, and shipping address details you submit for future print-on-demand orders.",
              "Account information, such as email address, authentication data, username, profile details, profile visibility settings, and invite status.",
              "Community content, such as builder profiles, project listings, community project details, links, images, videos, and collaboration notes that you choose to submit.",
              "Telegram digest and moderation data from approved community chats, including message text, links, chat IDs, topic IDs, message IDs, timestamps, Telegram sender IDs, usernames, first names, and last names where Telegram provides them.",
              "Technical information, such as IP address, browser type, device information, log events, security events, page URLs, and error diagnostics.",
              "Preference data stored in your browser, such as label mode, session state, cookie notice status, and interface preferences.",
            ]}
          />,
        ],
        [
          "How we use information",
          <LegalList
            items={[
              "To run the community, review access requests, create invites, authenticate members, and display public or member-visible profiles and projects.",
              "To collect merchandising interest and shipping details for future print-on-demand drops, and to email a Stripe payment link when a batch opens.",
              "To store and serve media uploaded by authenticated members.",
              "To generate member-only Telegram topic digests, post short TLDR links back into approved Telegram chats, and create admin-review moderation flags for clear suspected rule violations.",
              "To keep the website reliable, secure, and maintainable.",
              "To contact you about your access request, account, invite, or important community updates.",
              "To comply with legal obligations and enforce the Terms of Service.",
            ]}
          />,
        ],
        [
          "Legal bases",
          <p>
            When GDPR or similar laws apply, we rely on performance of a
            contract or pre-contractual steps when you request access or use the
            community, legitimate interests in operating and securing the
            service, consent where we ask for it, and legal obligations where
            applicable.
          </p>,
        ],
        [
          "Telegram digest bot",
          <>
            <p>
              The Italian Builders Telegram digest bot is added only to approved
              community chats. It stores message text, links, chat IDs, topic
              IDs, message IDs, timestamps, and minimal Telegram sender metadata
              needed to create daily topic summaries and admin-review moderation
              flags. Digest output does not tag people.
            </p>
            <p>
              Relevant message text may be sent to OpenRouter and its model
              providers. Full digests are available only to signed-in members.
              Short TLDR messages may be posted back into the matching chat or
              topic. Moderation flags are suggestions for admins only: the bot
              does not apply strikes, delete messages, or remove members.
            </p>
          </>,
        ],
        [
          "Service providers",
          <LegalList
            items={[
              "Vercel for hosting, deployment, serverless API routes, and Open Graph image generation.",
              "Supabase for authentication, database records, member sessions, invite flows, and related backend services.",
              "Cloudflare R2 for member-uploaded media storage and public media delivery.",
              "OpenRouter and selected model providers for Telegram digest generation.",
              "Telegram for bot message delivery, webhook updates, and community chat interactions.",
              "Sentry for error monitoring, performance diagnostics, and issue investigation when configured.",
              "Adobe Fonts for loading the typefaces used by the interface.",
              "LinkedIn and X when you click our social links or publish those links on your profile.",
            ]}
          />,
        ],
        [
          "Cookies and local storage",
          <>
            <p>
              We currently use only strictly necessary cookies and local
              storage. These support login sessions, account security, upload
              access, interface preferences, and remembering that you have seen
              the cookie notice. When you save your preference, we also keep a
              consent record with the consent version, selected categories,
              timestamp, page path, IP address, user agent, and your account id
              if you are signed in.
            </p>
            <p>
              We do not currently use advertising or analytics cookies. If
              optional tracking is added later, we will update this policy and
              ask for consent where required.
            </p>
            <button
              type="button"
              className="hp2-legal-action"
              onClick={openCookieSettings}
            >
              Open cookie settings
            </button>
          </>,
        ],
        [
          "Public content",
          <p>
            Some profile and project information may be public depending on the
            visibility settings you choose. Do not add private or sensitive
            information to public profile fields, project pages, links, images,
            or videos.
          </p>,
        ],
        [
          "Retention",
          <p>
            We keep information for as long as needed to operate the community,
            maintain security, resolve disputes, comply with legal obligations,
            and preserve legitimate community records. You can ask us to delete
            or update personal information, subject to legal, security, and
            abuse-prevention limits.
          </p>,
        ],
        [
          "International transfers",
          <p>
            Our providers may process information in countries other than where
            you live. Where required, we rely on appropriate safeguards such as
            data processing agreements, standard contractual clauses, and
            provider compliance programs.
          </p>,
        ],
        [
          "Your rights",
          <p>
            Depending on where you live, you may have rights to access, correct,
            delete, restrict, object to, or export your personal information.
            You may also withdraw consent where processing is based on consent.
          </p>,
        ],
        [
          "Contact",
          <p>
            For privacy requests, contact{" "}
            <a href="mailto:info@italianbuilders.co">info@italianbuilders.co</a>
            .
          </p>,
        ],
      ]}
    />
  );
}

export function Hp2TermsPage() {
  return (
    <R2LegalPage
      label="Terms"
      title="Terms of Service"
      intro="These terms set the basic rules for using Italian Builders while the community is still early."
      sections={[
        [
          "Using Italian Builders",
          <p>
            By accessing or using Italian Builders, you agree to these terms. If
            you do not agree, do not use the website or community features.
          </p>,
        ],
        [
          "Accounts and access",
          <LegalList
            items={[
              "Access may require an invite, account, or approval from an admin.",
              "You are responsible for keeping your account and login credentials secure.",
              "You must provide accurate information and keep it reasonably up to date.",
              "We may accept, reject, suspend, or remove access to protect the community or operate the service.",
            ]}
          />,
        ],
        [
          "Community rules",
          <LegalList
            items={[
              "Be respectful and do not harass, threaten, impersonate, or mislead others.",
              "Do not upload malware, spam, illegal content, or content that violates someone else's rights.",
              "Do not scrape, abuse, overload, reverse engineer, or interfere with the service.",
              "Do not use the community to send unsolicited commercial messages or deceptive promotions.",
            ]}
          />,
        ],
        [
          "Your content",
          <>
            <p>
              You keep ownership of content you submit, such as profiles,
              project descriptions, links, images, and videos. You give us
              permission to host, store, display, resize, transmit, and
              otherwise use that content as needed to operate and promote
              Italian Builders.
            </p>
            <p>
              You are responsible for the content you submit and for having the
              rights needed to share it.
            </p>
          </>,
        ],
        [
          "Public profiles and projects",
          <p>
            Some areas are designed to be visible publicly or to other members.
            Published information may be viewed, indexed, shared, or copied by
            others. Visibility settings help control display inside the product
            but cannot guarantee that already-published information will not be
            seen elsewhere.
          </p>,
        ],
        [
          "Third-party services",
          <p>
            The service relies on Vercel, Supabase, Cloudflare, OpenRouter,
            Telegram, Sentry, Adobe Fonts, LinkedIn, and X. Their own terms and
            policies may apply when you interact with their services or when
            they process data to provide infrastructure to us.
          </p>,
        ],
        [
          "Availability",
          <p>
            Italian Builders is an early-stage community service. We may change,
            pause, remove, or discontinue features at any time. We do not
            promise uninterrupted availability or that every feature will remain
            available.
          </p>,
        ],
        [
          "No warranties",
          <p>
            The service is provided as is and as available. To the maximum
            extent allowed by law, we disclaim warranties of merchantability,
            fitness for a particular purpose, non-infringement, and
            uninterrupted or error-free operation.
          </p>,
        ],
        [
          "Limitation of liability",
          <p>
            To the maximum extent allowed by law, Italian Builders and its
            operators will not be liable for indirect, incidental, special,
            consequential, or punitive damages, or for lost profits, lost data,
            or business interruption arising from your use of the service.
          </p>,
        ],
        [
          "Changes",
          <p>
            We may update these terms as the community and product evolve. The
            updated date on this page shows when the latest version was
            published.
          </p>,
        ],
        [
          "Contact",
          <p>
            For terms questions, contact{" "}
            <a href="mailto:info@italianbuilders.co">info@italianbuilders.co</a>
            .
          </p>,
        ],
      ]}
    />
  );
}

function LegalList({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function R2LegalPage({
  label,
  title,
  intro,
  sections,
}: {
  label: string;
  title: string;
  intro: string;
  sections: Array<[string, React.ReactNode]>;
}) {
  return (
    <R2Shell>
      <R2Hero label={label} title={title} copy={intro} />
      <section className="hp2-legal-body">
        <p className="hp2-legal-updated">Last updated: June 19, 2026</p>
        {sections.map(([sectionTitle, body]) => (
          <section key={sectionTitle}>
            <h2>{sectionTitle}</h2>
            <div>{body}</div>
          </section>
        ))}
      </section>
    </R2Shell>
  );
}
