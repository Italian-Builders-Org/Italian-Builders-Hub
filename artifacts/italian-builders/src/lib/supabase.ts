import {
  createClient,
  type Session,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
export const appBaseUrl = (
  (import.meta.env.VITE_APP_BASE_URL ||
    import.meta.env.APP_BASE_URL ||
    "") as string
).replace(/\/$/, "");

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  location: string | null;
  city: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  telegram_handle: string | null;
  email: string | null;
  email_public: boolean;
  website_url: string | null;
  linkedin_url: string | null;
  x_url: string | null;
  github_url: string | null;
  youtube_url: string | null;
  instagram_url: string | null;
  role: string | null;
  skills: string[];
  interests: string[];
  looking_for: string[];
  languages: string[];
  intro_video_url: string | null;
  visibility: "public" | "members" | "unlisted" | "private";
  platform_role: "member" | "admin" | "owner";
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectLookingFor = {
  tag: string;
  message: string;
};

export type ProjectCategory = {
  id: string;
  slug: string;
  name: string;
  group_name: "type" | "technology" | "market" | "industry" | "stage" | "other";
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectCategoryTag = {
  project_id: string;
  category_id: string;
  position: number;
  created_at: string;
  project_categories?: ProjectCategory | null;
};

export type Project = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  category: string | null;
  status: "idea" | "building" | "beta" | "live" | "revenue" | "paused";
  website_url: string | null;
  github_url: string | null;
  demo_url: string | null;
  image_url: string | null;
  looking_for: ProjectLookingFor[];
  project_category_tags?: ProjectCategoryTag[];
  is_open_source: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Pick<
    Profile,
    "username" | "full_name" | "avatar_url" | "headline" | "telegram_handle"
  > | null;
  project_members?: ProjectMember[];
};

export type ProjectMember = {
  id: string;
  project_id: string;
  profile_id: string;
  role: string | null;
  contribution_note: string | null;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Pick<
    Profile,
    "username" | "full_name" | "avatar_url" | "headline"
  > | null;
  projects?: Project | null;
};

export type CommunityProject = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  category: string | null;
  status: "proposed" | "active" | "paused" | "completed";
  repo_url: string | null;
  website_url: string | null;
  image_url: string | null;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  community_project_members?: CommunityProjectMember[];
};

export type CommunityProjectMember = {
  id: string;
  community_project_id: string;
  profile_id: string;
  role: string | null;
  contribution_note: string | null;
  assigned_by: string | null;
  created_at: string;
  updated_at?: string;
  profiles?: Pick<
    Profile,
    "username" | "full_name" | "avatar_url" | "headline"
  > | null;
  community_projects?: CommunityProject | null;
};

export type Invite = {
  id: string;
  email: string | null;
  telegram_handle: string | null;
  token: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  invited_by: string | null;
  accepted_by: string | null;
  expires_at: string | null;
  accepted_at: string | null;
  created_at: string;
};

export type WaitlistSignup = {
  id: number;
  name: string;
  email: string;
  role: string;
  building: string | null;
  telegramHandle: string | null;
  xHandle: string | null;
  linkedin: string | null;
  website: string | null;
  projectUrl: string | null;
  source: string;
  status: "pending" | "active";
  activatedAt: string | null;
  activatedBy: string | null;
  inviteId: string | null;
  inviteEmailSentAt: string | null;
  inviteEmailError: string | null;
  inviteToken: string | null;
  inviteStatus: Invite["status"] | null;
  createdAt: string;
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinList(value: string[] | null | undefined) {
  return value?.join(", ") ?? "";
}

export function publicUrl(path: string) {
  if (!path.startsWith("/")) return path;
  return `${appBaseUrl || window.location.origin}${path}`;
}

export function authRedirectUrl(
  path = window.location.pathname + window.location.search,
) {
  const base = appBaseUrl || window.location.origin;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function newInviteToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return { session, user, loading };
}
