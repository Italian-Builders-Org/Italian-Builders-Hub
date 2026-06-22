import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowRight,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  ExternalLink,
  Github,
  Globe,
  Linkedin,
  Lock,
  MessageCircle,
  Monitor,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  Smartphone,
  Trash2,
  Twitter,
  UploadCloud,
  UserPlus,
  X,
} from "lucide-react";
import { Header, Footer, useTechLabels } from "@/pages/Home";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type CommunityProject,
  type CommunityProjectMember,
  type Invite,
  type Profile,
  type Project,
  type ProjectLookingFor,
  type ProjectMember,
  type WaitlistSignup,
  isSupabaseConfigured,
  slugify,
  supabase,
  authRedirectUrl,
  useSupabaseSession,
} from "@/lib/supabase";
import { mediaFieldHelp, uploadMediaFile } from "@/lib/storage";
import {
  normalizeHttpUrlInput,
  normalizeSocialUrl,
  sanitizeHttpUrl,
} from "@/lib/url-safety";
import { coordsForCityCountry, locationLabel } from "@/lib/geo";

const inputClass =
  "h-10 rounded-sm border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600";
const selectClass =
  "h-10 w-full rounded-sm border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100";
const textareaClass =
  "min-h-24 rounded-sm border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600";
const lookingForOptions = [
  "Co-founder / partner",
  "Marketer",
  "Investor",
  "Advisor",
  "Designer",
  "Developer",
  "Job: Full Time",
  "Job: Part Time",
  "Job: Contract",
  "Job: Freelance",
  "Job: Internship",
  "Beta users",
  "Community partners",
];
const maxLookingForItems = 8;
const maxLookingForMessageLength = 200;
const maxProfileSkills = 12;
const maxProfileLookingFor = 8;
const maxProfileLanguages = 8;
const waitlistPageSize = 30;
const profileSkillOptions = [
  "AI",
  "AI Agents",
  "AI Engineering",
  "AI Evaluation",
  "APIs",
  "API Design",
  "API Integrations",
  "API Tools",
  "Analytics",
  "Airtable",
  "Automation",
  "AWS",
  "Backend Development",
  "Base44",
  "Bolt",
  "Branding",
  "ChatGPT",
  "Claude Code",
  "Cloudflare",
  "Coding",
  "Communication",
  "Community Building",
  "Copywriting",
  "Cursor",
  "Customer Discovery",
  "Data Engineering",
  "Deep Learning",
  "Design Systems",
  "Devin",
  "DevOps",
  "Docker",
  "Emergent",
  "Fine-tuning",
  "Figma",
  "Firebase",
  "Firebase Studio",
  "Flutter",
  "Frontend Development",
  "Fundraising",
  "Full-stack Development",
  "GitHub Copilot",
  "Google Antigravity",
  "Growth",
  "Hiring",
  "Hugging Face",
  "Kiro",
  "Kotlin",
  "Leadership",
  "LLMs",
  "LangChain",
  "LangGraph",
  "Lovable",
  "Machine Learning",
  "Make",
  "Marketing",
  "MCP",
  "Mentoring",
  "Model Training",
  "Next.js",
  "No-code",
  "Node.js",
  "Notion",
  "Open Source",
  "OpenAI Codex",
  "OpenAI API",
  "Operations",
  "Payments",
  "Postgres",
  "Product Management",
  "Prompt Engineering",
  "Python",
  "RAG",
  "React",
  "React Native",
  "Replit",
  "REST APIs",
  "Rork",
  "Sales",
  "Security",
  "SEO",
  "Software Architecture",
  "Strategy",
  "Stripe",
  "Supabase",
  "Swift",
  "Tool Calling",
  "TypeScript",
  "UI Design",
  "UX Design",
  "v0",
  "Vercel",
  "Vibe Coding",
  "Windsurf",
  "Zapier",
];
const profileLookingForOptions = [
  "Advisor",
  "Beta users",
  "Co-founder / partner",
  "Community partners",
  "Contributors",
  "Designer",
  "Developer",
  "Early customers",
  "Feedback",
  "Fundraising support",
  "Growth partner",
  "Hiring",
  "Investor",
  "Job: Contract",
  "Job: Freelance",
  "Job: Full Time",
  "Job: Internship",
  "Job: Part Time",
  "Marketer",
  "Mentor",
  "Open-source maintainers",
  "Pilot customers",
  "Sales support",
];
const languageOptions = [
  "Italian",
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Dutch",
  "Arabic",
  "Chinese",
  "Japanese",
  "Korean",
  "Hindi",
  "Russian",
  "Polish",
  "Romanian",
  "Greek",
];
const profileVisibilityOptions: Array<{
  value: Profile["visibility"];
  label: string;
  description: string;
}> = [
  {
    value: "public",
    label: "Public",
    description:
      "Visible on your public profile, builder directory, map, project pages, and search previews.",
  },
  {
    value: "members",
    label: "Community members",
    description:
      "Visible to signed-in members and admins, including full project attribution for members. Hidden from public directory, map, and anonymous visitors.",
  },
  {
    value: "unlisted",
    label: "Unlisted",
    description:
      "Hidden from public directory, map, public profile page, and normal member browsing. Project attribution may show only limited data.",
  },
  {
    value: "private",
    label: "Private",
    description:
      "Visible only to you and platform admins. Other people should not see the profile or full project attribution.",
  },
];

type ModeLabel = string | { tech: string; friendly: string };

function labelForMode(label: ModeLabel, techLabels: boolean) {
  return typeof label === "string"
    ? label
    : techLabels
      ? label.tech
      : label.friendly;
}

function cleanLookingForItems(
  items?: ProjectLookingFor[] | null,
): ProjectLookingFor[] {
  return (items ?? [])
    .map((item) => ({
      tag: String(item?.tag ?? "")
        .trim()
        .slice(0, 80),
      message: String(item?.message ?? "")
        .trim()
        .slice(0, maxLookingForMessageLength),
    }))
    .filter((item) => item.tag.length > 0)
    .slice(0, maxLookingForItems);
}

function normalizeCommunityHandle(value: string) {
  return value
    .trim()
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}

function splitCommunityHandles(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\s,]+/)
        .map(normalizeCommunityHandle)
        .filter(Boolean),
    ),
  );
}

function telegramDeepLink(handle?: string | null, text?: string) {
  const username = handle?.trim().replace(/^@+/, "");
  if (!username) return null;
  const base = `https://t.me/${encodeURIComponent(username)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark-technical-theme min-h-screen bg-zinc-950">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

function HeroBlock({
  eyebrow,
  title,
  copy,
  action,
}: {
  eyebrow: ModeLabel;
  title: ModeLabel;
  copy: ModeLabel;
  action?: React.ReactNode;
}) {
  const { techLabels } = useTechLabels();
  const eyebrowText = labelForMode(eyebrow, techLabels);
  const titleText = labelForMode(title, techLabels);
  const copyText = labelForMode(copy, techLabels);

  return (
    <section className="border-b border-zinc-800 bg-zinc-950 pt-18 pb-10 md:pt-24 md:pb-14">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 text-xs font-mono font-semibold uppercase tracking-wider text-blue-400">
              {eyebrowText}
            </div>
            <h1 className="mb-5 text-4xl font-bold tracking-tight text-zinc-50 md:text-5xl">
              {titleText}
            </h1>
            <p className="text-base leading-relaxed text-zinc-400">
              {copyText}
            </p>
          </div>
          {action}
        </div>
      </div>
    </section>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`dt-card rounded-sm ${className}`}>{children}</div>;
}

function Field({
  label,
  children,
  hint,
  required = false,
}: {
  label: ModeLabel;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  const { techLabels } = useTechLabels();

  return (
    <label className="block space-y-2">
      <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
        {labelForMode(label, techLabels)}
        {required && (
          <span className="ml-1 text-red-500" aria-label="required">
            *
          </span>
        )}
      </span>
      {children}
      {hint && (
        <span className="block text-xs leading-relaxed text-zinc-500">
          {hint}
        </span>
      )}
    </label>
  );
}

function MediaUploadField({
  label,
  value,
  onChange,
  userId,
  folder,
  kind,
}: {
  label: ModeLabel;
  value: string;
  onChange: (url: string) => void;
  userId: string;
  folder: "profile" | "projects" | "community-projects";
  kind: "avatar" | "cover" | "project";
}) {
  const { techLabels } = useTechLabels();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const publicUrl = await uploadMediaFile({ file, userId, folder });
      onChange(publicUrl);
    } catch (uploadError) {
      setError(getError(uploadError) || "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
        {labelForMode(label, techLabels)}
      </span>
      <div className="rounded-sm border border-zinc-800 bg-zinc-950 p-3">
        {value ? (
          <div className="mb-3 overflow-hidden rounded-sm border border-zinc-800 bg-zinc-900">
            {value.match(/\.(mp4|webm)(\?|$)/i) ? (
              <video
                src={value}
                controls
                className="max-h-44 w-full object-cover"
              />
            ) : (
              <img
                src={value}
                alt=""
                className="max-h-44 w-full object-cover"
              />
            )}
          </div>
        ) : (
          <div className="mb-3 flex h-28 items-center justify-center rounded-sm border border-dashed border-zinc-800 bg-zinc-900 text-xs text-zinc-600">
            No file uploaded
          </div>
        )}
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-sm border border-zinc-800 px-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-900">
          <UploadCloud size={15} />
          {uploading ? "Uploading..." : "Upload file"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
            className="sr-only"
            disabled={uploading}
            onChange={onFileChange}
          />
        </label>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          {mediaFieldHelp(kind)}
        </p>
        <ActionableErrorMessage message={error} />
      </div>
    </div>
  );
}

function StatusMessage({
  message,
  tone = "neutral",
  title,
  action,
}: {
  message: string | null;
  tone?: "neutral" | "error" | "warning";
  title?: string;
  action?: React.ReactNode;
}) {
  if (!message) return null;
  const toneClass =
    tone === "error"
      ? "border-red-500/40 bg-red-950/30 text-red-200"
      : tone === "warning"
        ? "border-amber-500/40 bg-amber-950/25 text-amber-100"
        : "border-zinc-800 bg-zinc-900 text-zinc-300";
  return (
    <div className={`rounded-sm border p-3 text-sm ${toneClass}`}>
      <div className="flex items-start gap-3">
        {tone !== "neutral" && (
          <AlertTriangle className="mt-0.5 shrink-0" size={16} />
        )}
        <div className="min-w-0 space-y-2">
          {title && <p className="font-semibold text-zinc-50">{title}</p>}
          <p className="leading-relaxed">{message}</p>
          {action && <div className="pt-1">{action}</div>}
        </div>
      </div>
    </div>
  );
}

type ActionableStatus = {
  title: string;
  message: string;
  action?: React.ReactNode;
  tone?: "error" | "warning";
};

function InlineActionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex h-8 items-center gap-2 rounded-sm border border-current/30 px-3 text-xs font-semibold text-current hover:bg-white/10"
    >
      {children} <ArrowRight size={12} />
    </a>
  );
}

function schemaCacheStatus(message: string | null): ActionableStatus | null {
  if (!message) return null;
  const normalized = message.toLowerCase();
  if (
    normalized.includes("schema cache") &&
    normalized.includes("profiles") &&
    (normalized.includes("latitude") || normalized.includes("longitude"))
  ) {
    return {
      title: "Profile location fields are not installed yet.",
      message:
        "The profile form is working, but the database is missing the latitude/longitude columns required by this version. Apply `supabase/migrations/20260619113000_profile_coordinates.sql`, then reload the page.",
      tone: "error",
    };
  }
  if (
    normalized.includes("schema cache") &&
    normalized.includes("community_project_members")
  ) {
    return {
      title: "Community assignment roles are not installed yet.",
      message:
        "Community projects exist, but assignment role editing needs the latest member-role migration. Apply `supabase/migrations/20260619110000_project_members.sql`, then reload the page.",
      tone: "error",
    };
  }
  if (
    normalized.includes("schema cache") &&
    normalized.includes("project_members")
  ) {
    return {
      title: "Project contribution roles are not installed yet.",
      message:
        "This page needs the `project_members` table before project invitations can load. Apply `supabase/migrations/20260619110000_project_members.sql`, then reload the page. Seeing no invitations is normal until a project owner invites you.",
      tone: "error",
    };
  }
  return null;
}

function ActionableErrorMessage({ message }: { message: string | null }) {
  const status = schemaCacheStatus(message);
  if (status) {
    return (
      <StatusMessage
        message={status.message}
        title={status.title}
        tone={status.tone}
        action={status.action}
      />
    );
  }
  return <StatusMessage message={message} tone="error" />;
}

function EmptyState({ title, copy }: { title: ModeLabel; copy: ModeLabel }) {
  const { techLabels } = useTechLabels();

  return (
    <Card className="p-6">
      <h3 className="mb-2 font-semibold text-zinc-100">
        {labelForMode(title, techLabels)}
      </h3>
      <p className="text-sm text-zinc-500">{labelForMode(copy, techLabels)}</p>
    </Card>
  );
}

function Tags({ items }: { items?: string[] | null }) {
  const values = items?.filter(Boolean) ?? [];
  if (values.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((item) => (
        <span
          key={item}
          className="rounded-sm border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] font-mono uppercase text-zinc-400"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function tagKey(value: string) {
  return value.trim().toLowerCase();
}

function uniqueTags(
  values?: string[] | null,
  maxItems = Number.MAX_SAFE_INTEGER,
) {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const value of values ?? []) {
    const label = value.trim();
    const key = tagKey(label);
    if (!label || seen.has(key)) continue;
    seen.add(key);
    tags.push(label);
    if (tags.length >= maxItems) break;
  }
  return tags;
}

function coordinateText(value: number) {
  return Number(value.toFixed(6)).toString();
}

function inferredCoordinateText(city: string, country: string) {
  const coords = coordsForCityCountry(city, country);
  return coords
    ? {
        latitude: coordinateText(coords[0]),
        longitude: coordinateText(coords[1]),
      }
    : { latitude: "", longitude: "" };
}

function formLocationLabel(form: Pick<ProfileFormState, "city" | "country">) {
  return locationLabel({ city: form.city, country: form.country });
}

function visibilityDescription(value: Profile["visibility"]) {
  return (
    profileVisibilityOptions.find((option) => option.value === value)
      ?.description ?? ""
  );
}

function TagPicker({
  label,
  values,
  options,
  maxItems,
  onChange,
  placeholder,
  required = false,
}: {
  label: ModeLabel;
  values: string[];
  options: string[];
  maxItems: number;
  onChange: (values: string[]) => void;
  placeholder: string;
  required?: boolean;
}) {
  const { techLabels } = useTechLabels();
  const [query, setQuery] = useState("");
  const selected = uniqueTags(values, maxItems);
  const selectedKeys = new Set(selected.map(tagKey));
  const normalizedQuery = query.trim().toLowerCase();
  const matchingOptions = options
    .filter((option) => !selectedKeys.has(tagKey(option)))
    .filter((option) =>
      normalizedQuery ? option.toLowerCase().includes(normalizedQuery) : true,
    );
  const visibleOptions = matchingOptions.slice(0, 8);
  const hiddenOptionCount = Math.max(
    matchingOptions.length - visibleOptions.length,
    0,
  );
  const canAddMore = selected.length < maxItems;

  function addTag(value: string) {
    const option = options.find((item) => tagKey(item) === tagKey(value));
    if (!option || selectedKeys.has(tagKey(option)) || !canAddMore) return;
    onChange(uniqueTags([...selected, option], maxItems));
    setQuery("");
  }

  function removeTag(value: string) {
    onChange(selected.filter((item) => tagKey(item) !== tagKey(value)));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !query && selected.length > 0) {
      event.preventDefault();
      onChange(selected.slice(0, -1));
      return;
    }
    if (!["Enter", "Tab", ","].includes(event.key)) return;
    if (!query.trim()) return;
    const exact = options.find((option) => tagKey(option) === tagKey(query));
    const next = exact ?? visibleOptions[0];
    if (!next) return;
    event.preventDefault();
    addTag(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
          {labelForMode(label, techLabels)}
          {required && (
            <span className="ml-1 text-red-500" aria-label="required">
              *
            </span>
          )}
        </span>
        <span className="text-[11px] font-mono text-zinc-600">
          {selected.length}/{maxItems}
        </span>
      </div>
      <div className="rounded-sm border border-zinc-800 bg-zinc-950 p-2">
        <div className="flex min-h-9 flex-wrap items-center gap-2">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex h-7 max-w-full items-center gap-1 rounded-sm border border-blue-500/30 bg-blue-500/10 px-2 text-xs font-semibold text-blue-100"
            >
              <span className="truncate">{item}</span>
              <button
                type="button"
                className="text-blue-200 hover:text-white"
                onClick={() => removeTag(item)}
                aria-label={`Remove ${item}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            className="h-7 min-w-28 flex-1 bg-transparent px-1 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!canAddMore}
            placeholder={canAddMore ? placeholder : ""}
          />
        </div>
      </div>
      {canAddMore && visibleOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleOptions.map((option) => (
            <button
              key={option}
              type="button"
              className="rounded-sm border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:border-blue-500/60 hover:text-blue-100"
              onClick={() => addTag(option)}
            >
              {option}
            </button>
          ))}
          {hiddenOptionCount > 0 && (
            <span className="rounded-sm border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px] font-medium text-zinc-500">
              (
              {hiddenOptionCount >= 45
                ? "45+ more"
                : `${hiddenOptionCount} more`}
              )
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ExternalLinkItem({
  href,
  label,
  icon: Icon = ExternalLink,
  compact = false,
}: {
  href?: string | null;
  label: string;
  icon?: React.FC<{ size?: number; className?: string }>;
  compact?: boolean;
}) {
  const safeHref = sanitizeHttpUrl(href);
  if (!safeHref) return null;
  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noreferrer"
      className={
        compact
          ? "inline-flex h-8 items-center gap-2 rounded-sm border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-blue-400 hover:border-blue-500/50 hover:text-blue-300"
          : "flex w-full items-center gap-2 rounded-sm border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-blue-400 hover:border-blue-500/50 hover:text-blue-300"
      }
    >
      <Icon size={14} className="shrink-0" />
      <span className="min-w-0 truncate">{label}</span>
    </a>
  );
}

function LookingForModal({
  item,
  project,
  onClose,
}: {
  item: ProjectLookingFor | null;
  project: Project;
  onClose: () => void;
}) {
  if (!item) return null;
  const telegramHref = telegramDeepLink(
    project.profiles?.telegram_handle,
    `Hi, I saw ${project.name} on Italian Builders. I can help with ${item.tag}.`,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <div className="w-full max-w-lg rounded-sm border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-mono uppercase tracking-wider text-blue-400">
              Looking for
            </p>
            <h2 className="text-2xl font-bold text-zinc-50">{item.tag}</h2>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-400">
          {item.message ||
            `${project.name} is looking for ${item.tag.toLowerCase()}.`}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {telegramHref ? (
            <a
              href={telegramHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500"
            >
              <MessageCircle size={16} /> Reach out on Telegram
            </a>
          ) : (
            <a
              href={
                project.profiles?.username
                  ? `/builders/${project.profiles.username}`
                  : "/builders"
              }
              className="inline-flex h-10 items-center justify-center rounded-sm bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Open founder profile
            </a>
          )}
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-sm border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-900"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="dt-card p-6 text-sm font-mono text-zinc-500">
      Loading...
    </div>
  );
}

function getError(error: unknown) {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && "message" in error)
    return String((error as { message: unknown }).message);
  return String(error);
}

function useMyProfile(userId?: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(
    userId ?? null,
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!supabase || !userId) {
        setProfile(null);
        setLoadedUserId(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      setError(getError(queryError));
      setProfile((data as Profile | null) ?? null);
      setLoadedUserId(userId);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return {
    profile,
    setProfile,
    loading: loading || Boolean(userId && loadedUserId !== userId),
    error,
    isAdmin:
      profile?.platform_role === "admin" || profile?.platform_role === "owner",
  };
}

function SignInPanel({
  compact = false,
  allowSignup = false,
  invitedEmail,
}: {
  compact?: boolean;
  allowSignup?: boolean;
  invitedEmail?: string | null;
}) {
  const { techLabels } = useTechLabels();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const setAuthMode = (nextMode: typeof mode) => {
    setMode(nextMode);
    setMessage(null);
    setError(null);
  };

  useEffect(() => {
    if (invitedEmail) {
      setEmail(invitedEmail);
    }
  }, [invitedEmail]);

  function friendlyAuthError(message: string) {
    const lowerMessage = message.toLowerCase();
    if (
      lowerMessage.includes("invalid login credentials") ||
      lowerMessage.includes("invalid credentials")
    ) {
      return invitedEmail
        ? `The invite is for ${invitedEmail}, but that password did not sign in. Use the password you set when accepting the invite, or reset it below.`
        : "The email and password did not match. If you already opened an invite link, reset the password for that same email.";
    }
    if (
      lowerMessage.includes("user already registered") ||
      lowerMessage.includes("already registered")
    ) {
      return invitedEmail
        ? `An auth account already exists for ${invitedEmail}. Sign in with its password, or reset it below.`
        : "An account already exists for this email. Sign in with its password, or reset it below.";
    }
    return message;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    if (!supabase) {
      setError("The community backend is not configured in this deployment.");
      setSaving(false);
      return;
    }

    const authEmail = email.trim().toLowerCase();
    const result =
      mode === "forgot"
        ? await supabase.auth.resetPasswordForEmail(authEmail, {
            redirectTo: authRedirectUrl("/reset-password"),
          })
        : mode === "signin"
          ? await supabase.auth.signInWithPassword({
              email: authEmail,
              password,
            })
          : await supabase.auth.signUp({
              email: authEmail,
              password,
              options: { emailRedirectTo: authRedirectUrl() },
            });

    if (result.error) {
      setError(friendlyAuthError(result.error.message));
    } else {
      setMessage(
        mode === "forgot"
          ? `Check ${authEmail} for the password reset link.`
          : mode === "signin"
            ? "Signed in."
            : "Account created. Check your email if confirmation is enabled, then continue here.",
      );
    }
    setSaving(false);
  }

  return (
    <Card className={compact ? "p-4" : "p-6"}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">
            {mode === "signin"
              ? techLabels
                ? "AUTH_LOGIN"
                : "Sign in"
              : mode === "forgot"
                ? techLabels
                  ? "PASSWORD_RECOVERY"
                  : "Reset password"
                : techLabels
                  ? "CREATE_INVITED_ACCOUNT"
                  : "Create invited account"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {mode === "forgot"
              ? techLabels
                ? "Request a signed recovery link for this auth identity."
                : "Enter your email and we will send you a secure reset link."
              : allowSignup
                ? techLabels
                  ? "Invite token can mint one approved member account."
                  : "This invite lets you create an approved member account."
                : techLabels
                  ? "Auth is invite-gated. Request access if no approved account exists."
                  : "Accounts are invite-only. Request access from the waitlist if you do not have an approved account."}
          </p>
        </div>
        <Field label={{ tech: "EMAIL_ADDRESS", friendly: "Email" }}>
          <Input
            className={inputClass}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            readOnly={Boolean(invitedEmail)}
            required
          />
          {invitedEmail && (
            <p className="mt-2 text-xs text-zinc-500">
              {techLabels
                ? "Invite-bound auth: this link can only be accepted with the invited email."
                : `This invite can only be accepted with ${invitedEmail}.`}
            </p>
          )}
        </Field>
        {mode !== "forgot" && (
          <Field label={{ tech: "PASSWORD", friendly: "Password" }}>
            <Input
              className={inputClass}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
          </Field>
        )}
        <StatusMessage message={message} />
        <ActionableErrorMessage message={error} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="submit"
            disabled={saving}
            className="h-10 rounded-sm bg-blue-600 text-white hover:bg-blue-500"
          >
            {saving
              ? techLabels
                ? "WORKING..."
                : "Working..."
              : mode === "forgot"
                ? techLabels
                  ? "SEND_RESET_LINK"
                  : "Send reset link"
                : mode === "signin"
                  ? techLabels
                    ? "SIGN_IN"
                    : "Sign in"
                  : techLabels
                    ? "CREATE_ACCOUNT"
                    : "Create account"}
          </Button>
          {mode === "forgot" ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-sm border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-900"
              onClick={() => setAuthMode("signin")}
            >
              {techLabels ? "BACK_TO_SIGN_IN" : "Back to sign in"}
            </Button>
          ) : allowSignup ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-sm border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-900"
              onClick={() =>
                setAuthMode(mode === "signin" ? "signup" : "signin")
              }
            >
              {mode === "signin"
                ? techLabels
                  ? "CREATE_INVITED_ACCOUNT"
                  : "Create invited account"
                : techLabels
                  ? "AUTH_LOGIN"
                  : "Already have one?"}
            </Button>
          ) : (
            <a
              href="/join"
              className="inline-flex h-10 items-center justify-center rounded-sm border border-zinc-800 px-4 text-sm text-zinc-200 hover:bg-zinc-900"
            >
              {techLabels ? "REQUEST_ACCESS" : "Request access"}
            </a>
          )}
        </div>
        {mode === "signin" && (
          <button
            type="button"
            className="text-sm text-zinc-400 underline-offset-4 hover:text-zinc-100 hover:underline"
            onClick={() => setAuthMode("forgot")}
          >
            {techLabels ? "FORGOT_PASSWORD" : "Forgot password?"}
          </button>
        )}
      </form>
    </Card>
  );
}

export function ResetPasswordPage() {
  const { techLabels } = useTechLabels();
  const [, navigate] = useLocation();
  const [checking, setChecking] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setHasRecoverySession(Boolean(data.session));
      setChecking(false);
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasRecoverySession(true);
        setChecking(false);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    if (!supabase) {
      setError("The community backend is not configured in this deployment.");
      setSaving(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setSaving(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
    } else {
      setPassword("");
      setConfirmPassword("");
      setMessage("Password updated. You can continue to your dashboard.");
    }
    setSaving(false);
  }

  return (
    <PageShell>
      <HeroBlock
        eyebrow={{ tech: "PASSWORD_RECOVERY", friendly: "Password reset" }}
        title={{
          tech: "Rotate auth credential.",
          friendly: "Create a new password.",
        }}
        copy={{
          tech: "Recovery links open a short-lived Supabase session before the password is updated.",
          friendly:
            "Use the secure link from your email to set a new password for your account.",
        }}
      />
      <section className="container mx-auto max-w-xl px-4 py-12 md:px-6">
        <Card className="p-6">
          {checking ? (
            <p className="text-sm text-zinc-400">
              {techLabels
                ? "CHECKING_RECOVERY_SESSION"
                : "Checking reset session..."}
            </p>
          ) : hasRecoverySession ? (
            <form onSubmit={submit} className="space-y-4">
              <Field label={{ tech: "NEW_PASSWORD", friendly: "New password" }}>
                <Input
                  className={inputClass}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                />
              </Field>
              <Field
                label={{
                  tech: "CONFIRM_PASSWORD",
                  friendly: "Confirm password",
                }}
              >
                <Input
                  className={inputClass}
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={6}
                />
              </Field>
              <StatusMessage message={message} />
              <ActionableErrorMessage message={error} />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-10 rounded-sm bg-blue-600 text-white hover:bg-blue-500"
                >
                  {saving
                    ? techLabels
                      ? "UPDATING..."
                      : "Updating..."
                    : techLabels
                      ? "UPDATE_PASSWORD"
                      : "Update password"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-sm border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-900"
                  onClick={() => navigate("/dashboard")}
                >
                  {techLabels ? "OPEN_DASHBOARD" : "Open dashboard"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <StatusMessage
                tone="warning"
                message={
                  techLabels
                    ? "No recovery session found. Request a fresh reset link."
                    : "This reset link is invalid or expired. Request a new password reset email."
                }
              />
              <SignInPanel compact />
            </div>
          )}
        </Card>
      </section>
    </PageShell>
  );
}

function RequireAuth({
  admin = false,
  children,
}: {
  admin?: boolean;
  children: (ctx: {
    userId: string;
    profile: Profile | null;
    isAdmin: boolean;
  }) => React.ReactNode;
}) {
  const { user, loading: sessionLoading } = useSupabaseSession();
  const {
    profile,
    loading: profileLoading,
    isAdmin,
    error,
  } = useMyProfile(user?.id);

  if (!isSupabaseConfigured) {
    return (
      <PageShell>
        <HeroBlock
          eyebrow={{ tech: "CONFIGURATION", friendly: "Configuration" }}
          title={{
            tech: "BACKEND_CONFIG_MISSING",
            friendly: "The community backend is not configured.",
          }}
          copy={{
            tech: "Configure the auth and data API environment variables to enable private routes.",
            friendly: "Configure the app backend to enable member-only pages.",
          }}
        />
      </PageShell>
    );
  }

  if (sessionLoading || profileLoading) {
    return (
      <PageShell>
        <section className="container mx-auto px-4 py-12 md:px-6">
          <SkeletonList />
        </section>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <HeroBlock
          eyebrow={{ tech: "AUTH_REQUIRED", friendly: "Members" }}
          title={{ tech: "SESSION_REQUIRED", friendly: "Sign in to continue." }}
          copy={{
            tech: "Private routes require an approved Italian Builders member session.",
            friendly:
              "Private pages are available to invited Italian Builders members.",
          }}
        />
        <section className="container mx-auto max-w-xl px-4 py-12 md:px-6">
          <SignInPanel />
        </section>
      </PageShell>
    );
  }

  if (admin && !isAdmin) {
    return (
      <PageShell>
        <HeroBlock
          eyebrow={{ tech: "ADMIN_GATE", friendly: "Admin" }}
          title={{
            tech: "ADMIN_SCOPE_REQUIRED",
            friendly: "Admin access required.",
          }}
          copy={{
            tech: "Only owner and admin roles can mutate invites, members and shared workstreams.",
            friendly:
              "Only platform admins and owners can manage invites, members and community projects.",
          }}
        />
        <section className="container mx-auto px-4 py-12 md:px-6">
          <StatusMessage
            message={error || "Your account is signed in but not an admin."}
            tone="error"
          />
        </section>
      </PageShell>
    );
  }

  return <>{children({ userId: user.id, profile, isAdmin })}</>;
}

export function BuildersDirectoryPage() {
  const { techLabels } = useTechLabels();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data, error: queryError } = await supabase
        .from("profiles")
        .select("*")
        .eq("visibility", "public")
        .order("created_at", { ascending: false });
      setProfiles((data as Profile[]) ?? []);
      setError(getError(queryError));
      setLoading(false);
    }
    load();
  }, []);

  const roles = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(profiles.map((profile) => profile.role).filter(Boolean)),
      ),
    ],
    [profiles],
  );
  const filtered = profiles.filter((profile) => {
    const haystack =
      `${profile.full_name} ${profile.username} ${profile.headline ?? ""} ${profile.city ?? ""} ${profile.skills?.join(" ") ?? ""}`.toLowerCase();
    return (
      haystack.includes(query.toLowerCase()) &&
      (role === "All" || profile.role === role)
    );
  });

  return (
    <PageShell>
      <HeroBlock
        eyebrow={{
          tech: "> DIRECTORY_SCAN --public",
          friendly: "Builder directory",
        }}
        title={{
          tech: "Query the builder graph.",
          friendly: "Find Italian builders.",
        }}
        copy={{
          tech: "Indexed public profiles with skills, artifacts and contact endpoints.",
          friendly:
            "Public profiles from invited members, with skills, projects and social links.",
        }}
      />
      <section className="container mx-auto px-4 py-12 md:px-6">
        <div className="mb-8 grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-zinc-600" size={16} />
            <Input
              className={`${inputClass} pl-9`}
              placeholder="Search builders, cities, skills..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select
            className={selectClass}
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            {roles.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <ActionableErrorMessage message={error} />
        {loading ? (
          <SkeletonList />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={{
              tech: "NO_PUBLIC_PROFILES",
              friendly: "No public builders yet",
            }}
            copy={{
              tech: "No public profile records are currently available.",
              friendly:
                "Once invited members complete onboarding, they will appear here.",
            }}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((profile) => (
              <a
                key={profile.id}
                href={`/builders/${profile.username}`}
                className="dt-card group flex flex-col p-5"
              >
                <div className="mb-5 flex items-start gap-3">
                  <img
                    src={profile.avatar_url || "/images/avatar-1.png"}
                    alt={profile.full_name}
                    className="h-12 w-12 rounded-sm border border-zinc-700 object-cover grayscale"
                  />
                  <div className="min-w-0">
                    <h2 className="truncate font-bold text-zinc-100">
                      {profile.full_name}
                    </h2>
                    <p className="text-xs font-mono text-zinc-500">
                      @{profile.username}
                    </p>
                  </div>
                </div>
                <p className="mb-2 text-sm font-medium text-zinc-200">
                  {profile.headline || profile.role || "Builder"}
                </p>
                <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-zinc-500">
                  {profile.bio || "This member has not added a bio yet."}
                </p>
                <Tags items={profile.skills} />
                <span className="mt-5 inline-flex items-center gap-2 text-xs font-mono uppercase text-blue-400">
                  {techLabels ? "OPEN_PROFILE" : "View profile"}{" "}
                  <ArrowRight size={12} />
                </span>
              </a>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

export function BuilderProfilePage() {
  const { techLabels } = useTechLabels();
  const { user } = useSupabaseSession();
  const params = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMemberships, setProjectMemberships] = useState<ProjectMember[]>(
    [],
  );
  const [assignments, setAssignments] = useState<CommunityProjectMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setProfile(null);
      setProjects([]);
      setProjectMemberships([]);
      setAssignments([]);

      if (!supabase || !params.username) {
        if (!cancelled) setLoading(false);
        return;
      }
      const { data: visibleProfileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", params.username)
        .in("visibility", ["public", "members"])
        .maybeSingle();
      let nextProfile = visibleProfileData as Profile | null;

      if (!nextProfile && user?.id) {
        const { data: ownProfileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("username", params.username)
          .eq("id", user.id)
          .maybeSingle();
        nextProfile = ownProfileData as Profile | null;
      }

      if (cancelled) return;
      setProfile(nextProfile);
      if (nextProfile) {
        const [
          { data: projectData },
          { data: projectMemberData },
          { data: memberData },
        ] = await Promise.all([
          supabase
            .from("projects")
            .select(
              "*, profiles(username, full_name, avatar_url, headline, telegram_handle), project_members(id)",
            )
            .eq("owner_id", nextProfile.id)
            .eq("is_public", true)
            .order("created_at", { ascending: false }),
          supabase
            .from("project_members")
            .select(
              "*, projects(*, profiles(username, full_name, avatar_url, headline, telegram_handle))",
            )
            .eq("profile_id", nextProfile.id),
          supabase
            .from("community_project_members")
            .select("*, community_projects(*)")
            .eq("profile_id", nextProfile.id),
        ]);
        if (cancelled) return;
        setProjects((projectData as Project[]) ?? []);
        setProjectMemberships((projectMemberData as ProjectMember[]) ?? []);
        setAssignments((memberData as CommunityProjectMember[]) ?? []);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [params.username, user?.id]);

  if (loading) {
    return (
      <PageShell>
        <section className="container mx-auto px-4 py-12 md:px-6">
          <SkeletonList />
        </section>
      </PageShell>
    );
  }

  if (!profile) {
    return (
      <PageShell>
        <HeroBlock
          eyebrow={{ tech: "PROFILE_RECORD", friendly: "Profile" }}
          title={{ tech: "PROFILE_NOT_FOUND", friendly: "Builder not found." }}
          copy={{
            tech: "The requested profile is private, unlisted or missing.",
            friendly: "This profile is private, unlisted, or does not exist.",
          }}
        />
      </PageShell>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  return (
    <PageShell>
      <section className="isolate border-b border-zinc-800 bg-zinc-950">
        <div className="relative z-0 h-44 overflow-hidden bg-zinc-900">
          {profile.cover_url && (
            <img
              src={profile.cover_url}
              alt=""
              className="h-full w-full object-cover opacity-70"
            />
          )}
        </div>
        <div className="container relative z-10 mx-auto px-4 pb-10 md:px-6">
          <div className="-mt-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <img
                src={profile.avatar_url || "/images/avatar-1.png"}
                alt={profile.full_name}
                className="h-24 w-24 rounded-sm border border-zinc-700 bg-zinc-950 object-cover grayscale"
              />
              <div>
                <p className="mb-2 text-xs font-mono uppercase text-blue-400">
                  @{profile.username}
                </p>
                <h1 className="text-4xl font-bold text-zinc-50">
                  {profile.full_name}
                </h1>
                <p className="mt-2 max-w-2xl text-zinc-400">
                  {profile.headline || profile.role}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ExternalLinkItem
                    href={profile.website_url}
                    label="Website"
                    icon={Globe}
                    compact
                  />
                  <ExternalLinkItem
                    href={profile.github_url}
                    label="GitHub"
                    icon={Github}
                    compact
                  />
                  <ExternalLinkItem
                    href={profile.linkedin_url}
                    label="LinkedIn"
                    icon={Linkedin}
                    compact
                  />
                  <ExternalLinkItem
                    href={profile.x_url}
                    label="X"
                    icon={Twitter}
                    compact
                  />
                </div>
              </div>
            </div>
            {isOwnProfile && (
              <a
                href="/dashboard/profile"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-sm border border-zinc-800 bg-zinc-900 px-3 text-xs font-semibold text-zinc-100 hover:border-blue-500/50 hover:text-blue-100"
              >
                <PencilLine size={14} />
                {techLabels ? "EDIT_PROFILE" : "Edit profile"}
              </a>
            )}
          </div>
        </div>
      </section>
      <section className="container mx-auto grid gap-6 px-4 py-12 md:px-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-3 text-xl font-bold text-zinc-100">
              {techLabels ? "PROFILE_BIO" : "About"}
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-400">
              {profile.bio || (techLabels ? "BIO_FIELD_EMPTY" : "No bio yet.")}
            </p>
          </Card>
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-bold text-zinc-100">
              {techLabels ? "PERSONAL_ARTIFACTS" : "Personal projects"}
            </h2>
            {projects.length === 0 ? (
              <p className="text-sm text-zinc-500">
                {techLabels
                  ? "NO_PUBLIC_ARTIFACTS"
                  : "No public personal projects yet."}
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </Card>
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-bold text-zinc-100">
              {techLabels ? "PROJECT_COLLABORATIONS" : "Project collaborations"}
            </h2>
            {projectMemberships.length === 0 ? (
              <p className="text-sm text-zinc-500">
                {techLabels
                  ? "NO_PROJECT_COLLABORATIONS"
                  : "No project collaborations yet."}
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {projectMemberships.map((member) =>
                  member.projects ? (
                    <ProjectCard
                      key={member.id}
                      project={{
                        ...member.projects,
                        project_members: [
                          {
                            ...member,
                            profiles: {
                              username: profile.username,
                              full_name: profile.full_name,
                              avatar_url: profile.avatar_url,
                              headline: profile.headline,
                            },
                          },
                        ],
                      }}
                    />
                  ) : null,
                )}
              </div>
            )}
          </Card>
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-bold text-zinc-100">
              {techLabels ? "COMMUNITY_ASSIGNMENTS" : "Community projects"}
            </h2>
            {assignments.length === 0 ? (
              <p className="text-sm text-zinc-500">
                {techLabels
                  ? "NO_ASSIGNMENTS"
                  : "No assigned community projects yet."}
              </p>
            ) : (
              <div className="space-y-3">
                {assignments.map((member: any) => (
                  <a
                    key={member.id}
                    href={`/community-projects/${member.community_projects?.slug}`}
                    className="block rounded-sm border border-zinc-800 bg-zinc-900 p-4 hover:border-blue-500/50"
                  >
                    <p className="font-semibold text-zinc-100">
                      {member.community_projects?.name}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {member.role || "Contributor"}
                      {member.contribution_note
                        ? ` - ${member.contribution_note}`
                        : ""}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </Card>
        </div>
        <aside className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-bold text-zinc-100">
              {techLabels ? "PROFILE_META" : "Details"}
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-mono text-xs uppercase text-zinc-600">
                  {techLabels ? "ROLE_VECTOR" : "Role"}
                </dt>
                <dd className="text-zinc-300">{profile.role || "Builder"}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase text-zinc-600">
                  {techLabels ? "GEO_POINT" : "Location"}
                </dt>
                <dd className="text-zinc-300">
                  {locationLabel({
                    city: profile.city,
                    country: profile.country,
                    fallback: profile.location,
                  })}
                </dd>
              </div>
              {profile.telegram_handle && (
                <div>
                  <dt className="font-mono text-xs uppercase text-zinc-600">
                    {techLabels ? "TELEGRAM_HANDLE" : "Telegram"}
                  </dt>
                  <dd className="text-zinc-300">{profile.telegram_handle}</dd>
                </div>
              )}
              {profile.email_public && profile.email && (
                <div>
                  <dt className="font-mono text-xs uppercase text-zinc-600">
                    {techLabels ? "PUBLIC_EMAIL" : "Email"}
                  </dt>
                  <dd className="text-zinc-300">{profile.email}</dd>
                </div>
              )}
            </dl>
          </Card>
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="mb-2 font-semibold text-zinc-100">
                {techLabels ? "SKILL_TAGS" : "Skills"}
              </h3>
              <Tags items={profile.skills} />
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-zinc-100">
                {techLabels ? "COLLAB_SIGNALS" : "Looking for"}
              </h3>
              <Tags items={profile.looking_for} />
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-zinc-100">
                {techLabels ? "LANG_STACK" : "Languages"}
              </h3>
              <Tags items={profile.languages} />
            </div>
          </Card>
          {profile.intro_video_url && (
            <Card className="p-6">
              <ExternalLinkItem
                href={profile.intro_video_url}
                label="Intro video"
              />
            </Card>
          )}
        </aside>
      </section>
    </PageShell>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const { techLabels } = useTechLabels();
  const contributorCount = project.project_members?.length ?? 0;
  return (
    <a
      href={`/projects/${project.slug}`}
      className="dt-card group flex flex-col overflow-hidden"
    >
      <div className="aspect-[1200/630] border-b border-zinc-800 bg-zinc-900">
        {project.image_url && (
          <img
            src={project.image_url}
            alt={project.name}
            className="h-full w-full object-cover grayscale transition-all group-hover:grayscale-0"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="font-bold text-zinc-100">{project.name}</h3>
          <span className="rounded-sm border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] font-mono uppercase text-zinc-500">
            {project.status}
          </span>
        </div>
        <p className="mb-4 text-sm text-zinc-500">
          {project.tagline ||
            project.description ||
            (techLabels
              ? "DESCRIPTION_FIELD_EMPTY"
              : "No project description yet.")}
        </p>
        {contributorCount > 0 && (
          <p className="mb-4 text-xs font-mono uppercase text-zinc-600">
            {techLabels
              ? `CONTRIBUTORS=${contributorCount}`
              : `${contributorCount} contributor${contributorCount === 1 ? "" : "s"}`}
          </p>
        )}
        <span className="mt-auto inline-flex items-center gap-2 text-xs font-mono uppercase text-blue-400">
          {techLabels ? "OPEN_ARTIFACT" : "View project"}{" "}
          <ArrowRight size={12} />
        </span>
      </div>
    </a>
  );
}

export function ProjectsDirectoryPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
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
          "*, profiles(username, full_name, avatar_url, headline, telegram_handle), project_members(id)",
        )
        .eq("is_public", true)
        .order("created_at", { ascending: false });
      setProjects((data as Project[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const categories = [
    "All",
    ...Array.from(
      new Set(projects.map((project) => project.category).filter(Boolean)),
    ),
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
  const filtered = projects.filter((project) => {
    const haystack =
      `${project.name} ${project.tagline ?? ""} ${project.description ?? ""} ${project.category ?? ""}`.toLowerCase();
    return (
      haystack.includes(query.toLowerCase()) &&
      (status === "All" || project.status === status) &&
      (category === "All" || project.category === category)
    );
  });

  return (
    <PageShell>
      <HeroBlock
        eyebrow={{
          tech: "> ARTIFACT_REGISTRY --public",
          friendly: "Project showcase",
        }}
        title={{
          tech: "Query shipped artifacts.",
          friendly: "Products shipping from the network.",
        }}
        copy={{
          tech: "Public project records from invited builders, including live products, experiments and repositories.",
          friendly:
            "Personal projects from invited builders, including live products, experiments and open-source work.",
        }}
      />
      <section className="container mx-auto px-4 py-12 md:px-6">
        <div className="mb-8 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <Input
            className={inputClass}
            placeholder="Search projects..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className={selectClass}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            className={selectClass}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {statuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <SkeletonList />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={{
              tech: "NO_PUBLIC_ARTIFACTS",
              friendly: "No public projects yet",
            }}
            copy={{
              tech: "No public project records match this query.",
              friendly: "Members can add projects from their dashboard.",
            }}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

export function ProjectDetailPage() {
  const { techLabels } = useTechLabels();
  const params = useParams<{ slug: string }>();
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { isAdmin } = useMyProfile(user?.id);
  const [project, setProject] = useState<Project | null>(null);
  const [selectedLookingFor, setSelectedLookingFor] =
    useState<ProjectLookingFor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (sessionLoading) return;
      if (!supabase || !params.slug) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("projects")
        .select(
          "*, profiles(username, full_name, avatar_url, headline, telegram_handle), project_members(*, profiles!project_members_profile_id_fkey(username, full_name, avatar_url, headline))",
        )
        .eq("slug", params.slug)
        .maybeSingle();
      setProject((data as Project | null) ?? null);
      setLoading(false);
    }
    load();
  }, [params.slug, sessionLoading, user?.id]);

  if (loading)
    return (
      <PageShell>
        <section className="container mx-auto px-4 py-12 md:px-6">
          <SkeletonList />
        </section>
      </PageShell>
    );
  if (!project)
    return (
      <PageShell>
        <HeroBlock
          eyebrow={{ tech: "ARTIFACT_RECORD", friendly: "Project" }}
          title={{ tech: "ARTIFACT_NOT_FOUND", friendly: "Project not found." }}
          copy={{
            tech: "The requested artifact is private or missing.",
            friendly: "This project is private or does not exist.",
          }}
        />
      </PageShell>
    );

  const lookingFor = cleanLookingForItems(project.looking_for);
  const canEditProject = user?.id === project.owner_id || isAdmin;
  const hasProjectLinks = Boolean(
    project.website_url || project.demo_url || project.github_url,
  );

  return (
    <PageShell>
      <LookingForModal
        item={selectedLookingFor}
        project={project}
        onClose={() => setSelectedLookingFor(null)}
      />
      <HeroBlock
        eyebrow={
          project.category || (techLabels ? "ARTIFACT_RECORD" : "Project")
        }
        title={project.name}
        copy={
          project.tagline ||
          project.description ||
          (techLabels
            ? "Artifact record from the Italian Builders graph."
            : "A project from the Italian Builders community.")
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-10 items-center rounded-sm border border-zinc-800 bg-zinc-900 px-3 text-xs font-mono uppercase text-zinc-400">
              {project.status}
            </span>
            {canEditProject && (
              <a
                href={`/dashboard/projects/${project.id}`}
                className="inline-flex h-10 items-center gap-2 rounded-sm bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500"
              >
                <PencilLine size={15} />
                {techLabels ? "EDIT_ARTIFACT" : "Edit project"}
              </a>
            )}
          </div>
        }
      />
      <section className="container mx-auto grid gap-6 px-4 py-12 md:px-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-6">
          {project.image_url && (
            <img
              src={project.image_url}
              alt={project.name}
              className="mb-6 aspect-[1200/630] w-full rounded-sm border border-zinc-800 object-cover"
            />
          )}
          <h2 className="mb-3 text-xl font-bold text-zinc-100">
            {techLabels ? "ARTIFACT_BODY" : "About"}
          </h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-400">
            {project.description ||
              (techLabels ? "DESCRIPTION_FIELD_EMPTY" : "No description yet.")}
          </p>
        </Card>
        <aside className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-bold text-zinc-100">
              {techLabels ? "PROJECT_MEMBERS" : "Contributors"}
            </h2>
            <div className="space-y-3">
              {project.profiles?.username && (
                <a
                  href={`/builders/${project.profiles.username}`}
                  className="flex gap-3 rounded-sm border border-zinc-800 bg-zinc-900 p-3 hover:border-blue-500/50"
                >
                  <img
                    src={project.profiles.avatar_url || "/images/avatar-1.png"}
                    alt=""
                    className="h-9 w-9 rounded-sm border border-zinc-700 object-cover grayscale"
                  />
                  <div>
                    <p className="font-semibold text-zinc-100">
                      {project.profiles.full_name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {techLabels ? "OWNER_NODE" : "Owner"}
                    </p>
                  </div>
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
                  className="flex gap-3 rounded-sm border border-zinc-800 bg-zinc-900 p-3 hover:border-blue-500/50"
                >
                  <img
                    src={member.profiles?.avatar_url || "/images/avatar-1.png"}
                    alt=""
                    className="h-9 w-9 rounded-sm border border-zinc-700 object-cover grayscale"
                  />
                  <div>
                    <p className="font-semibold text-zinc-100">
                      {member.profiles?.full_name || "Member"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {member.role ||
                        (techLabels ? "ROLE_PENDING" : "Contributor")}
                    </p>
                    {member.contribution_note && (
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                        {member.contribution_note}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </Card>
          {lookingFor.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-bold text-zinc-100">
                {techLabels ? "COLLAB_REQUESTS" : "Looking for"}
              </h2>
              <div className="space-y-2">
                {lookingFor.map((item) => (
                  <button
                    key={`${project.id}-${item.tag}`}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-sm border border-zinc-800 bg-zinc-900 p-3 text-left hover:border-blue-500/50"
                    onClick={() => setSelectedLookingFor(item)}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-zinc-100">
                        {item.tag}
                      </span>
                      <span className="mt-1 line-clamp-1 block text-xs text-zinc-500">
                        {item.message ||
                          (techLabels ? "OPEN_REQUEST_DETAIL" : "Open details")}
                      </span>
                    </span>
                    <MessageCircle
                      size={16}
                      className="shrink-0 text-blue-400"
                    />
                  </button>
                ))}
              </div>
            </Card>
          )}
          {hasProjectLinks && (
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-bold text-zinc-100">
                {techLabels ? "EXTERNAL_ENDPOINTS" : "Links"}
              </h2>
              <div className="space-y-3">
                <ExternalLinkItem
                  href={project.website_url}
                  label="Website"
                  icon={Globe}
                />
                <ExternalLinkItem href={project.demo_url} label="Demo" />
                <ExternalLinkItem
                  href={project.github_url}
                  label="GitHub"
                  icon={Github}
                />
              </div>
            </Card>
          )}
        </aside>
      </section>
    </PageShell>
  );
}

function CommunityProjectCard({ project }: { project: CommunityProject }) {
  const { techLabels } = useTechLabels();
  const count = project.community_project_members?.length ?? 0;
  return (
    <a
      href={`/community-projects/${project.slug}`}
      className="dt-card group flex flex-col p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="font-bold text-zinc-100">{project.name}</h3>
        <span className="rounded-sm border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] font-mono uppercase text-zinc-500">
          {project.status}
        </span>
      </div>
      <p className="mb-5 text-sm leading-relaxed text-zinc-500">
        {project.tagline ||
          project.description ||
          (techLabels ? "COMMUNITY_ARTIFACT" : "Community project.")}
      </p>
      <div className="mt-auto flex items-center justify-between border-t border-zinc-800 pt-4 text-xs font-mono uppercase text-zinc-500">
        <span>{project.category || "Community"}</span>
        <span>
          {techLabels ? `CONTRIBUTORS=${count}` : `${count} contributors`}
        </span>
      </div>
    </a>
  );
}

export function CommunityProjectsDirectoryPage() {
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
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
      setProjects((data as CommunityProject[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = projects.filter((project) => {
    const haystack =
      `${project.name} ${project.tagline ?? ""} ${project.description ?? ""} ${project.category ?? ""}`.toLowerCase();
    return (
      haystack.includes(query.toLowerCase()) &&
      (status === "All" || project.status === status)
    );
  });

  return (
    <PageShell>
      <HeroBlock
        eyebrow={{
          tech: "> SHARED_WORKSTREAMS --public",
          friendly: "Community projects",
        }}
        title={{
          tech: "Query shared workstreams.",
          friendly: "Shared projects and open-source work.",
        }}
        copy={{
          tech: "Platform-maintained project records with member assignments and contribution metadata.",
          friendly:
            "Projects maintained by the platform and assigned to contributing builders by admins.",
        }}
      />
      <section className="container mx-auto px-4 py-12 md:px-6">
        <div className="mb-8 grid gap-3 md:grid-cols-[1fr_220px]">
          <Input
            className={inputClass}
            placeholder="Search community projects..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className={selectClass}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {["All", "proposed", "active", "paused", "completed"].map(
              (item) => (
                <option key={item}>{item}</option>
              ),
            )}
          </select>
        </div>
        {loading ? (
          <SkeletonList />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={{
              tech: "NO_SHARED_WORKSTREAMS",
              friendly: "No community projects yet",
            }}
            copy={{
              tech: "No public community project records match this query.",
              friendly:
                "Admins can create the first community project from the admin area.",
            }}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => (
              <CommunityProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

export function CommunityProjectDetailPage() {
  const { techLabels } = useTechLabels();
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

  if (loading)
    return (
      <PageShell>
        <section className="container mx-auto px-4 py-12 md:px-6">
          <SkeletonList />
        </section>
      </PageShell>
    );
  if (!project)
    return (
      <PageShell>
        <HeroBlock
          eyebrow={{ tech: "WORKSTREAM_RECORD", friendly: "Community project" }}
          title={{
            tech: "WORKSTREAM_NOT_FOUND",
            friendly: "Project not found.",
          }}
          copy={{
            tech: "The requested workstream is private or missing.",
            friendly: "This project is private or does not exist.",
          }}
        />
      </PageShell>
    );

  return (
    <PageShell>
      <HeroBlock
        eyebrow={
          project.category ||
          (techLabels ? "WORKSTREAM_RECORD" : "Community project")
        }
        title={project.name}
        copy={
          project.tagline ||
          project.description ||
          (techLabels ? "Shared execution record." : "Shared community work.")
        }
      />
      <section className="container mx-auto grid gap-6 px-4 py-12 md:px-6 lg:grid-cols-[1fr_340px]">
        <Card className="p-6">
          {project.image_url && (
            <img
              src={project.image_url}
              alt={project.name}
              className="mb-6 aspect-[1200/630] w-full rounded-sm border border-zinc-800 object-cover"
            />
          )}
          <h2 className="mb-3 text-xl font-bold text-zinc-100">
            {techLabels ? "WORKSTREAM_BODY" : "About"}
          </h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-400">
            {project.description ||
              (techLabels ? "DESCRIPTION_FIELD_EMPTY" : "No description yet.")}
          </p>
        </Card>
        <aside className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-bold text-zinc-100">
              {techLabels ? "EXTERNAL_ENDPOINTS" : "Links"}
            </h2>
            <div className="space-y-3">
              <ExternalLinkItem
                href={project.website_url}
                label="Website"
                icon={Globe}
              />
              <ExternalLinkItem
                href={project.repo_url}
                label="Repository"
                icon={Github}
              />
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-bold text-zinc-100">
              {techLabels ? "ASSIGNED_NODES" : "Contributors"}
            </h2>
            <div className="space-y-3">
              {(project.community_project_members ?? []).length === 0 ? (
                <p className="text-sm text-zinc-500">
                  {techLabels
                    ? "NO_ASSIGNED_NODES"
                    : "No contributors assigned yet."}
                </p>
              ) : (
                project.community_project_members?.map((member) => (
                  <a
                    key={member.id}
                    href={
                      member.profiles?.username
                        ? `/builders/${member.profiles.username}`
                        : "/builders"
                    }
                    className="flex gap-3 rounded-sm border border-zinc-800 bg-zinc-900 p-3 hover:border-blue-500/50"
                  >
                    <img
                      src={
                        member.profiles?.avatar_url || "/images/avatar-1.png"
                      }
                      alt=""
                      className="h-9 w-9 rounded-sm border border-zinc-700 object-cover grayscale"
                    />
                    <div>
                      <p className="font-semibold text-zinc-100">
                        {member.profiles?.full_name || "Member"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {member.role || "Contributor"}
                      </p>
                    </div>
                  </a>
                ))
              )}
            </div>
          </Card>
        </aside>
      </section>
    </PageShell>
  );
}

type ProfileFormState = {
  username: string;
  full_name: string;
  headline: string;
  bio: string;
  telegram_handle: string;
  role: string;
  languages: string[];
  skills: string[];
  looking_for: string[];
  website_url: string;
  linkedin_url: string;
  x_url: string;
  github_url: string;
  avatar_url: string;
  cover_url: string;
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  intro_video_url: string;
  visibility: Profile["visibility"];
};

function profileToForm(profile: Profile | null): ProfileFormState {
  const city = profile?.city ?? "";
  const country = profile?.country ?? "Italy";
  const inferredCoords = inferredCoordinateText(city, country);

  return {
    username: profile?.username ?? "",
    full_name: profile?.full_name ?? "",
    headline: profile?.headline ?? "",
    bio: profile?.bio ?? "",
    telegram_handle: profile?.telegram_handle ?? "",
    role: profile?.role ?? "",
    languages: uniqueTags(profile?.languages, maxProfileLanguages),
    skills: uniqueTags(profile?.skills, maxProfileSkills),
    looking_for: uniqueTags(profile?.looking_for, maxProfileLookingFor),
    website_url: profile?.website_url ?? "",
    linkedin_url: profile?.linkedin_url ?? "",
    x_url: profile?.x_url ?? "",
    github_url: profile?.github_url ?? "",
    avatar_url: profile?.avatar_url ?? "",
    cover_url: profile?.cover_url ?? "",
    city,
    country,
    latitude: profile?.latitude?.toString() ?? inferredCoords.latitude,
    longitude: profile?.longitude?.toString() ?? inferredCoords.longitude,
    intro_video_url: profile?.intro_video_url ?? "",
    visibility: profile?.visibility ?? "public",
  };
}

function mergeProfileFormSeed(
  form: ProfileFormState,
  seed?: Partial<ProfileFormState>,
): ProfileFormState {
  if (!seed) return form;
  return {
    ...form,
    ...Object.fromEntries(
      Object.entries(seed).filter(([, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        return value !== undefined && value !== null && value !== "";
      }),
    ),
  } as ProfileFormState;
}

function coordinateValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

type ProfileEditorMode = "edit" | "preview";
type ProfilePreviewDevice = "desktop" | "mobile";

function ProfileModeButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.FC<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-2 rounded-sm px-3 text-sm font-semibold transition-colors ${
        active
          ? "bg-zinc-100 text-zinc-950"
          : "border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100"
      }`}
    >
      <Icon size={15} />
      {children}
    </button>
  );
}

function ProfileEditorView({
  form,
  update,
  userId,
}: {
  form: ProfileFormState;
  update: <K extends keyof ProfileFormState>(
    key: K,
    value: ProfileFormState[K],
  ) => void;
  userId: string;
}) {
  const { techLabels } = useTechLabels();

  function updateCity(value: string) {
    const coords = inferredCoordinateText(value, form.country);
    update("city", value);
    update("latitude", coords.latitude);
    update("longitude", coords.longitude);
  }

  function updateCountry(value: string) {
    const coords = inferredCoordinateText(form.city, value);
    update("country", value);
    update("latitude", coords.latitude);
    update("longitude", coords.longitude);
  }

  return (
    <div className="space-y-6">
      <section className="dt-card overflow-hidden">
        <div className="border-b border-zinc-800 bg-zinc-900/50 p-4 md:p-5">
          <MediaUploadField
            label={{ tech: "COVER_ASSET", friendly: "Cover image" }}
            value={form.cover_url}
            onChange={(url) => update("cover_url", url)}
            userId={userId}
            folder="profile"
            kind="cover"
          />
        </div>
        <div className="grid gap-5 p-4 md:p-5 lg:grid-cols-[240px_1fr]">
          <MediaUploadField
            label={{ tech: "AVATAR_ASSET", friendly: "Avatar" }}
            value={form.avatar_url}
            onChange={(url) => update("avatar_url", url)}
            userId={userId}
            folder="profile"
            kind="avatar"
          />
          <div className="grid content-start gap-4 md:grid-cols-2">
            <Field label={{ tech: "DISPLAY_NAME", friendly: "Full name" }} required>
              <Input
                className={inputClass}
                value={form.full_name}
                onChange={(event) => update("full_name", event.target.value)}
                required
              />
            </Field>
            <Field label={{ tech: "USERNAME_SLUG", friendly: "Username" }} required>
              <Input
                className={inputClass}
                value={form.username}
                onChange={(event) =>
                  update(
                    "username",
                    slugify(event.target.value).replaceAll("-", "_"),
                  )
                }
                required
              />
            </Field>
            <div className="md:col-span-2">
              <Field label={{ tech: "PROFILE_HEADLINE", friendly: "Headline" }} required>
                <Input
                  className={inputClass}
                  value={form.headline}
                  onChange={(event) => update("headline", event.target.value)}
                  required
                />
              </Field>
            </div>
            <Field label={{ tech: "ROLE_VECTOR", friendly: "Role" }} required>
              <Input
                className={inputClass}
                value={form.role}
                onChange={(event) => update("role", event.target.value)}
                required
                placeholder="Founder, Developer, Designer..."
              />
            </Field>
            <Field label={{ tech: "VISIBILITY_STATE", friendly: "Visibility" }}>
              <select
                className={selectClass}
                value={form.visibility}
                onChange={(event) =>
                  update(
                    "visibility",
                    event.target.value as Profile["visibility"],
                  )
                }
              >
                {profileVisibilityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="rounded-sm border border-zinc-800 bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-500 md:col-span-2">
              {visibilityDescription(form.visibility)}
              <span className="mt-2 block text-zinc-600">
                Search engines and scrapers can only see data that the app
                serves publicly. A noindex tag is not a privacy boundary.
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="dt-card p-4 md:p-5">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-zinc-100">
                {techLabels ? "PROFILE_BIO" : "About"}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {techLabels
                  ? "Primary profile payload rendered on the public page."
                  : "The main story on your public profile."}
              </p>
            </div>
            <Field
              label={{
                tech: "BIO_PAYLOAD",
                friendly: "Bio / what you are building",
              }}
              required
            >
              <Textarea
                className={`${textareaClass} min-h-44`}
                value={form.bio}
                onChange={(event) => update("bio", event.target.value)}
                required
              />
            </Field>
          </section>

          <section className="dt-card p-4 md:p-5">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-zinc-100">
                {techLabels ? "EXTERNAL_ENDPOINTS" : "Links"}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {techLabels
                  ? "External URLs rendered beside the profile identity block."
                  : "These appear beside your name on the public page."}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={{ tech: "WEBSITE_URL", friendly: "Website" }}>
                <Input
                  className={inputClass}
                  value={form.website_url}
                  onChange={(event) =>
                    update("website_url", event.target.value)
                  }
                />
              </Field>
              <Field label={{ tech: "GITHUB_URL", friendly: "GitHub" }}>
                <Input
                  className={inputClass}
                  value={form.github_url}
                  onChange={(event) => update("github_url", event.target.value)}
                />
              </Field>
              <Field label={{ tech: "LINKEDIN_URL", friendly: "LinkedIn" }}>
                <Input
                  className={inputClass}
                  value={form.linkedin_url}
                  onChange={(event) =>
                    update("linkedin_url", event.target.value)
                  }
                />
              </Field>
              <Field label={{ tech: "X_URL", friendly: "X" }}>
                <Input
                  className={inputClass}
                  value={form.x_url}
                  onChange={(event) => update("x_url", event.target.value)}
                />
              </Field>
              <div className="md:col-span-2">
                <Field
                  label={{
                    tech: "INTRO_VIDEO_URL",
                    friendly: "Intro video URL",
                  }}
                >
                  <Input
                    className={inputClass}
                    value={form.intro_video_url}
                    onChange={(event) =>
                      update("intro_video_url", event.target.value)
                    }
                  />
                </Field>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="dt-card p-4 md:p-5">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-zinc-100">
                {techLabels ? "PROFILE_META" : "Details"}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {techLabels
                  ? "Sidebar metadata for location and contact fields."
                  : "The sidebar metadata on the profile page."}
              </p>
            </div>
            <div className="space-y-4">
              <Field label={{ tech: "CITY_NODE", friendly: "City" }} required>
                <Input
                  className={inputClass}
                  value={form.city}
                  onChange={(event) => updateCity(event.target.value)}
                  required
                />
              </Field>
              <Field label={{ tech: "COUNTRY_CODE", friendly: "Country" }} required>
                <Input
                  className={inputClass}
                  value={form.country}
                  onChange={(event) => updateCountry(event.target.value)}
                  required
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label={{ tech: "LATITUDE", friendly: "Latitude" }}
                  required
                  hint={
                    techLabels
                      ? "Derived from city and country when recognized."
                      : "Filled from city and country when recognized."
                  }
                >
                  <Input
                    className={inputClass}
                    type="number"
                    inputMode="decimal"
                    min="-90"
                    max="90"
                    step="any"
                    value={form.latitude}
                    onChange={(event) => update("latitude", event.target.value)}
                    placeholder="45.4642"
                    required
                  />
                </Field>
                <Field
                  label={{ tech: "LONGITUDE", friendly: "Longitude" }}
                  required
                  hint={
                    techLabels
                      ? "Derived from city and country when recognized."
                      : "Filled from city and country when recognized."
                  }
                >
                  <Input
                    className={inputClass}
                    type="number"
                    inputMode="decimal"
                    min="-180"
                    max="180"
                    step="any"
                    value={form.longitude}
                    onChange={(event) =>
                      update("longitude", event.target.value)
                    }
                    placeholder="9.1900"
                    required
                  />
                </Field>
              </div>
              <Field
                label={{ tech: "TELEGRAM_HANDLE", friendly: "Telegram handle" }}
                required
              >
                <Input
                  className={inputClass}
                  value={form.telegram_handle}
                  onChange={(event) =>
                    update("telegram_handle", event.target.value)
                  }
                  required
                />
              </Field>
            </div>
          </section>

          <section className="dt-card p-4 md:p-5">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-zinc-100">
                {techLabels ? "PROFILE_TAGS" : "Tags"}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {techLabels
                  ? "Controlled tokens rendered as profile chips."
                  : "Pick from the shared tag lists."}
              </p>
            </div>
            <div className="space-y-4">
              <TagPicker
                label={{ tech: "SKILL_TAGS", friendly: "Skills" }}
                values={form.skills}
                options={profileSkillOptions}
                maxItems={maxProfileSkills}
                onChange={(values) => update("skills", values)}
                placeholder="Search skills and tools"
              />
              <TagPicker
                label={{ tech: "COLLAB_SIGNALS", friendly: "Looking for" }}
                values={form.looking_for}
                options={profileLookingForOptions}
                maxItems={maxProfileLookingFor}
                onChange={(values) => update("looking_for", values)}
                placeholder="Search needs"
              />
              <TagPicker
                label={{ tech: "LANG_STACK", friendly: "Languages" }}
                values={form.languages}
                options={languageOptions}
                maxItems={maxProfileLanguages}
                onChange={(values) => update("languages", values)}
                placeholder="Search languages"
                required
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ProfileDraftPreview({
  form,
  device,
}: {
  form: ProfileFormState;
  device: ProfilePreviewDevice;
}) {
  const { techLabels } = useTechLabels();
  const skills = uniqueTags(form.skills, maxProfileSkills);
  const lookingFor = uniqueTags(form.looking_for, maxProfileLookingFor);
  const languages = uniqueTags(form.languages, maxProfileLanguages);
  const name = form.full_name || "Your name";
  const username = form.username || "username";
  const frameClass =
    device === "mobile"
      ? "mx-auto max-w-[390px] overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950 shadow-2xl"
      : "overflow-hidden rounded-sm border border-zinc-800 bg-zinc-950";
  const innerClass = device === "mobile" ? "max-h-[760px] overflow-y-auto" : "";

  return (
    <div className={frameClass}>
      <div
        className={`dark-technical-theme bg-zinc-950 text-zinc-100 ${innerClass}`}
      >
        <section className="isolate border-b border-zinc-800 bg-zinc-950">
          <div
            className={
              device === "mobile"
                ? "relative z-0 h-32 overflow-hidden bg-zinc-900"
                : "relative z-0 h-44 overflow-hidden bg-zinc-900"
            }
          >
            {form.cover_url ? (
              <img
                src={form.cover_url}
                alt=""
                className="h-full w-full object-cover opacity-70"
              />
            ) : (
              <div className="dt-grid-bg h-full opacity-50" />
            )}
          </div>
          <div
            className={
              device === "mobile"
                ? "relative z-10 px-4 pb-8"
                : "relative z-10 px-6 pb-10"
            }
          >
            <div
              className={
                device === "mobile"
                  ? "-mt-10 flex flex-col gap-4"
                  : "-mt-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
              }
            >
              <div
                className={
                  device === "mobile"
                    ? "flex flex-col gap-4"
                    : "flex flex-col gap-4 md:flex-row md:items-end"
                }
              >
                <img
                  src={form.avatar_url || "/images/avatar-1.png"}
                  alt={name}
                  className="h-24 w-24 rounded-sm border border-zinc-700 bg-zinc-950 object-cover grayscale"
                />
                <div>
                  <p className="mb-2 text-xs font-mono uppercase text-blue-400">
                    @{username}
                  </p>
                  <h1
                    className={
                      device === "mobile"
                        ? "text-3xl font-bold text-zinc-50"
                        : "text-4xl font-bold text-zinc-50"
                    }
                  >
                    {name}
                  </h1>
                  <p className="mt-2 max-w-2xl text-zinc-400">
                    {form.headline || form.role || "Builder"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ExternalLinkItem
                      href={form.website_url}
                      label="Website"
                      icon={Globe}
                      compact
                    />
                    <ExternalLinkItem
                      href={form.github_url}
                      label="GitHub"
                      icon={Github}
                      compact
                    />
                    <ExternalLinkItem
                      href={form.linkedin_url}
                      label="LinkedIn"
                      icon={Linkedin}
                      compact
                    />
                    <ExternalLinkItem
                      href={form.x_url}
                      label="X"
                      icon={Twitter}
                      compact
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className={
            device === "mobile"
              ? "grid gap-5 px-4 py-6"
              : "grid gap-6 px-6 py-8 lg:grid-cols-[1fr_320px]"
          }
        >
          <div className="space-y-5">
            <div className="dt-card rounded-sm p-5">
              <h2 className="mb-3 text-xl font-bold text-zinc-100">
                {techLabels ? "PROFILE_BIO" : "About"}
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-400">
                {form.bio || (techLabels ? "BIO_FIELD_EMPTY" : "No bio yet.")}
              </p>
            </div>
            <div className="dt-card rounded-sm p-5">
              <h2 className="mb-4 text-xl font-bold text-zinc-100">
                {techLabels ? "PERSONAL_ARTIFACTS" : "Personal projects"}
              </h2>
              <p className="text-sm text-zinc-500">
                {techLabels
                  ? "NO_PUBLIC_ARTIFACTS"
                  : "No public personal projects yet."}
              </p>
            </div>
            <div className="dt-card rounded-sm p-5">
              <h2 className="mb-4 text-xl font-bold text-zinc-100">
                {techLabels ? "COMMUNITY_ASSIGNMENTS" : "Community projects"}
              </h2>
              <p className="text-sm text-zinc-500">
                {techLabels
                  ? "NO_ASSIGNMENTS"
                  : "No assigned community projects yet."}
              </p>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="dt-card rounded-sm p-5">
              <h2 className="mb-4 text-xl font-bold text-zinc-100">
                {techLabels ? "PROFILE_META" : "Details"}
              </h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-mono text-xs uppercase text-zinc-600">
                    {techLabels ? "ROLE_VECTOR" : "Role"}
                  </dt>
                  <dd className="text-zinc-300">{form.role || "Builder"}</dd>
                </div>
                <div>
                  <dt className="font-mono text-xs uppercase text-zinc-600">
                    {techLabels ? "GEO_POINT" : "Location"}
                  </dt>
                  <dd className="text-zinc-300">{formLocationLabel(form)}</dd>
                </div>
                {form.telegram_handle && (
                  <div>
                    <dt className="font-mono text-xs uppercase text-zinc-600">
                      {techLabels ? "TELEGRAM_HANDLE" : "Telegram"}
                    </dt>
                    <dd className="text-zinc-300">{form.telegram_handle}</dd>
                  </div>
                )}
              </dl>
            </div>
            <div className="dt-card rounded-sm space-y-4 p-5">
              <div>
                <h3 className="mb-2 font-semibold text-zinc-100">
                  {techLabels ? "SKILL_TAGS" : "Skills"}
                </h3>
                <Tags items={skills} />
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-zinc-100">
                  {techLabels ? "COLLAB_SIGNALS" : "Looking for"}
                </h3>
                <Tags items={lookingFor} />
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-zinc-100">
                  {techLabels ? "LANG_STACK" : "Languages"}
                </h3>
                <Tags items={languages} />
              </div>
            </div>
            {form.intro_video_url && (
              <div className="dt-card rounded-sm p-5">
                <ExternalLinkItem
                  href={form.intro_video_url}
                  label="Intro video"
                />
              </div>
            )}
          </aside>
        </section>
      </div>
    </div>
  );
}

function ProfileForm({
  userId,
  initialProfile,
  inviteToken,
  initialForm,
}: {
  userId: string;
  initialProfile: Profile | null;
  inviteToken?: string;
  initialForm?: Partial<ProfileFormState>;
}) {
  const { techLabels } = useTechLabels();
  const [, navigate] = useLocation();
  const [form, setForm] = useState(() =>
    mergeProfileFormSeed(profileToForm(initialProfile), initialForm),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [invitePassword, setInvitePassword] = useState("");
  const [mode, setMode] = useState<ProfileEditorMode>("edit");
  const [previewDevice, setPreviewDevice] =
    useState<ProfilePreviewDevice>("desktop");

  function update<K extends keyof ProfileFormState>(
    key: K,
    value: ProfileFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    const profileLanguages = uniqueTags(form.languages, maxProfileLanguages);
    const profileSkills = uniqueTags(form.skills, maxProfileSkills);
    const profileLookingFor = uniqueTags(
      form.looking_for,
      maxProfileLookingFor,
    );
    const latitude = coordinateValue(form.latitude);
    const longitude = coordinateValue(form.longitude);

    if (profileLanguages.length === 0) {
      setError("Pick at least one language.");
      setSaving(false);
      return;
    }

    if (latitude === null || longitude === null) {
      setError(
        "Add a city and country with recognized map coordinates, or enter latitude and longitude.",
      );
      setSaving(false);
      return;
    }

    if (inviteToken) {
      if (invitePassword.length < 6) {
        setError("Set a password with at least 6 characters.");
        setSaving(false);
        return;
      }

      const { error: passwordError } = await supabase.auth.updateUser({
        password: invitePassword,
      });
      if (passwordError) {
        setError(passwordError.message);
        setSaving(false);
        return;
      }

      const { error: rpcError } = await supabase.rpc("accept_invite", {
        invite_token: inviteToken,
        profile_username: form.username,
        profile_full_name: form.full_name,
        profile_headline: form.headline,
        profile_bio: form.bio,
        profile_telegram_handle: form.telegram_handle,
        profile_role: form.role,
        profile_languages: profileLanguages,
        profile_skills: profileSkills,
        profile_looking_for: profileLookingFor,
        profile_website_url: normalizeHttpUrlInput(form.website_url) || null,
        profile_linkedin_url:
          normalizeSocialUrl(form.linkedin_url, "https://linkedin.com/in/") ||
          null,
        profile_x_url: normalizeSocialUrl(form.x_url, "https://x.com/") || null,
        profile_github_url:
          normalizeSocialUrl(form.github_url, "https://github.com/") || null,
      });
      if (rpcError) {
        setError(rpcError.message);
      } else {
        await supabase
          .from("profiles")
          .update({
            avatar_url: form.avatar_url || null,
            cover_url: form.cover_url || null,
            city: form.city || null,
            country: form.country || "Italy",
            location: null,
            latitude,
            longitude,
            intro_video_url: normalizeHttpUrlInput(form.intro_video_url) || null,
            visibility: form.visibility,
          })
          .eq("id", userId);
        navigate("/dashboard");
      }
      setSaving(false);
      return;
    }

    const payload = {
      id: userId,
      username: form.username.toLowerCase(),
      full_name: form.full_name,
      headline: form.headline || null,
      bio: form.bio || null,
      telegram_handle: form.telegram_handle || null,
      role: form.role || null,
      languages: profileLanguages,
      skills: profileSkills,
      looking_for: profileLookingFor,
      website_url: normalizeHttpUrlInput(form.website_url) || null,
      linkedin_url:
        normalizeSocialUrl(form.linkedin_url, "https://linkedin.com/in/") ||
        null,
      x_url: normalizeSocialUrl(form.x_url, "https://x.com/") || null,
      github_url:
        normalizeSocialUrl(form.github_url, "https://github.com/") || null,
      avatar_url: form.avatar_url || null,
      cover_url: form.cover_url || null,
      city: form.city || null,
      country: form.country || "Italy",
      location: null,
      latitude,
      longitude,
      intro_video_url: normalizeHttpUrlInput(form.intro_video_url) || null,
      visibility: form.visibility,
      onboarding_completed: true,
    };

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(payload);
    if (upsertError) {
      setError(upsertError.message);
    } else {
      setMessage("Profile saved.");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="dt-card flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-blue-400">
            {techLabels ? "PROFILE_BUILDER" : "Profile builder"}
          </p>
          <h2 className="mt-1 text-xl font-bold text-zinc-100">
            {mode === "preview"
              ? techLabels
                ? "RENDER_PUBLIC_PROFILE"
                : "Preview public page"
              : techLabels
                ? "EDIT_PROFILE_RECORD"
                : "Shape your public page"}
          </h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            <ProfileModeButton
              active={mode === "edit"}
              onClick={() => setMode("edit")}
              icon={PencilLine}
            >
              {techLabels ? "EDIT" : "Edit"}
            </ProfileModeButton>
            <ProfileModeButton
              active={mode === "preview"}
              onClick={() => setMode("preview")}
              icon={Eye}
            >
              {techLabels ? "PREVIEW" : "Preview"}
            </ProfileModeButton>
          </div>
          <Button
            type="submit"
            disabled={saving}
            className="h-9 rounded-sm bg-blue-600 px-4 text-white hover:bg-blue-500"
          >
            {saving
              ? techLabels
                ? "SAVING..."
                : "Saving..."
              : techLabels
                ? "SAVE_PROFILE"
                : "Save profile"}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <StatusMessage message={message} />
        <ActionableErrorMessage message={error} />
      </div>

      {inviteToken && (
        <section className="dt-card p-4 md:p-5">
          <Field
            label={{ tech: "ACCOUNT_PASSWORD", friendly: "Account password" }}
            required
            hint={
              techLabels
                ? "Set the password for future member login."
                : "Set the password you will use to sign in later."
            }
          >
            <Input
              className={inputClass}
              type="password"
              value={invitePassword}
              onChange={(event) => setInvitePassword(event.target.value)}
              required
              minLength={6}
            />
          </Field>
        </section>
      )}

      {mode === "preview" ? (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <ProfileModeButton
              active={previewDevice === "desktop"}
              onClick={() => setPreviewDevice("desktop")}
              icon={Monitor}
            >
              {techLabels ? "DESKTOP" : "Desktop"}
            </ProfileModeButton>
            <ProfileModeButton
              active={previewDevice === "mobile"}
              onClick={() => setPreviewDevice("mobile")}
              icon={Smartphone}
            >
              {techLabels ? "MOBILE" : "Mobile"}
            </ProfileModeButton>
          </div>
          <ProfileDraftPreview form={form} device={previewDevice} />
        </div>
      ) : (
        <ProfileEditorView form={form} update={update} userId={userId} />
      )}
    </form>
  );
}

export function InvitePage() {
  const { techLabels } = useTechLabels();
  const params = useParams<{ token: string }>();
  const { user, loading: sessionLoading } = useSupabaseSession();
  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = useMyProfile(user?.id);
  const [invite, setInvite] = useState<InviteLookup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!supabase || !params.token) {
        setLoading(false);
        return;
      }
      const { data, error: queryError } = await supabase.rpc(
        "get_invite_by_token",
        { invite_token: params.token },
      );
      setInvite(
        ((data as InviteLookup[] | null)?.[0] ?? null) as InviteLookup | null,
      );
      setError(getError(queryError));
      setLoading(false);
    }
    load();
  }, [params.token]);

  const inviteEmail = invite?.email ?? null;
  const authLoading = sessionLoading || profileLoading;
  const signedInAs = user?.email || profile?.email || null;
  const inviteBlockedByExistingProfile = Boolean(user && profile && invite);
  const inviteBlockedByProfileError = Boolean(user && invite && profileError);

  return (
    <PageShell>
      <HeroBlock
        eyebrow={{ tech: "INVITE_TOKEN", friendly: "Invite" }}
        title={{
          tech: "Accept invite token.",
          friendly: "Accept your Italian Builders invite.",
        }}
        copy={{
          tech: "Authenticate or create the invited account, then complete the public profile record.",
          friendly:
            "Sign in or create your account, then complete the profile fields needed for your public page.",
        }}
      />
      <section className="container mx-auto grid gap-6 px-4 py-12 md:px-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          {loading ? (
            <SkeletonList />
          ) : invite ? (
            <Card className="p-6">
              <h2 className="mb-2 text-xl font-bold text-zinc-100">
                {techLabels ? "INVITE_FOUND" : "Invite found"}
              </h2>
              <p className="text-sm text-zinc-500">
                {techLabels ? "Target" : "For"}{" "}
                {invite.email ||
                  invite.telegram_handle ||
                  (techLabels ? "invited_node" : "invited member")}
              </p>
            </Card>
          ) : (
            <StatusMessage
              message={
                error ||
                "This invite is invalid, expired, revoked, or already used."
              }
              tone="error"
            />
          )}
          {!authLoading && !user && (
            <SignInPanel
              compact
              allowSignup
              invitedEmail={inviteEmail}
            />
          )}
        </div>
        {inviteBlockedByExistingProfile ? (
          <Card className="space-y-5 p-6 text-sm text-zinc-500">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 shrink-0" size={18} />
              <div>
                <h2 className="text-lg font-bold text-zinc-100">
                  {techLabels ? "ACCOUNT_ALREADY_ACTIVE" : "Already signed in"}
                </h2>
                <p className="mt-2 leading-relaxed">
                  {techLabels
                    ? "Active member session detected. Existing profiles cannot accept or mint another invite-bound account."
                    : "You are already signed in with an approved member account. Sign out before using an invite for another account."}
                </p>
                {signedInAs && (
                  <p className="mt-2 font-mono text-xs text-zinc-600">
                    {techLabels ? "SESSION_EMAIL" : "Signed in as"}{" "}
                    {signedInAs}
                  </p>
                )}
                <ActionableErrorMessage message={profileError} />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href="/dashboard"
                className="inline-flex h-10 items-center justify-center rounded-sm bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500"
              >
                {techLabels ? "OPEN_DASHBOARD" : "Open dashboard"}
              </a>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-sm border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-900"
                onClick={async () => {
                  await supabase?.auth.signOut();
                  window.location.reload();
                }}
              >
                {techLabels ? "SIGN_OUT" : "Sign out"}
              </Button>
            </div>
          </Card>
        ) : inviteBlockedByProfileError ? (
          <Card className="space-y-4 p-6 text-sm text-zinc-500">
            <div className="flex items-center gap-3">
              <Lock size={18} />
              <span>
                {techLabels
                  ? "PROFILE_CHECK_FAILED"
                  : "Could not verify this session."}
              </span>
            </div>
            <ActionableErrorMessage
              message={
                profileError ||
                "Could not confirm whether this account already has a profile."
              }
            />
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-sm border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-900"
              onClick={async () => {
                await supabase?.auth.signOut();
                window.location.reload();
              }}
            >
              {techLabels ? "SIGN_OUT" : "Sign out"}
            </Button>
          </Card>
        ) : user && invite?.id ? (
          <ProfileForm
            userId={user.id}
            initialProfile={null}
            inviteToken={params.token}
            initialForm={inviteToProfileForm(invite)}
          />
        ) : user && invite ? (
          <Card className="space-y-4 p-6 text-sm text-zinc-500">
            <div className="flex items-center gap-3">
              <Lock size={18} />
              <span>
                {techLabels
                  ? "SIGNED_IN_ACCOUNT_CANNOT_ACCEPT_INVITE"
                  : "This signed-in account cannot accept this invite."}
              </span>
            </div>
            <p>
              {techLabels
                ? "Invite access is bound to the email that received the invite. Sign out, then open this invite with that email."
                : "The invite exists, but it is bound to the email address that received it. Sign out, then open this link again with that same email."}
            </p>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-sm border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-900"
              onClick={async () => {
                await supabase?.auth.signOut();
                window.location.reload();
              }}
            >
              {techLabels ? "SIGN_OUT" : "Sign out"}
            </Button>
          </Card>
        ) : (
          <Card className="flex items-center gap-3 p-6 text-sm text-zinc-500">
            <Lock size={18} />{" "}
            {authLoading
              ? techLabels
                ? "LOADING_SESSION"
                : "Checking your session..."
              : techLabels
                ? "Authenticate with the invited account to complete onboarding."
                : "Sign in with the invited account to complete onboarding."}
          </Card>
        )}
      </section>
    </PageShell>
  );
}

type InviteLookup = Pick<Invite, "telegram_handle" | "status" | "expires_at"> & {
  id: string | null;
  email: string | null;
  waitlist_name: string | null;
  waitlist_role: string | null;
  waitlist_building: string | null;
  waitlist_telegram_handle: string | null;
  waitlist_x_handle: string | null;
  waitlist_linkedin: string | null;
  waitlist_website: string | null;
  waitlist_project_url: string | null;
};

function inviteToProfileForm(
  invite: InviteLookup | null,
): Partial<ProfileFormState> {
  if (!invite) return {};

  return {
    full_name: invite.waitlist_name ?? "",
    headline: invite.waitlist_role ?? "",
    bio: invite.waitlist_building ?? "",
    telegram_handle:
      invite.waitlist_telegram_handle ?? invite.telegram_handle ?? "",
    role: invite.waitlist_role ?? "",
    website_url: normalizeHttpUrlInput(
      invite.waitlist_website ?? invite.waitlist_project_url,
    ),
    linkedin_url: normalizeSocialUrl(
      invite.waitlist_linkedin,
      "https://www.linkedin.com/",
    ),
    x_url: normalizeSocialUrl(invite.waitlist_x_handle, "https://x.com/"),
  };
}

export function DashboardPage() {
  const { techLabels } = useTechLabels();

  return (
    <RequireAuth>
      {({ profile }) => (
        <PageShell>
          <HeroBlock
            eyebrow={{ tech: "MEMBER_CONSOLE", friendly: "Dashboard" }}
            title={
              techLabels
                ? "Member control plane."
                : `Welcome${profile?.full_name ? `, ${profile.full_name}` : ""}.`
            }
            copy={{
              tech: "Manage profile records, personal artifacts and community assignments.",
              friendly:
                "Manage your profile, personal projects and community project assignments.",
            }}
          />
          <section className="container mx-auto grid gap-4 px-4 py-12 md:grid-cols-2 md:px-6 xl:grid-cols-5">
            <a href="/dashboard/profile" className="dt-card p-5">
              <h2 className="mb-2 font-bold text-zinc-100">
                {techLabels ? "PROFILE_RECORD" : "Profile"}
              </h2>
              <p className="text-sm text-zinc-500">
                {techLabels
                  ? "Edit public profile metadata and endpoints."
                  : "Edit public profile and social links."}
              </p>
            </a>
            <a href="/dashboard/projects" className="dt-card p-5">
              <h2 className="mb-2 font-bold text-zinc-100">
                {techLabels ? "ARTIFACTS" : "Projects"}
              </h2>
              <p className="text-sm text-zinc-500">
                {techLabels
                  ? "Create, edit and publish personal artifact records."
                  : "Create, edit and publish personal projects."}
              </p>
            </a>
            <a href="/dashboard/contributions" className="dt-card p-5">
              <h2 className="mb-2 font-bold text-zinc-100">
                {techLabels ? "CONTRIBUTION_ROLES" : "Contribution roles"}
              </h2>
              <p className="text-sm text-zinc-500">
                {techLabels
                  ? "Set role metadata for invited project records."
                  : "Add your role on projects where you are listed as a contributor."}
              </p>
            </a>
            {profile?.username && (
              <a href={`/builders/${profile.username}`} className="dt-card p-5">
                <h2 className="mb-2 font-bold text-zinc-100">
                  {techLabels ? "PUBLIC_RENDER" : "Public page"}
                </h2>
                <p className="text-sm text-zinc-500">
                  {techLabels
                    ? "Open the public profile render."
                    : "Open your link-in-bio profile."}
                </p>
              </a>
            )}
            {(profile?.platform_role === "admin" ||
              profile?.platform_role === "owner") && (
              <a href="/admin" className="dt-card p-5">
                <h2 className="mb-2 font-bold text-zinc-100">
                  {techLabels ? "ADMIN_CONSOLE" : "Admin"}
                </h2>
                <p className="text-sm text-zinc-500">
                  {techLabels
                    ? "Invites, members and shared workstreams."
                    : "Invites, members and community projects."}
                </p>
              </a>
            )}
          </section>
        </PageShell>
      )}
    </RequireAuth>
  );
}

function DeleteAccountPanel({ email }: { email?: string | null }) {
  const { techLabels } = useTechLabels();
  const { user } = useSupabaseSession();
  const accountEmail = (user?.email || email || "").trim().toLowerCase();
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmationMatches =
    accountEmail.length > 0 &&
    confirmation.trim().toLowerCase() === accountEmail;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    if (!supabase) {
      setError("The community backend is not configured in this deployment.");
      setSaving(false);
      return;
    }

    if (!confirmationMatches) {
      setError("Type your account email to confirm deletion.");
      setSaving(false);
      return;
    }

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setError(
        "Your session expired. Sign in again before deleting the account.",
      );
      setSaving(false);
      return;
    }

    const response = await fetch("/api/account/delete", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: confirmation }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(
        typeof result.error === "string"
          ? result.error
          : "Could not delete account.",
      );
      setSaving(false);
      return;
    }

    await supabase.auth.signOut();
    window.location.assign("/");
  }

  return (
    <Card className="border-red-500/30 bg-red-950/10 p-6">
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 shrink-0 text-red-300" size={18} />
          <div>
            <h2 className="text-lg font-bold text-zinc-100">
              {techLabels ? "DELETE_ACCOUNT" : "Delete account"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {techLabels
                ? "Hard-delete auth identity, profile record and owned project records. Community projects are retained."
                : "This permanently deletes your account, public profile and personal projects. Community projects are not deleted, including projects where you only participate."}
            </p>
          </div>
        </div>
        <Field
          label={{
            tech: "CONFIRM_ACCOUNT_EMAIL",
            friendly: "Type your email to confirm",
          }}
        >
          <Input
            className={inputClass}
            type="email"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={accountEmail || "you@example.com"}
            autoComplete="email"
            required
          />
        </Field>
        <ActionableErrorMessage message={error} />
        <Button
          type="submit"
          disabled={!confirmationMatches || saving}
          className="h-10 rounded-sm bg-red-600 text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? techLabels
              ? "DELETING..."
              : "Deleting..."
            : techLabels
              ? "DELETE_ACCOUNT"
              : "Delete account"}
        </Button>
      </form>
    </Card>
  );
}

export function DashboardProfilePage() {
  const { techLabels } = useTechLabels();

  return (
    <RequireAuth>
      {({ userId, profile }) => (
        <PageShell>
          <HeroBlock
            eyebrow={{ tech: "PROFILE_RECORD", friendly: "Profile" }}
            title={{
              tech: "Edit profile record.",
              friendly: "Edit your public profile.",
            }}
            copy={{
              tech: "This record powers the public builder render and artifact attribution.",
              friendly:
                "This information powers your public builder page and project attribution.",
            }}
          />
          <section className="container mx-auto px-4 py-12 md:px-6">
            {profile ? (
              <div className="space-y-8">
                <ProfileForm userId={userId} initialProfile={profile} />
                <DeleteAccountPanel email={profile.email} />
              </div>
            ) : (
              <Card className="p-6">
                <h2 className="mb-2 text-xl font-bold text-zinc-100">
                  {techLabels ? "INVITE_REQUIRED" : "Invite required"}
                </h2>
                <p className="mb-5 text-sm leading-relaxed text-zinc-500">
                  {techLabels
                    ? "Auth account exists, but member approval is invite-gated. Open the invite link to mint the profile record."
                    : "Your auth account exists, but this platform is invite-only. Open your invite link to complete approval and create your profile."}
                </p>
                <a
                  href="/join"
                  className="inline-flex h-10 items-center rounded-sm bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  {techLabels ? "REQUEST_ACCESS" : "Request access"}
                </a>
              </Card>
            )}
          </section>
        </PageShell>
      )}
    </RequireAuth>
  );
}

type ProjectFormState = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  status: Project["status"];
  website_url: string;
  github_url: string;
  demo_url: string;
  image_url: string;
  looking_for: ProjectLookingFor[];
  contributor_handles: string;
  is_open_source: boolean;
  is_public: boolean;
};

function projectToForm(project: Project | null): ProjectFormState {
  return {
    name: project?.name ?? "",
    slug: project?.slug ?? "",
    tagline: project?.tagline ?? "",
    description: project?.description ?? "",
    category: project?.category ?? "",
    status: project?.status ?? "building",
    website_url: project?.website_url ?? "",
    github_url: project?.github_url ?? "",
    demo_url: project?.demo_url ?? "",
    image_url: project?.image_url ?? "",
    looking_for: cleanLookingForItems(project?.looking_for),
    contributor_handles: "",
    is_open_source: project?.is_open_source ?? false,
    is_public: project?.is_public ?? true,
  };
}

async function resolveProjectContributorProfiles(handles: string[]) {
  if (!supabase || handles.length === 0) return;

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, username")
    .in("username", handles);
  if (profileError) throw profileError;

  const profileRows = (profiles as Pick<Profile, "id" | "username">[]) ?? [];
  const foundHandles = new Set(profileRows.map((profile) => profile.username));
  const missing = handles.filter((handle) => !foundHandles.has(handle));
  if (missing.length > 0) {
    throw new Error(`No public member found for @${missing.join(", @")}.`);
  }

  return profileRows;
}

async function inviteProjectMembers({
  projectId,
  ownerId,
  profiles,
}: {
  projectId: string;
  ownerId: string;
  profiles: Pick<Profile, "id" | "username">[];
}) {
  if (!supabase || profiles.length === 0) return 0;

  const rows = profiles
    .filter((profile) => profile.id !== ownerId)
    .map((profile) => ({
      project_id: projectId,
      profile_id: profile.id,
      invited_by: ownerId,
    }));
  if (rows.length === 0) return 0;

  const { data, error: inviteError } = await supabase
    .from("project_members")
    .upsert(rows, { onConflict: "project_id,profile_id" })
    .select("id, profile_id");
  if (inviteError) throw inviteError;

  return data?.length ?? rows.length;
}

async function inviteProjectMembersByHandle({
  projectId,
  ownerId,
  handles,
}: {
  projectId: string;
  ownerId: string;
  handles: string[];
}) {
  const profiles = await resolveProjectContributorProfiles(handles);
  return inviteProjectMembers({ projectId, ownerId, profiles: profiles ?? [] });
}

function ProjectEditor({
  userId,
  project,
}: {
  userId: string;
  project: Project | null;
}) {
  const { techLabels } = useTechLabels();
  const [, navigate] = useLocation();
  const [form, setForm] = useState(() => projectToForm(project));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fetchingOgImage, setFetchingOgImage] = useState(false);
  const [ogImageMessage, setOgImageMessage] = useState<string | null>(null);

  function update<K extends keyof ProjectFormState>(
    key: K,
    value: ProjectFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function preferredProjectUrl(current = form) {
    return (
      normalizeHttpUrlInput(current.website_url) ||
      normalizeHttpUrlInput(current.demo_url) ||
      normalizeSocialUrl(current.github_url, "https://github.com/") ||
      ""
    );
  }

  async function importOpenGraphImage(
    current = form,
    { silent = false }: { silent?: boolean } = {},
  ) {
    if (!supabase) return;
    const targetUrl = preferredProjectUrl(current);
    if (!targetUrl) {
      if (!silent)
        setError(
          "Add a website, demo, or GitHub URL before importing an Open Graph image.",
        );
      return;
    }

    setFetchingOgImage(true);
    if (!silent) setOgImageMessage(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setFetchingOgImage(false);
      setError("Sign in again before importing an Open Graph image.");
      return;
    }

    try {
      const response = await fetch("/api/og-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: targetUrl, userId }),
      });
      const payload = (await response.json()) as {
        imageUrl?: string;
        error?: string;
      };
      if (!response.ok || !payload.imageUrl) {
        if (!silent)
          setError(payload.error || "No Open Graph image could be imported.");
        return;
      }
      update("image_url", payload.imageUrl);
      setError(null);
      setOgImageMessage("Open Graph image uploaded.");
    } catch (importError) {
      if (!silent)
        setError(getError(importError) || "Could not import Open Graph image.");
    } finally {
      setFetchingOgImage(false);
    }
  }

  function updateProjectUrl<
    K extends "website_url" | "github_url" | "demo_url",
  >(key: K, value: string) {
    const next = { ...form, [key]: value };
    setForm(next);
  }

  function maybeImportOpenGraphImage() {
    if (form.image_url || fetchingOgImage || !preferredProjectUrl()) return;
    importOpenGraphImage(form, { silent: true });
  }

  function addLookingForItem() {
    setForm((current) => ({
      ...current,
      looking_for: [
        ...current.looking_for,
        { tag: lookingForOptions[0], message: "" },
      ].slice(0, maxLookingForItems),
    }));
  }

  function updateLookingForItem(
    index: number,
    key: keyof ProjectLookingFor,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      looking_for: current.looking_for.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]:
                key === "message"
                  ? value.slice(0, maxLookingForMessageLength)
                  : value,
            }
          : item,
      ),
    }));
  }

  function removeLookingForItem(index: number) {
    setForm((current) => ({
      ...current,
      looking_for: current.looking_for.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setError(null);
    const payload = {
      owner_id: userId,
      name: form.name,
      slug: form.slug || slugify(form.name),
      tagline: form.tagline || null,
      description: form.description || null,
      category: form.category || null,
      status: form.status,
      website_url: normalizeHttpUrlInput(form.website_url) || null,
      github_url:
        normalizeSocialUrl(form.github_url, "https://github.com/") || null,
      demo_url: normalizeHttpUrlInput(form.demo_url) || null,
      image_url: form.image_url || null,
      looking_for: cleanLookingForItems(form.looking_for),
      is_open_source: form.is_open_source,
      is_public: form.is_public,
    };
    try {
      const handles = splitCommunityHandles(form.contributor_handles);
      const contributorProfiles =
        handles.length > 0
          ? await resolveProjectContributorProfiles(handles)
          : [];
      const result = project
        ? await supabase
            .from("projects")
            .update(payload)
            .eq("id", project.id)
            .select("id")
            .single()
        : await supabase.from("projects").insert(payload).select("id").single();
      if (result.error) {
        setError(result.error.message);
        setSaving(false);
        return;
      }

      const projectId = (result.data as { id: string } | null)?.id;
      if (projectId && contributorProfiles && contributorProfiles.length > 0) {
        try {
          await inviteProjectMembers({
            projectId,
            ownerId: userId,
            profiles: contributorProfiles,
          });
        } catch (inviteError) {
          setError(
            `Project saved, but contributors were not invited: ${getError(inviteError) || "unknown error"}`,
          );
          return;
        }
      }
      navigate(
        project ? "/dashboard/projects" : `/dashboard/projects/${projectId}`,
      );
    } catch (submitError) {
      setError(getError(submitError) || "Project could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <Field label={{ tech: "ARTIFACT_NAME", friendly: "Name" }}>
          <Input
            className={inputClass}
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            onBlur={() => !form.slug && update("slug", slugify(form.name))}
            required
          />
        </Field>
        <Field label={{ tech: "ARTIFACT_SLUG", friendly: "Slug" }}>
          <Input
            className={inputClass}
            value={form.slug}
            onChange={(event) => update("slug", slugify(event.target.value))}
            required
          />
        </Field>
        <Field label={{ tech: "TAGLINE", friendly: "Tagline" }}>
          <Input
            className={inputClass}
            value={form.tagline}
            onChange={(event) => update("tagline", event.target.value)}
          />
        </Field>
        <Field label={{ tech: "CATEGORY_TAG", friendly: "Category" }}>
          <Input
            className={inputClass}
            value={form.category}
            onChange={(event) => update("category", event.target.value)}
          />
        </Field>
        <Field label={{ tech: "STATUS_STATE", friendly: "Status" }}>
          <select
            className={selectClass}
            value={form.status}
            onChange={(event) =>
              update("status", event.target.value as Project["status"])
            }
          >
            {["idea", "building", "beta", "live", "revenue", "paused"].map(
              (item) => (
                <option key={item}>{item}</option>
              ),
            )}
          </select>
        </Field>
        <div className="space-y-3">
          <MediaUploadField
            label={{ tech: "ARTIFACT_IMAGE", friendly: "Project image" }}
            value={form.image_url}
            onChange={(url) => update("image_url", url)}
            userId={userId}
            folder="projects"
            kind="project"
          />
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-sm border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-900"
            disabled={fetchingOgImage || !preferredProjectUrl()}
            onClick={() => importOpenGraphImage()}
          >
            {fetchingOgImage
              ? techLabels
                ? "IMPORTING..."
                : "Importing..."
              : techLabels
                ? "IMPORT_OG_IMAGE"
                : "Use Open Graph image"}
          </Button>
          <StatusMessage message={ogImageMessage} />
        </div>
        <Field label={{ tech: "WEBSITE_URL", friendly: "Website" }}>
          <Input
            className={inputClass}
            value={form.website_url}
            onChange={(event) =>
              updateProjectUrl("website_url", event.target.value)
            }
            onBlur={maybeImportOpenGraphImage}
          />
        </Field>
        <Field label={{ tech: "GITHUB_URL", friendly: "GitHub" }}>
          <Input
            className={inputClass}
            value={form.github_url}
            onChange={(event) =>
              updateProjectUrl("github_url", event.target.value)
            }
            onBlur={maybeImportOpenGraphImage}
          />
        </Field>
        <Field label={{ tech: "DEMO_URL", friendly: "Demo" }}>
          <Input
            className={inputClass}
            value={form.demo_url}
            onChange={(event) =>
              updateProjectUrl("demo_url", event.target.value)
            }
            onBlur={maybeImportOpenGraphImage}
          />
        </Field>
        <div className="flex items-center gap-6 pt-6 text-sm text-zinc-300">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(event) => update("is_public", event.target.checked)}
            />{" "}
            {techLabels ? "PUBLIC_RECORD" : "Public"}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_open_source}
              onChange={(event) =>
                update("is_open_source", event.target.checked)
              }
            />{" "}
            {techLabels ? "OPEN_SOURCE" : "Open source"}
          </label>
        </div>
        <div className="md:col-span-2">
          <Field
            label={{
              tech: "CONTRIBUTOR_HANDLES",
              friendly: project ? "Invite contributors" : "Contributor handles",
            }}
            hint={
              techLabels
                ? "Use community usernames. Contributors can set role metadata from their dashboard."
                : "Use community handles like @mario, @giulia. Contributors can add their own role from their dashboard."
            }
          >
            <Input
              className={inputClass}
              value={form.contributor_handles}
              onChange={(event) =>
                update("contributor_handles", event.target.value)
              }
              placeholder="@handle, @another_handle"
            />
          </Field>
        </div>
        <div className="space-y-3 md:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              {techLabels ? "COLLAB_REQUESTS" : "Looking for"}
            </span>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-sm border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-900"
              disabled={form.looking_for.length >= maxLookingForItems}
              onClick={addLookingForItem}
            >
              <Plus size={14} /> {techLabels ? "ADD_REQUEST" : "Add need"}
            </Button>
          </div>
          {form.looking_for.length === 0 ? (
            <div className="rounded-sm border border-dashed border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-500">
              {techLabels ? "NO_COLLAB_REQUESTS" : "No project needs added."}
            </div>
          ) : (
            <div className="space-y-3">
              {form.looking_for.map((item, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-sm border border-zinc-800 bg-zinc-950 p-3 md:grid-cols-[220px_1fr_auto]"
                >
                  <select
                    className={selectClass}
                    value={item.tag}
                    onChange={(event) =>
                      updateLookingForItem(index, "tag", event.target.value)
                    }
                  >
                    {lookingForOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <div className="space-y-1">
                    <Textarea
                      className={`${textareaClass} min-h-20`}
                      value={item.message}
                      maxLength={maxLookingForMessageLength}
                      onChange={(event) =>
                        updateLookingForItem(
                          index,
                          "message",
                          event.target.value,
                        )
                      }
                      placeholder={
                        techLabels
                          ? "Request context payload."
                          : "Short context for people who might help."
                      }
                    />
                    <p className="text-right text-[11px] font-mono text-zinc-600">
                      {item.message.length}/{maxLookingForMessageLength}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-sm border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-900 md:w-10 md:px-0"
                    onClick={() => removeLookingForItem(index)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <Field label={{ tech: "DESCRIPTION_BODY", friendly: "Description" }}>
            <Textarea
              className={textareaClass}
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <ActionableErrorMessage message={error} />
          <Button
            className="mt-3 h-10 rounded-sm bg-blue-600 text-white hover:bg-blue-500"
            disabled={saving}
          >
            {saving
              ? techLabels
                ? "SAVING..."
                : "Saving..."
              : techLabels
                ? "SAVE_ARTIFACT"
                : "Save project"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ProjectContributorsPanel({
  project,
  members,
  userId,
  onChange,
}: {
  project: Project;
  members: ProjectMember[];
  userId: string;
  onChange: () => void;
}) {
  const { techLabels } = useTechLabels();
  const [handle, setHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    const handles = splitCommunityHandles(handle);
    if (handles.length === 0) return;
    setError(null);
    setMessage(null);
    try {
      const invitedCount = await inviteProjectMembersByHandle({
        projectId: project.id,
        ownerId: userId,
        handles,
      });
      setHandle("");
      setMessage(
        invitedCount === 1
          ? "Contributor invited."
          : `${invitedCount ?? handles.length} contributors invited.`,
      );
      onChange();
    } catch (inviteError) {
      setError(getError(inviteError) || "Could not invite contributor.");
    }
  }

  async function remove(id: string) {
    if (!supabase || !confirm("Remove this contributor from the project?")) {
      return;
    }
    const { error: deleteError } = await supabase
      .from("project_members")
      .delete()
      .eq("id", id);
    if (deleteError) setError(deleteError.message);
    else onChange();
  }

  return (
    <Card className="p-6">
      <h2 className="mb-2 text-xl font-bold text-zinc-100">
        {techLabels ? "PROJECT_MEMBERS" : "Contributors"}
      </h2>
      <p className="mb-5 text-sm leading-relaxed text-zinc-500">
        {techLabels
          ? "Invite public member handles. Each member edits their own role vector."
          : "Invite existing community members by handle. Each contributor can add their own role from the dashboard."}
      </p>
      <form onSubmit={invite} className="mb-6 space-y-3">
        <Field
          label={{ tech: "COMMUNITY_HANDLE", friendly: "Community handle" }}
        >
          <Input
            className={inputClass}
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            placeholder="@handle"
            required
          />
        </Field>
        <StatusMessage message={message} />
        <ActionableErrorMessage message={error} />
        <Button className="h-10 rounded-sm bg-blue-600 text-white hover:bg-blue-500">
          <UserPlus size={15} />{" "}
          {techLabels ? "INVITE_MEMBER" : "Invite contributor"}
        </Button>
      </form>
      <div className="space-y-3">
        {members.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {techLabels ? "NO_PROJECT_MEMBERS" : "No contributors invited yet."}
          </p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-start justify-between gap-3 rounded-sm border border-zinc-800 bg-zinc-900 p-3"
            >
              <div>
                <p className="font-semibold text-zinc-100">
                  {member.profiles?.full_name ||
                    (techLabels ? "MEMBER_NODE" : "Member")}
                </p>
                <p className="text-xs text-zinc-500">
                  @{member.profiles?.username || "handle"} ·{" "}
                  {member.role ||
                    (techLabels ? "ROLE_PENDING" : "role pending")}
                </p>
                {member.contribution_note && (
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    {member.contribution_note}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                className="h-8 text-zinc-400 hover:text-zinc-100"
                onClick={() => remove(member.id)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export function DashboardProjectsPage() {
  return (
    <RequireAuth>
      {({ userId }) => <DashboardProjectsInner userId={userId} />}
    </RequireAuth>
  );
}

function DashboardProjectsInner({ userId }: { userId: string }) {
  const { techLabels } = useTechLabels();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("projects")
      .select("*, project_members(id)")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    setProjects((data as Project[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [userId]);

  async function remove(id: string) {
    if (!supabase || !confirm("Delete this project?")) return;
    await supabase.from("projects").delete().eq("id", id);
    load();
  }

  return (
    <PageShell>
      <HeroBlock
        eyebrow={{ tech: "ARTIFACTS", friendly: "Projects" }}
        title={{
          tech: "Manage artifact records.",
          friendly: "Manage your personal projects.",
        }}
        copy={{
          tech: "Artifacts can render publicly on your profile or remain private drafts.",
          friendly:
            "Projects can be public on your profile, or private drafts in your dashboard.",
        }}
        action={
          <a
            href="/dashboard/projects/new"
            className="inline-flex h-10 items-center gap-2 rounded-sm bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500"
          >
            <Plus size={16} /> {techLabels ? "NEW_ARTIFACT" : "New project"}
          </a>
        }
      />
      <section className="container mx-auto px-4 py-12 md:px-6">
        {loading ? (
          <SkeletonList />
        ) : projects.length === 0 ? (
          <EmptyState
            title={{ tech: "NO_ARTIFACTS", friendly: "No projects yet" }}
            copy={{
              tech: "Create the first artifact record for your public profile.",
              friendly:
                "Create your first project to add it to your public profile.",
            }}
          />
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h2 className="font-bold text-zinc-100">{project.name}</h2>
                  <p className="text-sm text-zinc-500">
                    {project.status} ·{" "}
                    {project.is_public
                      ? techLabels
                        ? "public_record"
                        : "public"
                      : techLabels
                        ? "private_draft"
                        : "private"}{" "}
                    · {project.project_members?.length ?? 0}{" "}
                    {techLabels ? "contributors" : "contributors"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/dashboard/projects/${project.id}`}
                    className="inline-flex h-9 items-center rounded-sm border border-zinc-800 px-3 text-sm text-zinc-200 hover:bg-zinc-900"
                  >
                    {techLabels ? "EDIT" : "Edit"}
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-sm border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-900"
                    onClick={() => remove(project.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

export function DashboardContributionsPage() {
  return (
    <RequireAuth>
      {({ userId }) => <DashboardContributionsInner userId={userId} />}
    </RequireAuth>
  );
}

function DashboardContributionsInner({ userId }: { userId: string }) {
  const { techLabels } = useTechLabels();
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [communityMembers, setCommunityMembers] = useState<
    CommunityProjectMember[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [communityError, setCommunityError] = useState<string | null>(null);

  async function load() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [projectResult, communityResult] = await Promise.all([
      supabase
        .from("project_members")
        .select(
          "*, projects(*, profiles(username, full_name, avatar_url, headline, telegram_handle))",
        )
        .eq("profile_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("community_project_members")
        .select("*, community_projects(*)")
        .eq("profile_id", userId)
        .order("created_at", { ascending: false }),
    ]);
    setProjectMembers((projectResult.data as ProjectMember[]) ?? []);
    setCommunityMembers(
      (communityResult.data as CommunityProjectMember[]) ?? [],
    );
    setProjectError(getError(projectResult.error));
    setCommunityError(getError(communityResult.error));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [userId]);

  return (
    <PageShell>
      <HeroBlock
        eyebrow={{ tech: "CONTRIBUTION_ROLES", friendly: "Contribution roles" }}
        title={{
          tech: "Annotate project membership.",
          friendly: "Add your role on shared projects.",
        }}
        copy={{
          tech: "These role vectors appear on project pages and your public profile.",
          friendly:
            "These roles appear on project pages and on your public profile.",
        }}
      />
      <section className="container mx-auto space-y-8 px-4 py-12 md:px-6">
        {loading ? (
          <SkeletonList />
        ) : (
          <>
            <ContributionSection
              title={
                techLabels ? "PERSONAL_PROJECT_INVITES" : "Project invitations"
              }
              error={projectError}
              empty={
                techLabels
                  ? "NO_PROJECT_INVITES: create or open a project, then invite this member handle from the contributors panel."
                  : "No project invitations yet. A project owner needs to add your handle from the project editor before you can describe your role."
              }
              emptyAction={
                <InlineActionLink href="/dashboard/projects">
                  {techLabels ? "OPEN_ARTIFACTS" : "Open your projects"}
                </InlineActionLink>
              }
            >
              {projectMembers.map((member) => (
                <ContributionRoleCard
                  key={member.id}
                  id={member.id}
                  table="project_members"
                  title={
                    member.projects?.name ||
                    (techLabels ? "ARTIFACT_RECORD" : "Project")
                  }
                  href={
                    member.projects?.slug
                      ? `/projects/${member.projects.slug}`
                      : undefined
                  }
                  owner={
                    member.projects?.profiles?.username
                      ? `@${member.projects.profiles.username}`
                      : undefined
                  }
                  role={member.role}
                  note={member.contribution_note}
                  onSaved={load}
                />
              ))}
            </ContributionSection>

            <ContributionSection
              title={
                techLabels
                  ? "COMMUNITY_ASSIGNMENTS"
                  : "Community project assignments"
              }
              error={communityError}
              empty={
                techLabels
                  ? "NO_COMMUNITY_ASSIGNMENTS: an admin can assign member nodes from the shared workstream editor."
                  : "No community project assignments yet. An admin can assign you from a community project."
              }
              emptyAction={
                <InlineActionLink href="/community-projects">
                  {techLabels
                    ? "BROWSE_WORKSTREAMS"
                    : "Browse community projects"}
                </InlineActionLink>
              }
            >
              {communityMembers.map((member) => (
                <ContributionRoleCard
                  key={member.id}
                  id={member.id}
                  table="community_project_members"
                  title={
                    member.community_projects?.name ||
                    (techLabels ? "WORKSTREAM_RECORD" : "Community project")
                  }
                  href={
                    member.community_projects?.slug
                      ? `/community-projects/${member.community_projects.slug}`
                      : undefined
                  }
                  role={member.role}
                  note={member.contribution_note}
                  onSaved={load}
                />
              ))}
            </ContributionSection>
          </>
        )}
      </section>
    </PageShell>
  );
}

function ContributionSection({
  title,
  empty,
  emptyAction,
  error,
  children,
}: {
  title: string;
  empty: string;
  emptyAction?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
}) {
  const items = React.Children.toArray(children);

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-zinc-100">{title}</h2>
      {error ? (
        <ActionableErrorMessage message={error} />
      ) : items.length === 0 ? (
        <Card className="space-y-4 p-6 text-sm text-zinc-500">
          <p>{empty}</p>
          {emptyAction}
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">{items}</div>
      )}
    </section>
  );
}

function ContributionRoleCard({
  id,
  table,
  title,
  href,
  owner,
  role,
  note,
  onSaved,
}: {
  id: string;
  table: "project_members" | "community_project_members";
  title: string;
  href?: string;
  owner?: string;
  role: string | null;
  note: string | null;
  onSaved: () => void;
}) {
  const { techLabels } = useTechLabels();
  const [nextRole, setNextRole] = useState(role ?? "");
  const [nextNote, setNextNote] = useState(note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase
      .from(table)
      .update({
        role: nextRole || null,
        contribution_note: nextNote || null,
      })
      .eq("id", id);
    if (updateError) setError(updateError.message);
    else onSaved();
    setSaving(false);
  }

  return (
    <Card className="p-5">
      <form onSubmit={save} className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-zinc-100">{title}</h3>
            {owner && <p className="mt-1 text-xs text-zinc-500">{owner}</p>}
          </div>
          {href && (
            <a
              href={href}
              className="inline-flex h-8 items-center rounded-sm border border-zinc-800 px-2 text-xs text-zinc-300 hover:bg-zinc-900"
            >
              {techLabels ? "OPEN" : "Open"}
            </a>
          )}
        </div>
        <Field label={{ tech: "ROLE_VECTOR", friendly: "Your role" }}>
          <Input
            className={inputClass}
            value={nextRole}
            onChange={(event) => setNextRole(event.target.value)}
            placeholder="Frontend, founder, maintainer..."
          />
        </Field>
        <Field
          label={{ tech: "CONTRIBUTION_NOTE", friendly: "Contribution note" }}
        >
          <Textarea
            className={`${textareaClass} min-h-20`}
            value={nextNote}
            onChange={(event) => setNextNote(event.target.value)}
            placeholder={
              techLabels
                ? "Optional contribution context."
                : "Optional short note about what you contributed."
            }
          />
        </Field>
        <ActionableErrorMessage message={error} />
        <Button
          className="h-10 rounded-sm bg-blue-600 text-white hover:bg-blue-500"
          disabled={saving}
        >
          {saving
            ? techLabels
              ? "SAVING..."
              : "Saving..."
            : techLabels
              ? "SAVE_ROLE"
              : "Save role"}
        </Button>
      </form>
    </Card>
  );
}

export function ProjectEditorPage() {
  const params = useParams<{ id?: string }>();
  return (
    <RequireAuth>
      {({ userId }) => (
        <ProjectEditorLoader userId={userId} projectId={params.id} />
      )}
    </RequireAuth>
  );
}

function ProjectEditorLoader({
  userId,
  projectId,
}: {
  userId: string;
  projectId?: string;
}) {
  const { techLabels } = useTechLabels();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(
    Boolean(projectId && projectId !== "new"),
  );

  async function load() {
    if (!supabase || !projectId || projectId === "new") {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle();
    setProject((data as Project | null) ?? null);
    const { data: memberData } = await supabase
      .from("project_members")
      .select(
        "*, profiles!project_members_profile_id_fkey(username, full_name, avatar_url, headline)",
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });
    setMembers((memberData as ProjectMember[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [projectId]);

  return (
    <PageShell>
      <HeroBlock
        eyebrow={{ tech: "ARTIFACT_EDITOR", friendly: "Project editor" }}
        title={
          project
            ? techLabels
              ? "Edit artifact record."
              : "Edit project."
            : techLabels
              ? "New artifact record."
              : "New project."
        }
        copy={{
          tech: "Add the artifact fields rendered on your profile and the public registry.",
          friendly:
            "Add the project details that should appear on your profile and the public project directory.",
        }}
      />
      <section className="container mx-auto px-4 py-12 md:px-6">
        {loading ? (
          <SkeletonList />
        ) : project ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <ProjectEditor userId={userId} project={project} />
            <ProjectContributorsPanel
              project={project}
              members={members}
              userId={userId}
              onChange={load}
            />
          </div>
        ) : (
          <ProjectEditor userId={userId} project={project} />
        )}
      </section>
    </PageShell>
  );
}

export function AdminPage() {
  const { techLabels } = useTechLabels();

  return (
    <RequireAuth admin>
      {() => (
        <PageShell>
          <HeroBlock
            eyebrow={{ tech: "ADMIN_CONSOLE", friendly: "Admin" }}
            title={{
              tech: "Platform operations.",
              friendly: "Platform operations.",
            }}
            copy={{
              tech: "Manage invite tokens, member records and shared workstream assignments.",
              friendly:
                "Manage invites, members and community project assignments.",
            }}
          />
          <section className="container mx-auto grid gap-4 px-4 py-12 md:grid-cols-2 md:px-6 xl:grid-cols-4">
            <a href="/admin/waitlist" className="dt-card p-5">
              <UserPlus className="mb-4 text-blue-400" size={20} />
              <h2 className="mb-2 font-bold text-zinc-100">
                {techLabels ? "WAITLIST_QUEUE" : "Waitlist"}
              </h2>
              <p className="text-sm text-zinc-500">
                {techLabels
                  ? "Review queued access requests and activate invite emails."
                  : "Review access requests and activate people from the waitlist."}
              </p>
            </a>
            <a href="/admin/invites" className="dt-card p-5">
              <UserPlus className="mb-4 text-blue-400" size={20} />
              <h2 className="mb-2 font-bold text-zinc-100">
                {techLabels ? "INVITE_TOKENS" : "Invites"}
              </h2>
              <p className="text-sm text-zinc-500">
                {techLabels
                  ? "Create, copy and revoke invite tokens."
                  : "Create, copy and revoke invite links."}
              </p>
            </a>
            <a href="/admin/members" className="dt-card p-5">
              <Search className="mb-4 text-blue-400" size={20} />
              <h2 className="mb-2 font-bold text-zinc-100">
                {techLabels ? "MEMBER_RECORDS" : "Members"}
              </h2>
              <p className="text-sm text-zinc-500">
                {techLabels
                  ? "Review profile records and public renders."
                  : "Review profiles and open public pages."}
              </p>
            </a>
            <a href="/admin/community-projects" className="dt-card p-5">
              <Github className="mb-4 text-blue-400" size={20} />
              <h2 className="mb-2 font-bold text-zinc-100">
                {techLabels ? "SHARED_WORKSTREAMS" : "Community projects"}
              </h2>
              <p className="text-sm text-zinc-500">
                {techLabels
                  ? "Create shared workstreams and assign nodes."
                  : "Create projects and assign contributors."}
              </p>
            </a>
          </section>
        </PageShell>
      )}
    </RequireAuth>
  );
}

export function AdminWaitlistPage() {
  return <RequireAuth admin>{() => <AdminWaitlistInner />}</RequireAuth>;
}

async function adminApi<T>(path: string, init?: RequestInit): Promise<T> {
  if (!supabase) throw new Error("The community backend is not configured.");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Admin session expired. Sign in again.");

  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | T
    | null;

  if (!response.ok) {
    const errorMessage =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : null;
    throw new Error(
      errorMessage || `Request failed with HTTP ${response.status}.`,
    );
  }

  return payload as T;
}

function AdminWaitlistInner() {
  const { techLabels } = useTechLabels();
  const [waitlist, setWaitlist] = useState<WaitlistSignup[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "active">("pending");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchActivating, setBatchActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi<{ waitlist: WaitlistSignup[] }>(
        "/api/admin/waitlist",
      );
      setWaitlist(data.waitlist);
      setSelectedIds([]);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, status]);

  async function activate(signup: WaitlistSignup) {
    setActivatingId(signup.id);
    setError(null);
    try {
      const data = await adminApi<{ waitlistSignup: WaitlistSignup }>(
        "/api/admin/waitlist/activate",
        { method: "POST", body: JSON.stringify({ id: signup.id }) },
      );
      if (data.waitlistSignup.status !== "active") {
        throw new Error(
          "Activation did not complete. The signup is still pending.",
        );
      }
      setWaitlist((current) =>
        current.map((item) =>
          item.id === signup.id ? data.waitlistSignup : item,
        ),
      );
      setSelectedIds((current) => current.filter((id) => id !== signup.id));
    } catch (err) {
      setError(getError(err));
      await load();
    } finally {
      setActivatingId(null);
    }
  }

  const pendingCount = waitlist.filter(
    (item) => item.status === "pending",
  ).length;
  const activeCount = waitlist.filter(
    (item) => item.status === "active",
  ).length;
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = waitlist.filter((item) => {
    const matchesStatus = status === "all" || item.status === status;
    const matchesQuery = normalizedQuery
      ? `${item.name} ${item.email} ${item.role} ${item.building ?? ""} ${item.telegramHandle ?? ""} ${item.xHandle ?? ""} ${item.linkedin ?? ""} ${item.website ?? ""} ${item.projectUrl ?? ""} ${item.source ?? ""}`
          .toLowerCase()
          .includes(normalizedQuery)
      : true;
    return matchesStatus && matchesQuery;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / waitlistPageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * waitlistPageSize;
  const pageEnd = Math.min(pageStart + waitlistPageSize, filtered.length);
  const paginated = filtered.slice(pageStart, pageEnd);
  const pagePendingIds = paginated
    .filter((item) => item.status === "pending")
    .map((item) => item.id);
  const selectedPendingIds = selectedIds.filter((id) =>
    waitlist.some((item) => item.id === id && item.status === "pending"),
  );
  const allPagePendingSelected =
    pagePendingIds.length > 0 &&
    pagePendingIds.every((id) => selectedIds.includes(id));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function toggleSignup(id: number) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((currentId) => currentId !== id)
        : [...current, id],
    );
  }

  function togglePagePending() {
    setSelectedIds((current) => {
      if (allPagePendingSelected) {
        return current.filter((id) => !pagePendingIds.includes(id));
      }
      return [...new Set([...current, ...pagePendingIds])];
    });
  }

  function goToPage(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
  }

  async function activateSelected() {
    if (selectedPendingIds.length === 0) return;
    setBatchActivating(true);
    setError(null);
    try {
      const data = await adminApi<{
        results: Array<{
          id: number;
          ok: boolean;
          waitlistSignup?: WaitlistSignup;
          error?: string;
        }>;
        activatedCount: number;
        failedCount: number;
      }>("/api/admin/waitlist/activate-batch", {
        method: "POST",
        body: JSON.stringify({ ids: selectedPendingIds }),
      });

      const updatedById = new Map(
        data.results
          .filter((result) => result.ok && result.waitlistSignup)
          .map((result) => [
            result.id,
            result.waitlistSignup as WaitlistSignup,
          ]),
      );
      setWaitlist((current) =>
        current.map((item) => updatedById.get(item.id) ?? item),
      );
      setSelectedIds((current) => current.filter((id) => !updatedById.has(id)));

      if (data.failedCount > 0) {
        const failed = data.results
          .filter((result) => !result.ok)
          .map((result) => `#${result.id}: ${result.error ?? "failed"}`)
          .join("; ");
        setError(
          `${data.activatedCount} invited, ${data.failedCount} failed. ${failed}`,
        );
        await load();
      }
    } catch (err) {
      setError(getError(err));
      await load();
    } finally {
      setBatchActivating(false);
    }
  }

  return (
    <PageShell>
      <HeroBlock
        eyebrow={{ tech: "ADMIN_WAITLIST", friendly: "Admin waitlist" }}
        title={{
          tech: "Activate queued builders.",
          friendly: "Activate waitlist users.",
        }}
        copy={{
          tech: "Review access requests, mint invite tokens and trigger Supabase Auth invite emails.",
          friendly:
            "Review people on the waitlist, activate them and send the invite email automatically.",
        }}
      />
      <section className="container mx-auto space-y-6 px-4 py-12 md:px-6">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input
            className={inputClass}
            placeholder={
              techLabels ? "Search waitlist queue..." : "Search waitlist..."
            }
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="flex rounded-sm border border-zinc-800 bg-zinc-950 p-1">
            {(["pending", "active", "all"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={`h-8 rounded-sm px-3 text-xs font-semibold uppercase ${
                  status === item
                    ? "bg-zinc-100 text-zinc-950"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
                onClick={() => setStatus(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <AdminMetric
            label={techLabels ? "PENDING_QUEUE" : "Pending"}
            value={pendingCount}
          />
          <AdminMetric
            label={techLabels ? "ACTIVE_INVITES" : "Active"}
            value={activeCount}
          />
          <AdminMetric
            label={techLabels ? "TOTAL_SIGNUPS" : "Total"}
            value={waitlist.length}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-sm border border-zinc-800 bg-zinc-950 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-100">
              {techLabels ? "BATCH_INVITES" : "Batch invitations"}
            </p>
            <p className="text-xs text-zinc-500">
              {selectedPendingIds.length} selected pending user
              {selectedPendingIds.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex h-9 items-center gap-2 rounded-sm border border-zinc-800 bg-transparent px-3 text-xs font-semibold text-zinc-200 hover:bg-zinc-900">
              <input
                type="checkbox"
                checked={allPagePendingSelected}
                disabled={pagePendingIds.length === 0 || batchActivating}
                className="size-4 rounded border-zinc-700 bg-zinc-950 accent-blue-500 disabled:cursor-not-allowed"
                onChange={togglePagePending}
              />
              {allPagePendingSelected
                ? techLabels
                  ? "CLEAR_PAGE"
                  : "Clear page"
                : techLabels
                  ? "SELECT_PAGE"
                  : "Select all"}
            </label>
            <Button
              type="button"
              disabled={selectedPendingIds.length === 0 || batchActivating}
              className="h-9 rounded-sm bg-blue-600 px-3 text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={activateSelected}
            >
              {batchActivating
                ? techLabels
                  ? "INVITING..."
                  : "Inviting..."
                : techLabels
                  ? `APPROVE_ALL (${selectedPendingIds.length})`
                  : `Approve all (${selectedPendingIds.length} selected)`}
            </Button>
          </div>
        </div>

        <ActionableErrorMessage message={error} />

        {loading ? (
          <SkeletonList />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={{
              tech: "NO_WAITLIST_ROWS",
              friendly: "No waitlist users found",
            }}
            copy={{
              tech: "No queued access request matches the current filter.",
              friendly: "No waitlist entries match the current filter.",
            }}
          />
        ) : (
          <div className="space-y-3">
            {paginated.map((signup) => (
              <Card
                key={signup.id}
                className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between"
              >
                <div className="flex min-w-0 flex-1 gap-3">
                  <input
                    type="checkbox"
                    aria-label={`Select ${signup.name}`}
                    checked={selectedIds.includes(signup.id)}
                    disabled={
                      signup.status !== "pending" ||
                      batchActivating ||
                      activatingId === signup.id
                    }
                    className="mt-1 size-4 shrink-0 rounded border-zinc-700 bg-zinc-950 accent-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                    onChange={() => toggleSignup(signup.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-zinc-100">
                        {signup.name}
                      </h2>
                      <span
                        className={`rounded-sm border px-2 py-0.5 text-[11px] font-mono uppercase ${
                          signup.status === "active"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            : "border-blue-500/40 bg-blue-500/10 text-blue-300"
                        }`}
                      >
                        {signup.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      {signup.email} · {signup.role}
                    </p>
                    {signup.telegramHandle && (
                      <p className="mt-1 text-sm text-zinc-500">
                        Telegram {signup.telegramHandle}
                      </p>
                    )}
                    {signup.building && (
                      <p className="mt-2 max-w-3xl text-sm text-zinc-400">
                        {signup.building}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                      <span>
                        {techLabels ? "joined_at" : "Joined"}{" "}
                        {new Date(signup.createdAt).toLocaleDateString()}
                      </span>
                      {signup.inviteEmailSentAt && (
                        <span>
                          {techLabels ? "email_sent_at" : "Email sent"}{" "}
                          {new Date(
                            signup.inviteEmailSentAt,
                          ).toLocaleDateString()}
                        </span>
                      )}
                      {signup.inviteStatus && (
                        <span>
                          {techLabels ? "invite_status" : "Invite"}{" "}
                          {signup.inviteStatus}
                        </span>
                      )}
                      <span>
                        {techLabels ? "source" : "Source"}{" "}
                        {signup.source || "Website Waitlist"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ExternalLinkItem
                        href={signup.linkedin}
                        label="LinkedIn"
                        icon={Linkedin}
                      />
                      <ExternalLinkItem
                        href={signup.website}
                        label="Website"
                        icon={Globe}
                      />
                      <ExternalLinkItem
                        href={signup.projectUrl}
                        label="Project"
                        icon={ExternalLink}
                      />
                      <ExternalLinkItem
                        href={
                          signup.xHandle
                            ? `https://x.com/${signup.xHandle.replace(/^@/, "")}`
                            : null
                        }
                        label="X"
                        icon={Twitter}
                      />
                    </div>
                    <ActionableErrorMessage message={signup.inviteEmailError} />
                  </div>
                </div>
                <div className="flex gap-2 lg:justify-end">
                  {signup.inviteToken && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-sm border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-900"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          `${window.location.origin}/invite/${signup.inviteToken}`,
                        )
                      }
                    >
                      <Copy size={14} />
                    </Button>
                  )}
                  <Button
                    type="button"
                    disabled={
                      signup.status === "active" || activatingId === signup.id
                    }
                    className="h-9 rounded-sm bg-blue-600 px-3 text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => activate(signup)}
                  >
                    {activatingId === signup.id
                      ? techLabels
                        ? "ACTIVATING..."
                        : "Activating..."
                      : signup.status === "active"
                        ? techLabels
                          ? "ACTIVE"
                          : "Active"
                        : techLabels
                          ? "ACTIVATE"
                          : "Activate"}
                  </Button>
                </div>
              </Card>
            ))}
            <div className="flex flex-col gap-3 rounded-sm border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {filtered.length === 0 ? 0 : pageStart + 1}-{pageEnd} of{" "}
                {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={currentPage === 1}
                  className="h-9 rounded-sm border-zinc-800 bg-transparent px-3 text-zinc-200 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => goToPage(currentPage - 1)}
                >
                  <ChevronLeft size={14} />
                  {techLabels ? "PREV" : "Previous"}
                </Button>
                <span className="min-w-24 text-center text-xs font-mono uppercase tracking-wider text-zinc-500">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  className="h-9 rounded-sm border-zinc-800 bg-transparent px-3 text-zinc-200 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => goToPage(currentPage + 1)}
                >
                  {techLabels ? "NEXT" : "Next"}
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}

function AdminMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="dt-card p-4">
      <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-zinc-100">{value}</p>
    </div>
  );
}

export function AdminInvitesPage() {
  return (
    <RequireAuth admin>
      {() => <AdminInvitesInner />}
    </RequireAuth>
  );
}

function AdminInvitesInner() {
  const { techLabels } = useTechLabels();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase
      .from("invites")
      .select("*")
      .order("created_at", { ascending: false });
    setInvites((data as Invite[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createInvite(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    const emailValue = email.trim();
    const telegramValue = telegram.trim();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const data = await adminApi<{ invite: Invite; emailSent: boolean }>(
        "/api/admin/waitlist",
        {
          method: "POST",
          body: JSON.stringify({
            email: emailValue || null,
            telegram: telegramValue || null,
          }),
        },
      );
      setEmail("");
      setTelegram("");
      setMessage(
        data.emailSent
          ? `Invite email sent to ${data.invite.email}.`
          : "Invite link created. Copy it and send it manually.",
      );
      await load();
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  }

  async function revoke(id: string) {
    if (!supabase) return;
    setError(null);
    setMessage(null);
    await supabase.from("invites").update({ status: "revoked" }).eq("id", id);
    load();
  }

  async function resendInvite(invite: Invite) {
    setError(null);
    setMessage(null);
    setResendingId(invite.id);
    try {
      const data = await adminApi<{ invite: Invite; emailSent: boolean }>(
        "/api/admin/waitlist",
        {
          method: "POST",
          body: JSON.stringify({ action: "resend", id: invite.id }),
        },
      );
      setMessage(`Invite email resent to ${data.invite.email}.`);
      await load();
    } catch (err) {
      setError(getError(err));
      await load();
    } finally {
      setResendingId(null);
    }
  }

  function copyInvite(invite: Invite) {
    navigator.clipboard.writeText(
      `${window.location.origin}/invite/${invite.token}`,
    );
  }

  function inviteExpired(invite: Invite) {
    if (invite.status === "expired") return true;
    if (invite.status !== "pending") return false;
    if (!invite.expires_at) return false;
    return new Date(invite.expires_at).getTime() <= Date.now();
  }

  return (
    <PageShell>
      <HeroBlock
        eyebrow={{ tech: "ADMIN_INVITES", friendly: "Admin invites" }}
        title={{
          tech: "Mint invite tokens.",
          friendly: "Invite members one by one.",
        }}
        copy={{
          tech: "Create secure invite tokens with email or Telegram metadata, then copy the route manually.",
          friendly:
            "Create an invite with an email address to send it automatically, or create a Telegram-only link to send manually.",
        }}
      />
      <section className="container mx-auto grid gap-6 px-4 py-12 md:px-6 lg:grid-cols-[360px_1fr]">
        <Card className="p-6">
          <form onSubmit={createInvite} className="space-y-4">
            <Field label={{ tech: "EMAIL_ADDRESS", friendly: "Email" }}>
              <Input
                className={inputClass}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field label={{ tech: "TELEGRAM_HANDLE", friendly: "Telegram" }}>
              <Input
                className={inputClass}
                value={telegram}
                onChange={(event) => setTelegram(event.target.value)}
                placeholder="@username"
              />
            </Field>
            <ActionableErrorMessage message={error} />
            {message && (
              <p className="rounded-sm border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                {message}
              </p>
            )}
            <Button
              className="h-10 rounded-sm bg-blue-600 text-white hover:bg-blue-500"
              disabled={saving}
            >
              {saving
                ? techLabels
                  ? "SENDING_INVITE..."
                  : "Sending invite..."
                : techLabels
                  ? "CREATE_INVITE"
                  : "Create invite"}
            </Button>
          </form>
        </Card>
        <div className="space-y-3">
          {invites.map((invite) => {
            const expired = inviteExpired(invite);
            const canResend = Boolean(invite.email) && expired;
            return (
              <Card
                key={invite.id}
                className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h2 className="font-semibold text-zinc-100">
                    {invite.email || invite.telegram_handle}
                  </h2>
                  <p className="text-sm text-zinc-500">
                    {expired ? "expired" : invite.status}{" "}
                    · {techLabels ? "expires_at" : "expires"}{" "}
                    {invite.expires_at
                      ? new Date(invite.expires_at).toLocaleDateString()
                      : "never"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  {canResend && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-sm border-blue-500/40 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20"
                      disabled={resendingId === invite.id}
                      onClick={() => resendInvite(invite)}
                    >
                      <RefreshCw size={14} />
                      {resendingId === invite.id
                        ? techLabels
                          ? "RESENDING..."
                          : "Resending..."
                        : techLabels
                          ? "RESEND_INVITE"
                          : "Resend invite"}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-sm border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-900"
                    onClick={() => copyInvite(invite)}
                  >
                    <Copy size={14} />
                  </Button>
                  {invite.status === "pending" && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-sm border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-900"
                      onClick={() => revoke(invite.id)}
                    >
                      {techLabels ? "REVOKE" : "Revoke"}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}

export function AdminMembersPage() {
  return <RequireAuth admin>{() => <AdminMembersInner />}</RequireAuth>;
}

function AdminMembersInner() {
  const { techLabels } = useTechLabels();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      setProfiles((data as Profile[]) ?? []);
    }
    load();
  }, []);

  const filtered = profiles.filter((profile) =>
    `${profile.full_name} ${profile.email ?? ""} ${profile.telegram_handle ?? ""} ${profile.username}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <PageShell>
      <HeroBlock
        eyebrow={{ tech: "ADMIN_MEMBERS", friendly: "Admin members" }}
        title={{ tech: "Member records.", friendly: "Member profiles." }}
        copy={{
          tech: "Review profile records and open public renders.",
          friendly:
            "Review member records and open their public profile pages.",
        }}
      />
      <section className="container mx-auto px-4 py-12 md:px-6">
        <Input
          className={`${inputClass} mb-6`}
          placeholder={
            techLabels ? "Search member records..." : "Search members..."
          }
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="space-y-3">
          {filtered.map((profile) => (
            <Card
              key={profile.id}
              className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h2 className="font-semibold text-zinc-100">
                  {profile.full_name}{" "}
                  <span className="text-sm font-normal text-zinc-500">
                    @{profile.username}
                  </span>
                </h2>
                <p className="text-sm text-zinc-500">
                  {profile.platform_role} · {profile.visibility} ·{" "}
                  {profile.email || profile.telegram_handle}
                </p>
              </div>
              <a
                href={`/builders/${profile.username}`}
                className="inline-flex h-9 items-center rounded-sm border border-zinc-800 px-3 text-sm text-zinc-200 hover:bg-zinc-900"
              >
                {techLabels ? "PUBLIC_RENDER" : "Public profile"}
              </a>
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

type CommunityProjectFormState = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  status: CommunityProject["status"];
  repo_url: string;
  website_url: string;
  image_url: string;
  is_public: boolean;
};

function communityProjectToForm(
  project: CommunityProject | null,
): CommunityProjectFormState {
  return {
    name: project?.name ?? "",
    slug: project?.slug ?? "",
    tagline: project?.tagline ?? "",
    description: project?.description ?? "",
    category: project?.category ?? "",
    status: project?.status ?? "proposed",
    repo_url: project?.repo_url ?? "",
    website_url: project?.website_url ?? "",
    image_url: project?.image_url ?? "",
    is_public: project?.is_public ?? true,
  };
}

export function AdminCommunityProjectsPage() {
  return (
    <RequireAuth admin>{() => <AdminCommunityProjectsInner />}</RequireAuth>
  );
}

function AdminCommunityProjectsInner() {
  const { techLabels } = useTechLabels();
  const [projects, setProjects] = useState<CommunityProject[]>([]);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase
      .from("community_projects")
      .select("*, community_project_members(id)")
      .order("created_at", { ascending: false });
    setProjects((data as CommunityProject[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!supabase || !confirm("Delete this community project?")) return;
    await supabase.from("community_projects").delete().eq("id", id);
    load();
  }

  return (
    <PageShell>
      <HeroBlock
        eyebrow={{
          tech: "ADMIN_WORKSTREAMS",
          friendly: "Admin community projects",
        }}
        title={{
          tech: "Manage shared workstreams.",
          friendly: "Manage shared projects.",
        }}
        copy={{
          tech: "Create shared workstream records and assign member nodes for public profile rendering.",
          friendly:
            "Create community projects and assign contributors to make the work appear on public profiles.",
        }}
        action={
          <a
            href="/admin/community-projects/new"
            className="inline-flex h-10 items-center gap-2 rounded-sm bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500"
          >
            <Plus size={16} /> {techLabels ? "NEW_WORKSTREAM" : "New project"}
          </a>
        }
      />
      <section className="container mx-auto px-4 py-12 md:px-6">
        <div className="space-y-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h2 className="font-semibold text-zinc-100">{project.name}</h2>
                <p className="text-sm text-zinc-500">
                  {project.status} ·{" "}
                  {project.community_project_members?.length ?? 0}{" "}
                  {techLabels ? "assigned_nodes" : "contributors"}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/admin/community-projects/${project.id}`}
                  className="inline-flex h-9 items-center rounded-sm border border-zinc-800 px-3 text-sm text-zinc-200 hover:bg-zinc-900"
                >
                  {techLabels ? "EDIT" : "Edit"}
                </a>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-sm border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-900"
                  onClick={() => remove(project.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

export function AdminCommunityProjectEditorPage() {
  const params = useParams<{ id?: string }>();
  return (
    <RequireAuth admin>
      {({ userId }) => (
        <CommunityProjectEditorLoader userId={userId} projectId={params.id} />
      )}
    </RequireAuth>
  );
}

function CommunityProjectEditorLoader({
  userId,
  projectId,
}: {
  userId: string;
  projectId?: string;
}) {
  const { techLabels } = useTechLabels();
  const [project, setProject] = useState<CommunityProject | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [members, setMembers] = useState<CommunityProjectMember[]>([]);
  const [loading, setLoading] = useState(
    Boolean(projectId && projectId !== "new"),
  );

  async function load() {
    if (!supabase) return;
    const [{ data: profileData }, projectResult] = await Promise.all([
      supabase.from("profiles").select("*").order("full_name"),
      projectId && projectId !== "new"
        ? supabase
            .from("community_projects")
            .select("*")
            .eq("id", projectId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    setProfiles((profileData as Profile[]) ?? []);
    setProject((projectResult.data as CommunityProject | null) ?? null);
    if (projectId && projectId !== "new") {
      const { data: memberData } = await supabase
        .from("community_project_members")
        .select(
          "*, profiles!community_project_members_profile_id_fkey(username, full_name, avatar_url, headline)",
        )
        .eq("community_project_id", projectId);
      setMembers((memberData as CommunityProjectMember[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [projectId]);

  return (
    <PageShell>
      <HeroBlock
        eyebrow={{
          tech: "WORKSTREAM_EDITOR",
          friendly: "Community project editor",
        }}
        title={
          project
            ? techLabels
              ? "Edit workstream record."
              : "Edit community project."
            : techLabels
              ? "New workstream record."
              : "New community project."
        }
        copy={{
          tech: "Admins can create shared workstreams and assign member nodes with role metadata.",
          friendly:
            "Admins can create shared projects and assign members with a role and contribution note.",
        }}
      />
      <section className="container mx-auto grid gap-6 px-4 py-12 md:px-6 lg:grid-cols-[1fr_380px]">
        {loading ? (
          <SkeletonList />
        ) : (
          <CommunityProjectEditor userId={userId} project={project} />
        )}
        {project && (
          <AssignmentPanel
            project={project}
            profiles={profiles}
            members={members}
            onChange={load}
            userId={userId}
          />
        )}
      </section>
    </PageShell>
  );
}

function CommunityProjectEditor({
  userId,
  project,
}: {
  userId: string;
  project: CommunityProject | null;
}) {
  const { techLabels } = useTechLabels();
  const [, navigate] = useLocation();
  const [form, setForm] = useState(() => communityProjectToForm(project));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof CommunityProjectFormState>(
    key: K,
    value: CommunityProjectFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      tagline: form.tagline || null,
      description: form.description || null,
      category: form.category || null,
      status: form.status,
      repo_url: normalizeSocialUrl(form.repo_url, "https://github.com/") || null,
      website_url: normalizeHttpUrlInput(form.website_url) || null,
      image_url: form.image_url || null,
      is_public: form.is_public,
      created_by: project?.created_by ?? userId,
    };
    const result = project
      ? await supabase
          .from("community_projects")
          .update(payload)
          .eq("id", project.id)
      : await supabase
          .from("community_projects")
          .insert(payload)
          .select("id")
          .single();
    if (result.error) setError(result.error.message);
    else
      navigate(
        project
          ? "/admin/community-projects"
          : `/admin/community-projects/${(result.data as { id?: string } | null)?.id}`,
      );
    setSaving(false);
  }

  return (
    <Card className="p-6">
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <Field label={{ tech: "WORKSTREAM_NAME", friendly: "Name" }}>
          <Input
            className={inputClass}
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            onBlur={() => !form.slug && update("slug", slugify(form.name))}
            required
          />
        </Field>
        <Field label={{ tech: "WORKSTREAM_SLUG", friendly: "Slug" }}>
          <Input
            className={inputClass}
            value={form.slug}
            onChange={(event) => update("slug", slugify(event.target.value))}
            required
          />
        </Field>
        <Field label={{ tech: "TAGLINE", friendly: "Tagline" }}>
          <Input
            className={inputClass}
            value={form.tagline}
            onChange={(event) => update("tagline", event.target.value)}
          />
        </Field>
        <Field label={{ tech: "CATEGORY_TAG", friendly: "Category" }}>
          <Input
            className={inputClass}
            value={form.category}
            onChange={(event) => update("category", event.target.value)}
          />
        </Field>
        <Field label={{ tech: "STATUS_STATE", friendly: "Status" }}>
          <select
            className={selectClass}
            value={form.status}
            onChange={(event) =>
              update("status", event.target.value as CommunityProject["status"])
            }
          >
            {["proposed", "active", "paused", "completed"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <MediaUploadField
          label={{ tech: "WORKSTREAM_IMAGE", friendly: "Project image" }}
          value={form.image_url}
          onChange={(url) => update("image_url", url)}
          userId={userId}
          folder="community-projects"
          kind="project"
        />
        <Field label={{ tech: "WEBSITE_URL", friendly: "Website" }}>
          <Input
            className={inputClass}
            value={form.website_url}
            onChange={(event) => update("website_url", event.target.value)}
          />
        </Field>
        <Field label={{ tech: "REPOSITORY_URL", friendly: "Repository" }}>
          <Input
            className={inputClass}
            value={form.repo_url}
            onChange={(event) => update("repo_url", event.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 pt-6 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={form.is_public}
            onChange={(event) => update("is_public", event.target.checked)}
          />{" "}
          {techLabels ? "PUBLIC_RECORD" : "Public"}
        </label>
        <div className="md:col-span-2">
          <Field label={{ tech: "DESCRIPTION_BODY", friendly: "Description" }}>
            <Textarea
              className={textareaClass}
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <ActionableErrorMessage message={error} />
          <Button
            className="mt-3 h-10 rounded-sm bg-blue-600 text-white hover:bg-blue-500"
            disabled={saving}
          >
            {saving
              ? techLabels
                ? "SAVING..."
                : "Saving..."
              : techLabels
                ? "SAVE_WORKSTREAM"
                : "Save community project"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function AssignmentPanel({
  project,
  profiles,
  members,
  userId,
  onChange,
}: {
  project: CommunityProject;
  profiles: Profile[];
  members: CommunityProjectMember[];
  userId: string;
  onChange: () => void;
}) {
  const { techLabels } = useTechLabels();
  const [profileId, setProfileId] = useState("");
  const [role, setRole] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function assign(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase || !profileId) return;
    const { error: upsertError } = await supabase
      .from("community_project_members")
      .upsert(
        {
          community_project_id: project.id,
          profile_id: profileId,
          role: role || null,
          contribution_note: note || null,
          assigned_by: userId,
        },
        { onConflict: "community_project_id,profile_id" },
      );
    if (upsertError) setError(upsertError.message);
    else {
      setProfileId("");
      setRole("");
      setNote("");
      onChange();
    }
  }

  async function remove(id: string) {
    if (!supabase) return;
    await supabase.from("community_project_members").delete().eq("id", id);
    onChange();
  }

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-xl font-bold text-zinc-100">
        {techLabels ? "ASSIGN_MEMBER_NODES" : "Assign members"}
      </h2>
      <form onSubmit={assign} className="mb-6 space-y-3">
        <Field label={{ tech: "MEMBER_NODE", friendly: "Member" }}>
          <select
            className={selectClass}
            value={profileId}
            onChange={(event) => setProfileId(event.target.value)}
            required
          >
            <option value="">
              {techLabels ? "select_member_node" : "Select member"}
            </option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.full_name} (@{profile.username})
              </option>
            ))}
          </select>
        </Field>
        <Field label={{ tech: "ROLE_VECTOR", friendly: "Role" }}>
          <Input
            className={inputClass}
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Maintainer, designer..."
          />
        </Field>
        <Field
          label={{ tech: "CONTRIBUTION_NOTE", friendly: "Contribution note" }}
        >
          <Textarea
            className={textareaClass}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
        <ActionableErrorMessage message={error} />
        <Button className="h-10 rounded-sm bg-blue-600 text-white hover:bg-blue-500">
          {techLabels ? "ASSIGN_NODE" : "Assign member"}
        </Button>
      </form>
      <div className="space-y-3">
        {members.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {techLabels ? "NO_ASSIGNED_NODES" : "No members assigned."}
          </p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-start justify-between gap-3 rounded-sm border border-zinc-800 bg-zinc-900 p-3"
            >
              <div>
                <p className="font-semibold text-zinc-100">
                  {member.profiles?.full_name ||
                    (techLabels ? "MEMBER_NODE" : "Member")}
                </p>
                <p className="text-xs text-zinc-500">
                  {member.role ||
                    (techLabels ? "CONTRIBUTOR_ROLE" : "Contributor")}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="h-8 text-zinc-400 hover:text-zinc-100"
                onClick={() => remove(member.id)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
