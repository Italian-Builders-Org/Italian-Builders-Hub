import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowRight,
  ExternalLink,
  Github,
  Globe,
  MapPin,
  Search,
} from "lucide-react";
import {
  Hp2DirectoryJoinForm,
  Hp2Footer,
  R2HeaderAuthControls,
} from "@/pages/Hp2";
import { StyleSwitch } from "@/pages/Home";
import { PIONEERS, PIONEER_CATEGORIES, type Pioneer } from "@/data/pioneers";
import { STATIC_BUILDERS, STATIC_PROJECTS, hasItems } from "@/data/directory";
import { defaultAvatarUrl } from "@/lib/assets";
import { supabase } from "@/lib/supabase";
import type {
  CommunityProject,
  Profile,
  Project,
  ProjectLookingFor,
} from "@/lib/supabase";

const publicProfileSelect =
  "id, username, full_name, headline, bio, avatar_url, cover_url, location, city, country, latitude, longitude, email, email_public, website_url, linkedin_url, x_url, github_url, youtube_url, instagram_url, role, skills, interests, looking_for, languages, intro_video_url, visibility, platform_role, onboarding_completed, created_at, updated_at";
const projectCategoryRelationSelect =
  "project_category_tags(position, project_categories(id, slug, name, group_name, sort_order, is_active, created_at, updated_at))";

const r2PrimaryLinks = [
  { href: "/hp-2/builders", label: "Builders" },
  { href: "/hp-2/projects", label: "Projects" },
  { href: "/hp-2/community-projects", label: "Community projects" },
  { href: "/hp-2/content", label: "Content" },
  { href: "/hp-2/pantheon", label: "Pantheon" },
  { href: "/hp-2/mission", label: "Mission" },
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
        <a href="/hp-2" className="hp2-logo-link" aria-label="Italian Builders">
          <img src="/logo-vector-dark-mattoni.svg" alt="Italian Builders" />
        </a>
        <nav aria-label="R2 preview navigation">
          {r2PrimaryLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          <R2HeaderAuthControls />
          <StyleSwitch currentStyle="r2" />
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
  const pathname = location.split(/[?#]/)[0].replace(/\/+$/, "") || "/hp-2";

  if (pathname === "/hp-2") return null;

  const segments = pathname
    .replace(/^\/hp-2\/?/, "")
    .split("/")
    .filter(Boolean);

  return (
    <div className="hp2-breadcrumbs">
      <a href="/hp-2">Home</a>
      {segments.map((segment, index) => {
        const href = `/hp-2/${segments.slice(0, index + 1).join("/")}`;
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
  options: string[];
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
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
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select(publicProfileSelect)
        .eq("visibility", "public")
        .order("created_at", { ascending: false });
      setProfiles((data as Profile[] | null) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return { profiles, loading };
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
  const { profiles, loading } = useR2Profiles();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const fallbackBuilders =
    profiles.length === 0 && !loading ? STATIC_BUILDERS : [];
  const roles = [
    "All",
    ...Array.from(
      new Set(profiles.map((profile) => profile.role).filter(Boolean)),
    ),
  ] as string[];
  const filteredProfiles = profiles.filter((profile) => {
    const haystack =
      `${profile.full_name} ${profile.username} ${profile.headline ?? ""} ${profile.bio ?? ""} ${profile.city ?? ""} ${profile.skills?.join(" ") ?? ""}`.toLowerCase();
    return (
      haystack.includes(query.toLowerCase()) &&
      (role === "All" || profile.role === role)
    );
  });

  return (
    <R2Shell>
      <R2Hero
        label="Directory"
        title="Find Italian builders."
        copy="Public member records, photos where available, location, skills, and the work people are building now."
        meta={
          <div className="hp2-substats">
            <span>{profiles.length || STATIC_BUILDERS.length} builders</span>
            <span>{roles.length > 1 ? roles.length - 1 : 0} roles</span>
          </div>
        }
      />
      <section className="hp2-list-section">
        <R2Search
          value={query}
          onChange={setQuery}
          placeholder="Search builders, cities, skills..."
        >
          {roles.length > 1 && (
            <R2Select value={role} onChange={setRole} options={roles} />
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
                href={`/hp-2/builders/${profile.username}`}
              >
                <img
                  src={profile.avatar_url || defaultAvatarUrl}
                  alt={profile.full_name}
                />
                <div>
                  <h2>{profile.full_name}</h2>
                  <p>{profile.headline || profile.role || "Builder"}</p>
                  <span>
                    <MapPin size={12} />
                    {profileLocation(profile)}
                  </span>
                </div>
                <R2Tags items={profile.skills} />
              </a>
            ))}
          </div>
        ) : fallbackBuilders.length > 0 ? (
          <div className="hp2-card-grid">
            {fallbackBuilders.map((builder) => (
              <article key={builder.id} className="hp2-person-card">
                <img src={builder.avatarUrl} alt={builder.name} />
                <div>
                  <h2>{builder.name}</h2>
                  <p>{builder.highlight}</p>
                  <span>
                    <MapPin size={12} />
                    {builder.location}
                  </span>
                </div>
                <R2Tags items={builder.tags} />
              </article>
            ))}
          </div>
        ) : (
          <R2Empty
            title="No public builders yet"
            copy="Once invited members complete onboarding, they will appear here."
          />
        )}
      </section>
    </R2Shell>
  );
}

export function Hp2BuilderProfilePage() {
  const params = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase || !params.username) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select(publicProfileSelect)
        .eq("username", params.username)
        .eq("visibility", "public")
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
  }, [params.username]);

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
      <section className="hp2-profile-hero">
        <div className="hp2-profile-media">
          {profile.cover_url && <img src={profile.cover_url} alt="" />}
        </div>
        <div className="hp2-profile-main">
          <img
            src={profile.avatar_url || defaultAvatarUrl}
            alt={profile.full_name}
          />
          <div>
            <p className="hp2-subhero-label">@{profile.username}</p>
            <h1 className="css-text-balance">{profile.full_name}</h1>
            <p>{profile.headline || profile.role || "Builder"}</p>
          </div>
        </div>
      </section>
      <section className="hp2-detail-grid">
        <article className="hp2-detail-body">
          <h2>About</h2>
          <p>{profile.bio || "This member has not added a bio yet."}</p>
          <R2Tags items={profile.skills} />
          {projects.length > 0 && (
            <>
              <h2>Projects</h2>
              <div className="hp2-row-list">
                {projects.map((project) => (
                  <a key={project.id} href={`/hp-2/projects/${project.slug}`}>
                    <strong>{project.name}</strong>
                    <span>{project.tagline || project.description}</span>
                    <ArrowRight size={15} />
                  </a>
                ))}
              </div>
            </>
          )}
        </article>
        <aside className="hp2-detail-aside">
          <dl>
            <div>
              <dt>Location</dt>
              <dd>{profileLocation(profile)}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{profile.role || "Builder"}</dd>
            </div>
            <div>
              <dt>Joined</dt>
              <dd>{formatDate(profile.created_at) || "Member"}</dd>
            </div>
          </dl>
          {links.length > 0 && (
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
  const fallbackProjects =
    projects.length === 0 && !loading ? STATIC_PROJECTS : [];
  const categories = [
    "All",
    ...Array.from(new Set(projects.flatMap(projectCategoryLabels))),
  ];
  const filteredProjects = projects.filter((project) => {
    const labels = projectCategoryLabels(project);
    const haystack =
      `${project.name} ${project.tagline ?? ""} ${project.description ?? ""} ${labels.join(" ")}`.toLowerCase();
    return (
      haystack.includes(query.toLowerCase()) &&
      (category === "All" || labels.includes(category))
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
                <img src={project.imageUrl} alt={project.name} />
                <div>
                  <span>{project.category}</span>
                  <h2>{project.name}</h2>
                  <p>{project.description}</p>
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
  return (
    <a className="hp2-project-card" href={`/hp-2/projects/${project.slug}`}>
      {project.image_url ? (
        <img src={project.image_url} alt={project.name} />
      ) : (
        <div className="hp2-project-card-fallback" aria-hidden="true">
          {project.name.slice(0, 2)}
        </div>
      )}
      <div>
        <span>{labels.join(" / ") || project.status}</span>
        <h2>{project.name}</h2>
        <p>{project.tagline || project.description || "Project record"}</p>
        <small>{project.profiles?.full_name || "Italian Builders"}</small>
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
      <section className="hp2-detail-grid">
        <article className="hp2-detail-body">
          {project.image_url && (
            <img src={project.image_url} alt={project.name} />
          )}
          <h2>About</h2>
          <p>{project.description || "No description yet."}</p>
          {lookingFor.length > 0 && (
            <>
              <h2>Looking for</h2>
              <div className="hp2-need-list">
                {lookingFor.map((item) => (
                  <div key={item.tag}>
                    <strong>{item.tag}</strong>
                    <span>{item.message || "Open to conversations."}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </article>
        <aside className="hp2-detail-aside">
          <h2>Builders</h2>
          <div className="hp2-mini-people">
            {project.profiles?.username && (
              <a href={`/hp-2/builders/${project.profiles.username}`}>
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
                    ? `/hp-2/builders/${member.profiles.username}`
                    : "/hp-2/builders"
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
          {links.length > 0 && (
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
          <div className="hp2-row-list">
            {filteredProjects.map((project) => (
              <a
                key={project.id}
                href={`/hp-2/community-projects/${project.slug}`}
              >
                <strong>{project.name}</strong>
                <span>
                  {project.tagline || project.description || project.category}
                </span>
                <small>{project.status}</small>
              </a>
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
      <section className="hp2-detail-grid">
        <article className="hp2-detail-body">
          {project.image_url && (
            <img src={project.image_url} alt={project.name} />
          )}
          <h2>About</h2>
          <p>{project.description || "No description yet."}</p>
        </article>
        <aside className="hp2-detail-aside">
          <h2>Contributors</h2>
          <div className="hp2-mini-people">
            {(project.community_project_members ?? []).map((member) => (
              <a
                key={member.id}
                href={
                  member.profiles?.username
                    ? `/hp-2/builders/${member.profiles.username}`
                    : "/hp-2/builders"
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
        </aside>
      </section>
    </R2Shell>
  );
}

export function Hp2PantheonPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
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
        <R2Search
          value={query}
          onChange={setQuery}
          placeholder="Search names, fields, eras..."
        >
          <R2Select
            value={category}
            onChange={setCategory}
            options={categories}
          />
        </R2Search>
        <div className="hp2-pioneer-grid">
          {filtered.map((pioneer) => (
            <R2PioneerCard key={pioneer.slug} pioneer={pioneer} />
          ))}
        </div>
      </section>
    </R2Shell>
  );
}

function R2PioneerCard({ pioneer }: { pioneer: Pioneer }) {
  return (
    <article className="hp2-pioneer-card">
      <img
        src={pioneer.portrait ?? pioneer.work?.image}
        alt={pioneer.name}
        loading="lazy"
        decoding="async"
        width="360"
        height="360"
        sizes="(max-width: 680px) 100vw, (max-width: 980px) 50vw, 25vw"
      />
      <div>
        <span>{pioneer.category}</span>
        <h2>{pioneer.name}</h2>
        <p>{pioneer.tagline}</p>
        <small>
          {pioneer.role} · {pioneer.lifespan}
        </small>
      </div>
    </article>
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
        <div className="hp2-manifesto-copy">
          {missionParagraphs.slice(1).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
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

export function Hp2PrivacyPage() {
  return (
    <R2LegalPage
      label="Privacy"
      title="Privacy Policy"
      intro="This policy explains what Italian Builders collects, why we collect it, and how we use the services that power the community."
      sections={[
        [
          "Who we are",
          "Italian Builders is a community for people who build products, companies, software, creative work, and technology in or connected to Italy.",
        ],
        [
          "Information we collect",
          "Waitlist records, account information, public profile content, project listings, media, links, technical logs, security events, and local interface preferences.",
        ],
        [
          "How we use information",
          "We use this information to run the community, review access requests, authenticate members, display public profiles and projects, store media, contact members, and keep the website reliable.",
        ],
        [
          "Service providers",
          "We use Vercel, Supabase, Cloudflare R2, Sentry when configured, Google Fonts, LinkedIn, and X where those services are part of the product experience.",
        ],
        ["Contact", "For privacy requests, contact info@italianbuilders.co."],
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
          "Access",
          "We may accept, reject, suspend, or remove access to protect the community and operate the service.",
        ],
        [
          "Community content",
          "You are responsible for the profile, project, links, images, videos, and other content you submit.",
        ],
        [
          "Acceptable use",
          "Do not abuse the service, misrepresent yourself, upload malicious content, or use the community for deceptive promotion.",
        ],
        [
          "Early-stage service",
          "Italian Builders is provided as an early-stage community service and may change as the product evolves.",
        ],
        ["Contact", "For terms questions, contact info@italianbuilders.co."],
      ]}
    />
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
  sections: Array<[string, string]>;
}) {
  return (
    <R2Shell>
      <R2Hero label={label} title={title} copy={intro} />
      <section className="hp2-legal-body">
        {sections.map(([sectionTitle, body]) => (
          <section key={sectionTitle}>
            <h2>{sectionTitle}</h2>
            <p>{body}</p>
          </section>
        ))}
      </section>
    </R2Shell>
  );
}
