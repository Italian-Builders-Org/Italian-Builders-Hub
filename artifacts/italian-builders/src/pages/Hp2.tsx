import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import {
  getGetDirectoryStatsQueryKey,
  getListBuildersQueryKey,
  useGetDirectoryStats,
  useListBuilders,
} from "@workspace/api-client-react";
import { BuilderGlobe, type HomeMapBuilder } from "@/pages/Home";
import { STATIC_BUILDERS, STATIC_DIRECTORY_STATS, hasItems, isDirectoryStats } from "@/data/directory";
import { defaultAvatarUrl } from "@/lib/assets";
import {
  coordsForCityCountry,
  fallbackCoordsForLocation,
  locationLabel,
} from "@/lib/geo";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import "./Hp2.css";

type Hp2Profile = Pick<
  Profile,
  | "id"
  | "username"
  | "full_name"
  | "headline"
  | "bio"
  | "avatar_url"
  | "location"
  | "city"
  | "country"
  | "latitude"
  | "longitude"
  | "role"
  | "skills"
  | "created_at"
>;

type Hp2Builder = HomeMapBuilder & {
  number: string;
  href?: string;
};

type Hp2Content = {
  builders: Hp2Builder[];
  builderCount: string;
  cityCount: string;
  loading: boolean;
};

const profileSelect =
  "id, username, full_name, headline, bio, avatar_url, location, city, country, latitude, longitude, role, skills, created_at";

function validCoordinate(lat?: number | null, lng?: number | null) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  );
}

function profileCoords(profile: Hp2Profile) {
  if (validCoordinate(profile.latitude, profile.longitude)) {
    return [profile.latitude, profile.longitude] as [number, number];
  }
  return (
    coordsForCityCountry(profile.city, profile.country) ||
    fallbackCoordsForLocation(profile.location)
  );
}

function profileToBuilder(profile: Hp2Profile, index: number): Hp2Builder {
  const coords = profileCoords(profile);
  const role = profile.headline || profile.role || "Builder";

  return {
    id: profile.id,
    number: String(index + 1).padStart(3, "0"),
    name: profile.full_name,
    username: profile.username,
    href: profile.username ? `/builders/${profile.username}` : undefined,
    role,
    location: locationLabel({
      city: profile.city,
      country: profile.country,
      fallback: profile.location,
    }),
    avatarUrl: profile.avatar_url || defaultAvatarUrl,
    highlight: profile.bio || "Building in the Italian Builders community.",
    tags: profile.skills?.length ? profile.skills.slice(0, 3) : [role],
    lat: coords?.[0] ?? 42.85,
    lng: coords?.[1] ?? 12.45,
  };
}

function fallbackBuilderToBuilder(builder: (typeof STATIC_BUILDERS)[number]) {
  const coords = fallbackCoordsForLocation(builder.location);
  return {
    id: builder.id,
    number: String(builder.id).padStart(3, "0"),
    name: builder.name,
    role: builder.role,
    location: builder.location,
    avatarUrl: builder.avatarUrl,
    highlight: builder.highlight,
    tags: builder.tags.slice(0, 3),
    lat: coords?.[0] ?? 42.85,
    lng: coords?.[1] ?? 12.45,
  } satisfies Hp2Builder;
}

function useHp2Content(): Hp2Content {
  const { data: apiBuilders, isLoading: apiLoading } = useListBuilders({
    query: { queryKey: getListBuildersQueryKey() },
  });
  const { data: apiStats } = useGetDirectoryStats({
    query: { queryKey: getGetDirectoryStatsQueryKey() },
  });
  const [profiles, setProfiles] = useState<Hp2Profile[]>([]);
  const [profileCount, setProfileCount] = useState<number | null>(null);
  const [profileLoading, setProfileLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    supabase
      .from("profiles")
      .select(profileSelect, { count: "exact" })
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(18)
      .then(
        ({ data, count }) => {
          if (cancelled) return;
          setProfiles((data as Hp2Profile[] | null) ?? []);
          setProfileCount(count ?? data?.length ?? 0);
          setProfileLoading(false);
        },
        () => {
          if (!cancelled) setProfileLoading(false);
        },
      );

    return () => {
      cancelled = true;
    };
  }, []);

  const builders = useMemo(() => {
    if (profiles.length > 0) {
      return profiles.map(profileToBuilder);
    }
    const directoryBuilders = hasItems(apiBuilders)
      ? apiBuilders
      : STATIC_BUILDERS;
    return directoryBuilders.slice(0, 10).map(fallbackBuilderToBuilder);
  }, [apiBuilders, profiles]);

  const stats = isDirectoryStats(apiStats) ? apiStats : STATIC_DIRECTORY_STATS;
  const cityCount = String(
    new Set(builders.map((builder) => builder.location.split(",")[0].trim()))
      .size || stats.cities,
  );

  return {
    builders,
    builderCount: profileCount
      ? new Intl.NumberFormat("en").format(profileCount)
      : stats.builders,
    cityCount,
    loading: profileLoading || apiLoading,
  };
}

function WordReveal({ children }: { children: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const words = useMemo(() => children.split(/\s+/).filter(Boolean), [children]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        element.classList.add("is-visible");
        observer.disconnect();
      },
      { threshold: 0.2 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className="hp2-word-reveal">
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="hp2-word"
          style={{ "--word-index": index } as CSSProperties}
        >
          {word}
        </span>
      ))}
    </span>
  );
}

export default function Hp2Page() {
  const { builders, builderCount, cityCount, loading } = useHp2Content();
  const activeBuilder = builders[0] ?? null;

  return (
    <div className="hp2-page">
      <header className="hp2-mast">
        <a href="/" className="hp2-logo-link" aria-label="Italian Builders">
          <img src="/logo-vector.svg" alt="Italian Builders" />
        </a>
        <nav aria-label="Hidden homepage preview sections">
          <a href="#manifesto">Manifesto</a>
          <a href="#directory">Directory</a>
          <a href="#join">Join</a>
        </nav>
      </header>

      <main>
        <section className="hp2-hero">
          <div className="hp2-kicker">Community manifesto, preview 02</div>
          <h1>
            What unites us is not what we build. What unites us is that we
            choose to <span>build</span>.
          </h1>
          <div className="hp2-hero-bottom">
            <p>
              Italian Builders exists to connect developers, designers,
              founders, creators, researchers, and entrepreneurs across Italy.
            </p>
            <div className="hp2-stats" aria-label="Italian Builders statistics">
              <div>
                <strong>{builderCount}</strong>
                <small>builders</small>
              </div>
              <div>
                <strong>{cityCount}</strong>
                <small>cities</small>
              </div>
              <div>
                <strong>{loading ? "..." : builders.length}</strong>
                <small>featured now</small>
              </div>
            </div>
          </div>
        </section>

        <section id="manifesto" className="hp2-manifesto">
          <div className="hp2-section-num">01</div>
          <h2>The Manifesto</h2>
          <div className="hp2-manifesto-copy">
            <p>
              <WordReveal>
                Italian Builders exists to connect people who build. Our goal is
                to create the home for Italian builders of all ages and
                experience levels, a place where ideas, projects, knowledge, and
                opportunities can be shared.
              </WordReveal>
            </p>
            <p>
              <WordReveal>
                Talent is not the problem. Across Italy, builders are already
                creating remarkable products, companies, and technologies every
                day. Too often, they remain isolated or never meet the people who
                could help them take the next step.
              </WordReveal>
            </p>
            <p>
              <WordReveal>
                Our mission is to make those connections easier, more frequent,
                and more natural. The best opportunities are born from
                relationships, and great projects often begin when the right
                people meet at the right time.
              </WordReveal>
            </p>
          </div>
        </section>

        <section id="directory" className="hp2-directory">
          <div className="hp2-directory-head">
            <div>
              <div className="hp2-section-num">02</div>
              <h2>The Directory</h2>
            </div>
            <p>
              Numbered profiles, real builder photos where available, and the
              existing Italian Builders map language connected to the current
              public profile data.
            </p>
          </div>

          <div className="hp2-directory-layout">
            <div className="hp2-builder-list">
              {builders.map((builder) => {
                const content = (
                  <>
                    <span className="hp2-builder-num">{builder.number}</span>
                    <img src={builder.avatarUrl} alt={builder.name} />
                    <span className="hp2-builder-main">
                      <strong>{builder.name}</strong>
                      <small>{builder.role}</small>
                    </span>
                    <span className="hp2-builder-place">
                      <MapPin size={12} />
                      {builder.location}
                    </span>
                    <ArrowRight className="hp2-builder-arrow" size={16} />
                  </>
                );

                return builder.href ? (
                  <a key={builder.id} href={builder.href} className="hp2-builder-row">
                    {content}
                  </a>
                ) : (
                  <div key={builder.id} className="hp2-builder-row">
                    {content}
                  </div>
                );
              })}
            </div>

            <aside className="hp2-map-panel" data-globe-panel>
              <div className="hp2-map-head">
                <span>Italia</span>
                <span>{builders.length} visible builders</span>
              </div>
              <div className="hp2-map-canvas">
                <BuilderGlobe builders={builders} activeBuilder={activeBuilder} />
              </div>
            </aside>
          </div>
        </section>

        <section id="join" className="hp2-join">
          <p>If you choose to build, there is a home for you here.</p>
          <a href="/join">
            Request access <ArrowRight size={18} />
          </a>
        </section>
      </main>
    </div>
  );
}
