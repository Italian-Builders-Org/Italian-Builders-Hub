import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { ArrowRight, LogOut, MapPin } from "lucide-react";
import {
  getGetDirectoryStatsQueryKey,
  getListBuildersQueryKey,
  getListProjectsQueryKey,
  useGetDirectoryStats,
  useListBuilders,
  useListProjects,
} from "@workspace/api-client-react";
import { StyleSwitch, type HomeMapBuilder } from "@/pages/Home";
import {
  STATIC_BUILDERS,
  STATIC_DIRECTORY_STATS,
  STATIC_PROJECTS,
  hasItems,
  isDirectoryStats,
} from "@/data/directory";
import { defaultAvatarUrl } from "@/lib/assets";
import {
  coordsForCityCountry,
  fallbackCoordsForLocation,
  locationLabel,
} from "@/lib/geo";
import { supabase, useSupabaseSession } from "@/lib/supabase";
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
  href?: string;
};

type Hp2Content = {
  builders: Hp2Builder[];
  builderCount: string;
  cityCount: string;
  projectCount: string;
  loading: boolean;
};

type Hp2GlobePoint = {
  lat: number;
  lng: number;
  color: string;
  radius: number;
};

const profileSelect =
  "id, username, full_name, headline, bio, avatar_url, location, city, country, latitude, longitude, role, skills, created_at";
const hp2TurnstileScriptSrc =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const hp2TurnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as
  | string
  | undefined;
const hp2EuropeGeoJsonUrl = "/maps/europe-italy-vector.geojson";
const hp2MapOceanColor = "#101a14";
const hp2MapCountryColor = "rgba(199, 184, 145, 0.82)";
const hp2MapItalyColor = "rgba(27, 138, 69, 0.96)";
const hp2MapItalyStroke = "rgba(238, 232, 207, 0.86)";
const hp2MapPinColor = "#b92c2c";
const hp2MapPinOutline = "rgba(248, 242, 218, 0.92)";
const hp2MapPinRing = "rgba(27, 138, 69, 0.46)";

let hp2TurnstileScriptPromise: Promise<void> | null = null;

const hp2PrimaryLinks = [
  { href: "/hp-2/builders", label: "Builders" },
  { href: "/hp-2/projects", label: "Projects" },
  { href: "/hp-2/community-projects", label: "Community projects" },
  { href: "/hp-2/content", label: "Content" },
  { href: "/hp-2/pantheon", label: "Pantheon" },
];

const hp2FooterGroups = [
  {
    title: "Platform",
    links: [
      { href: "/hp-2/builders", label: "Directory" },
      { href: "/hp-2/projects", label: "Showcase" },
      { href: "/hp-2/community-projects", label: "Community projects" },
      { href: "/hp-2/content", label: "Content" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/hp-2/mission", label: "Mission" },
      { href: "/hp-2/os-projects", label: "Open source" },
      { href: "/hp-2/pantheon", label: "Pantheon" },
      { label: "Guides", comingSoon: true },
      { label: "Changelog", comingSoon: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/hp-2/privacy", label: "Privacy policy" },
      { href: "/hp-2/terms", label: "Terms of service" },
      { href: "mailto:info@italianbuilders.co", label: "Contact us" },
    ],
  },
  {
    title: "Social",
    links: [
      { href: "https://x.com/italianbldrs", label: "X" },
      {
        href: "https://www.linkedin.com/company/italian-builders-community/posts/?feedView=all",
        label: "LinkedIn",
      },
      {
        href: "https://github.com/Italian-Builders-Org",
        label: "GitHub",
      },
    ],
  },
];

const hp2Roles = [
  "Builder",
  "Developer",
  "Designer",
  "Founder",
  "Investor",
  "Student",
  "Supporter",
  "Other",
];

type R2AuthProfile = Pick<
  Profile,
  "username" | "full_name" | "avatar_url" | "platform_role"
>;

function useR2AuthState() {
  const { user, loading } = useSupabaseSession();
  const [profile, setProfile] = useState<R2AuthProfile | null>(null);

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

      if (!cancelled) setProfile((data as R2AuthProfile | null) ?? null);
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function signOut() {
    await supabase?.auth.signOut();
    window.location.href = "/hp-2";
  }

  const isAdmin =
    profile?.platform_role === "admin" || profile?.platform_role === "owner";
  const profileHref = profile?.username
    ? `/hp-2/builders/${profile.username}`
    : "/hp-2/dashboard/profile";

  return { user, loading, profile, isAdmin, profileHref, signOut };
}

export function R2HeaderAuthControls() {
  const { user, loading, profile, isAdmin, profileHref, signOut } =
    useR2AuthState();

  if (loading) return <span className="hp2-auth-placeholder" />;

  if (!user) {
    return (
      <span className="hp2-auth-actions">
        <a href="/hp-2/login">Login</a>
        <a href="/hp-2/join">Join</a>
      </span>
    );
  }

  return (
    <span className="hp2-auth-actions">
      <a href={profileHref} className="hp2-profile-link">
        <img src={profile?.avatar_url || defaultAvatarUrl} alt="" />
        Profile
      </a>
      <a href="/hp-2/dashboard">Dashboard</a>
      {isAdmin && <a href="/hp-2/admin">Admin</a>}
      <button type="button" onClick={signOut}>
        <LogOut size={13} /> Sign out
      </button>
    </span>
  );
}

export function R2FooterAuthLinks() {
  const { user, loading, isAdmin, profileHref, signOut } = useR2AuthState();

  if (loading) return <span className="hp2-auth-placeholder" />;

  if (!user) {
    return (
      <span className="hp2-footer-auth">
        <a href="/hp-2/login">Builders login</a>
      </span>
    );
  }

  return (
    <span className="hp2-footer-auth">
      <a href={profileHref}>Profile</a>
      <a href="/hp-2/dashboard">Dashboard</a>
      {isAdmin && <a href="/hp-2/admin">Admin</a>}
      <button type="button" onClick={signOut}>
        <LogOut size={13} /> Sign out
      </button>
    </span>
  );
}

export function Hp2Footer() {
  return (
    <footer className="hp2-footer">
      <div className="hp2-footer-brand">
        <img src="/logo-vector-dark-mattoni.svg" alt="Italian Builders" />
        <p className="css-text-balance">
          Connecting people who build. A community for builders, founders,
          developers, designers and creators across Italy.
        </p>
      </div>

      <div className="hp2-footer-links">
        {hp2FooterGroups.map((group) => (
          <section key={group.title} aria-label={group.title}>
            <h2>{group.title}</h2>
            {group.links.map((link) =>
              link.comingSoon ? (
                <span key={link.label} className="hp2-footer-pending">
                  <span>{link.label}</span>
                  <span>Coming soon</span>
                </span>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.href?.startsWith("http") ? "_blank" : undefined}
                  rel={link.href?.startsWith("http") ? "noreferrer" : undefined}
                >
                  {link.label}
                </a>
              ),
            )}
          </section>
        ))}
      </div>

      <div className="hp2-footer-utility">
        <p>© {new Date().getFullYear()} Italian Builders.</p>
        <div>
          <R2FooterAuthLinks />
          <StyleSwitch />
        </div>
      </div>
    </footer>
  );
}

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

function loadHp2TurnstileScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (hp2TurnstileScriptPromise) return hp2TurnstileScriptPromise;

  hp2TurnstileScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${hp2TurnstileScriptSrc}"]`,
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
    script.src = hp2TurnstileScriptSrc;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Could not load security check.")),
      { once: true },
    );
    document.head.appendChild(script);
  });

  return hp2TurnstileScriptPromise;
}

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

function profileToBuilder(profile: Hp2Profile): Hp2Builder {
  const coords = profileCoords(profile);
  const role = profile.headline || profile.role || "Builder";

  return {
    id: profile.id,
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

function randomizeBuilders(builders: Hp2Builder[]) {
  const shuffled = builders.slice();

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[nextIndex]] = [
      shuffled[nextIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function useHp2Content(): Hp2Content {
  const { data: apiBuilders, isLoading: apiLoading } = useListBuilders({
    query: { queryKey: getListBuildersQueryKey() },
  });
  const { data: apiStats } = useGetDirectoryStats({
    query: { queryKey: getGetDirectoryStatsQueryKey() },
  });
  const { data: apiProjects } = useListProjects(undefined, {
    query: { queryKey: getListProjectsQueryKey() },
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
    let sourceBuilders: Hp2Builder[];

    if (profiles.length > 0) {
      sourceBuilders = profiles.map(profileToBuilder);
    } else {
      const directoryBuilders = hasItems(apiBuilders)
        ? apiBuilders
        : STATIC_BUILDERS;
      sourceBuilders = directoryBuilders
        .slice(0, 10)
        .map(fallbackBuilderToBuilder);
    }

    return randomizeBuilders(sourceBuilders);
  }, [apiBuilders, profiles]);

  const stats = isDirectoryStats(apiStats) ? apiStats : STATIC_DIRECTORY_STATS;
  const projects = hasItems(apiProjects) ? apiProjects : STATIC_PROJECTS;
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
    projectCount: new Intl.NumberFormat("en").format(projects.length),
    loading: profileLoading || apiLoading,
  };
}

function AnimatedHeroWord({
  children,
  index,
  className = "",
}: {
  children: string;
  index: number;
  className?: string;
}) {
  return (
    <span
      className={`hp2-hero-word ${className}`}
      style={{ "--hero-word-index": index } as CSSProperties}
    >
      {children}
    </span>
  );
}

function SequentialWordReveal({
  children,
  active,
  onComplete,
}: {
  children: string;
  active: boolean;
  onComplete: () => void;
}) {
  const words = useMemo(
    () => children.split(/\s+/).filter(Boolean),
    [children],
  );
  const completedRef = useRef(false);

  useEffect(() => {
    if (!active || completedRef.current) return;
    const duration = words.length * 36 + 760;
    const timer = window.setTimeout(() => {
      completedRef.current = true;
      onComplete();
    }, duration);

    return () => window.clearTimeout(timer);
  }, [active, onComplete, words.length]);

  return (
    <span className={`hp2-word-reveal ${active ? "is-visible" : ""}`}>
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

function ManifestoSequence() {
  const items = useMemo(
    () => [
      "Italian Builders exists to connect people who build. Our goal is to create the home for Italian builders of all ages and experience levels, a place where ideas, projects, knowledge, and opportunities can be shared.",
      "Talent is not the problem. Across Italy, builders are already creating remarkable products, companies, and technologies every day. Too often, they remain isolated or never meet the people who could help them take the next step.",
      "Our mission is to make those connections easier, more frequent, and more natural. The best opportunities are born from relationships, and great projects often begin when the right people meet at the right time.",
    ],
    [],
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visibleItems, setVisibleItems] = useState<boolean[]>(
    items.map(() => false),
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const paragraphs = Array.from(
      container.querySelectorAll<HTMLElement>("[data-manifesto-step]"),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleItems((current) => {
          const next = current.slice();
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const index = Number(
              (entry.target as HTMLElement).dataset.manifestoStep,
            );
            if (Number.isInteger(index)) next[index] = true;
          });
          return next;
        });
      },
      { rootMargin: "-18% 0px -24% 0px", threshold: 0.18 },
    );

    paragraphs.forEach((paragraph) => observer.observe(paragraph));
    return () => observer.disconnect();
  }, []);

  const handleComplete = useCallback(() => {
    setActiveIndex((current) => Math.min(current + 1, items.length - 1));
  }, [items.length]);

  return (
    <div ref={containerRef} className="hp2-manifesto-copy">
      {items.map((item, index) => (
        <p key={item} data-manifesto-step={index}>
          <SequentialWordReveal
            active={visibleItems[index] && index <= activeIndex}
            onComplete={handleComplete}
          >
            {item}
          </SequentialWordReveal>
        </p>
      ))}
    </div>
  );
}

function Hp2BuilderGlobe({
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
  ): Hp2GlobePoint[] => {
    const base = allBuilders.map((builder) => ({
      lat: builder.lat,
      lng: builder.lng,
      color: builder.id === active?.id ? hp2MapPinOutline : hp2MapPinColor,
      radius: builder.id === active?.id ? 0.17 : 0.075,
    }));

    return active
      ? [
          ...base,
          {
            lat: active.lat,
            lng: active.lng,
            color: hp2MapPinColor,
            radius: 0.12,
          },
        ]
      : base;
  };

  const activeRing = (builder: HomeMapBuilder | null): Hp2GlobePoint[] => {
    return builder
      ? [
          {
            lat: builder.lat,
            lng: builder.lng,
            color: hp2MapPinRing,
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

    Promise.all([import("three"), import("three-globe")])
      .then(([THREE, threeGlobeModule]) => {
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
          .atmosphereColor(hp2MapItalyColor)
          .atmosphereAltitude(0.09)
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
              ? hp2MapItalyColor
              : hp2MapCountryColor,
          )
          .polygonSideColor((feature: any) =>
            feature.properties?.ISO_A2 === "IT"
              ? "rgba(27, 138, 69, 0.24)"
              : "rgba(108, 90, 52, 0.12)",
          )
          .polygonStrokeColor((feature: any) =>
            feature.properties?.ISO_A2 === "IT"
              ? hp2MapItalyStroke
              : "rgba(238, 232, 207, 0.08)",
          )
          .polygonAltitude((feature: any) =>
            feature.properties?.ISO_A2 === "IT" ? 0.007 : 0.004,
          )
          .polygonCapCurvatureResolution(1);

        globeRef.current = globe;
        scene.add(globe);

        globe.globeMaterial(
          new THREE.MeshBasicMaterial({ color: hp2MapOceanColor }),
        );

        const ambient = new THREE.AmbientLight(0xf0e6c7, 2.4);
        const keyLight = new THREE.DirectionalLight(0xf7f1d5, 2.8);
        keyLight.position.set(-90, 80, 140);
        const rimLight = new THREE.DirectionalLight(0x1b8a45, 1.5);
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

        fetch(hp2EuropeGeoJsonUrl)
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
      })
      .catch(() => {
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
    <div ref={hostRef} className="relative z-0 h-full w-full overflow-hidden" />
  );
}

function Hp2TurnstileChallenge({
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

    loadHp2TurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "light",
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

  return <div ref={containerRef} className="hp2-turnstile" />;
}

export function Hp2DirectoryJoinForm() {
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetNonce, setTurnstileResetNonce] = useState(0);
  const isTurnstileConfigured = Boolean(hp2TurnstileSiteKey);
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const getValue = (key: string) => {
      const value = formData.get(key)?.toString().trim();
      return value || null;
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
      form.reset();
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

  if (submitted) {
    return (
      <div className="hp2-join-success" role="status">
        <strong>Check your email.</strong>
        <span>
          Open the verification link we sent you. After that, your request will
          be added to the directory queue.
        </span>
        <button type="button" onClick={() => setSubmitted(false)}>
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form className="hp2-join-form" onSubmit={handleSubmit}>
      {errorMsg && (
        <p className="hp2-join-error" role="alert">
          {errorMsg}
        </p>
      )}

      <div className="hp2-form-grid">
        <label>
          <span>Name</span>
          <input name="name" required placeholder="Your name" />
        </label>
        <label>
          <span>Email</span>
          <input
            name="email"
            required
            type="email"
            placeholder="you@domain.com"
          />
        </label>
        <label>
          <span>Role</span>
          <select name="role" required defaultValue={hp2Roles[0]}>
            {hp2Roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Telegram</span>
          <input name="telegram" required placeholder="@username" />
        </label>
      </div>

      <label>
        <span>What are you building?</span>
        <textarea
          name="building"
          rows={3}
          placeholder="A short description of your work, project, or idea"
        />
      </label>

      <div className="hp2-form-grid">
        <label>
          <span>Website</span>
          <input name="website" type="url" placeholder="https://..." />
        </label>
        <label>
          <span>Project URL</span>
          <input name="project" type="url" placeholder="https://..." />
        </label>
      </div>

      <div className="hp2-form-check">
        {isTurnstileConfigured && hp2TurnstileSiteKey ? (
          <Hp2TurnstileChallenge
            siteKey={hp2TurnstileSiteKey}
            resetNonce={turnstileResetNonce}
            onVerify={handleTurnstileVerify}
            onExpire={handleTurnstileExpire}
            onError={handleTurnstileError}
          />
        ) : (
          <span>Security check is not configured yet.</span>
        )}
      </div>

      <button type="submit" disabled={isSubmitting || !canSubmit}>
        {isSubmitting ? "Submitting..." : "Join the directory"}
        <ArrowRight size={18} />
      </button>
    </form>
  );
}

export default function Hp2Page() {
  const { builders, builderCount, cityCount, projectCount } = useHp2Content();
  const [activeBuilderId, setActiveBuilderId] = useState<
    string | number | null
  >(null);
  const activeBuilder = useMemo(
    () =>
      builders.find((builder) => builder.id === activeBuilderId) ??
      builders[0] ??
      null,
    [activeBuilderId, builders],
  );

  useEffect(() => {
    if (builders.length === 0) {
      setActiveBuilderId(null);
      return;
    }
    if (!builders.some((builder) => builder.id === activeBuilderId)) {
      setActiveBuilderId(builders[0].id);
    }
  }, [activeBuilderId, builders]);

  return (
    <div className="hp2-page">
      <header className="hp2-mast">
        <a href="/hp-2" className="hp2-logo-link" aria-label="Italian Builders">
          <img src="/logo-vector-dark-mattoni.svg" alt="Italian Builders" />
        </a>
        <nav aria-label="Hidden homepage preview sections">
          {hp2PrimaryLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          <R2HeaderAuthControls />
          <StyleSwitch currentStyle="r2" />
        </nav>
      </header>

      <main>
        <section className="hp2-hero">
          <h1
            className="hp2-hero-title css-text-balance"
            aria-label="Connecting the people who Build."
          >
            <span aria-hidden="true">
              <span className="hp2-hero-line">
                <AnimatedHeroWord index={0}>Connecting</AnimatedHeroWord>
              </span>
              <span className="hp2-hero-line">
                <AnimatedHeroWord index={1}>the</AnimatedHeroWord>{" "}
                <AnimatedHeroWord index={2}>people</AnimatedHeroWord>
              </span>
              <span className="hp2-hero-line hp2-hero-highlight">
                <AnimatedHeroWord index={3}>who</AnimatedHeroWord>{" "}
                <AnimatedHeroWord index={4} className="hp2-hero-build">
                  Build.
                </AnimatedHeroWord>
              </span>
            </span>
          </h1>
          <div className="hp2-hero-bottom">
            <p>
              Italian Builders exists to connect developers, designers,
              founders, creators, researchers, and entrepreneurs across Italy.
            </p>
            <div className="hp2-stats" aria-label="Italian Builders statistics">
              <div>
                <strong>635</strong>
                <small>
                  Members
                  <span>Telegram</span>
                </small>
              </div>
              <div>
                <strong>{builderCount}</strong>
                <small>builders</small>
              </div>
              <div>
                <strong>{cityCount}</strong>
                <small>cities</small>
              </div>
              <div>
                <strong>{projectCount}</strong>
                <small>projects</small>
              </div>
            </div>
          </div>
        </section>

        <section id="manifesto" className="hp2-manifesto">
          <h2>The Manifesto</h2>
          <ManifestoSequence />
        </section>

        <section id="directory" className="hp2-directory">
          <div className="hp2-directory-head">
            <div>
              <h2>The Directory</h2>
            </div>
            <p>
              Builder profiles, real photos where available, and the existing
              Italian Builders map language connected to the current public
              profile data.
            </p>
          </div>

          <div className="hp2-directory-layout">
            <div className="hp2-builder-list">
              {builders.map((builder) => {
                const content = (
                  <>
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
                const isActive = builder.id === activeBuilder?.id;
                const rowClassName = `hp2-builder-row ${
                  isActive ? "is-active" : ""
                }`;
                const rowEvents = {
                  onMouseEnter: () => setActiveBuilderId(builder.id),
                  onMouseMove: () => setActiveBuilderId(builder.id),
                  onPointerEnter: () => setActiveBuilderId(builder.id),
                  onFocus: () => setActiveBuilderId(builder.id),
                };

                return builder.href ? (
                  <a
                    key={builder.id}
                    href={builder.href}
                    className={rowClassName}
                    {...rowEvents}
                  >
                    {content}
                  </a>
                ) : (
                  <div key={builder.id} className={rowClassName} {...rowEvents}>
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
                <Hp2BuilderGlobe
                  builders={builders}
                  activeBuilder={activeBuilder}
                />
              </div>
            </aside>
          </div>
        </section>

        <section id="join" className="hp2-join">
          <div className="hp2-join-copy">
            <h2 className="css-text-balance">Join the directory</h2>
            <p className="css-text-balance">
              Add your builder record and tell the community what you are
              building.
            </p>
          </div>
          <Hp2DirectoryJoinForm />
        </section>
      </main>

      <Hp2Footer />
    </div>
  );
}
