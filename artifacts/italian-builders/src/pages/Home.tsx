import React, { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch as ToggleSwitch } from "@/components/ui/switch";
import {
  Menu, X, ArrowRight, Twitter, Linkedin, Globe, Link as LinkIcon,
  CheckCircle2, ChevronRight, ChevronLeft, ChevronUp, MapPin,
  Terminal, Activity, Database, Server, Code2
} from "lucide-react";
import {
  useListBuilders, getListBuildersQueryKey,
  useListProjects, getListProjectsQueryKey,
  useListOsProjects, getListOsProjectsQueryKey,
  useGetDirectoryStats, getGetDirectoryStatsQueryKey,
  useGetWaitlistCount, getGetWaitlistCountQueryKey,
  useCreateWaitlistSignup
} from "@workspace/api-client-react";
import {
  STATIC_BUILDERS,
  STATIC_DIRECTORY_STATS,
  STATIC_OS_PROJECTS,
  STATIC_PROJECTS,
  hasItems,
  isDirectoryStats,
  isWaitlistCount,
  isWaitlistSignup,
} from "@/data/directory";

// --- Static Data ---

const WHO_FOR = [
  {
    title: "Builders",
    description: "People building products, startups and businesses.",
    icon: Terminal
  },
  {
    title: "Contributors",
    description: "Developers, designers, marketers and operators.",
    icon: Code2
  },
  {
    title: "Supporters",
    description: "Mentors, advisors and people helping the ecosystem grow.",
    icon: Activity
  },
  {
    title: "Investors",
    description: "Angels, scouts and people looking for emerging talent.",
    icon: Database
  }
];

const ROLES = [
  "Builder", "Developer", "Designer", "Founder", "Investor", "Student", "Supporter", "Other"
];

const CITY_COORDS: Record<string, [number, number]> = {
  Milano: [45.4642, 9.19],
  Torino: [45.0703, 7.6869],
  Bologna: [44.4949, 11.3426],
  Roma: [41.9028, 12.4964],
  Napoli: [40.8518, 14.2681],
  Firenze: [43.7696, 11.2558],
  Verona: [45.4384, 10.9916],
  Palermo: [38.1157, 13.3615],
  Genova: [44.4056, 8.9463],
  Padova: [45.4064, 11.8768],
};

const EUROPE_GEOJSON_URL = "/maps/europe-italy-vector.geojson";
const MAP_OCEAN_COLOR = "#020817";
const MAP_COUNTRY_COLOR = "rgba(30, 64, 120, 0.96)";
const MAP_ITALY_COLOR = "rgba(37, 99, 235, 0.9)";
const MAP_ITALY_STROKE = "rgba(0, 0, 0, 0)";
const MAP_PIN_COLOR = "#3b82f6";
const MAP_PIN_OUTLINE = "rgba(239, 246, 255, 0.88)";
const MAP_PIN_RING = "rgba(15, 23, 42, 0.72)";

const OS_PROJECT_ICONS: Record<string, React.FC<any>> = {
  Database, Code2, Server
};

// --- Sub-components ---

type TechLabelsContextValue = {
  techLabels: boolean;
  setTechLabels: (value: boolean) => void;
};

const TechLabelsContext = React.createContext<TechLabelsContextValue>({
  techLabels: true,
  setTechLabels: () => {},
});

export function TechLabelProvider({ children }: { children: React.ReactNode }) {
  const [techLabels, setTechLabels] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("italian-builders-label-mode") !== "friendly";
  });

  useEffect(() => {
    window.localStorage.setItem("italian-builders-label-mode", techLabels ? "tech" : "friendly");
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
    <label className={`flex items-center gap-2 text-zinc-400 ${compact ? "justify-between" : ""}`}>
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

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { techLabels } = useTechLabels();
  const navLabelClass = `text-xs text-zinc-500 hover:text-zinc-100 transition-colors ${techLabels ? "font-mono uppercase" : "font-medium"}`;
  const secondaryActionClass = `text-xs text-zinc-400 hover:text-zinc-100 ${techLabels ? "font-mono uppercase" : "font-medium"}`;
  const primaryActionClass = `inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-blue-600 hover:bg-blue-500 text-white text-xs dt-button rounded-sm ${techLabels ? "font-mono uppercase" : "font-semibold"}`;
  const mobileNavClass = `text-sm text-zinc-400 ${techLabels ? "font-mono uppercase" : "font-medium"}`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
      <div className="container mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-white text-zinc-900 flex items-center justify-center font-mono text-xs font-bold leading-none">
            IT
          </div>
          <span className={`font-semibold text-sm tracking-tight text-zinc-100 ${techLabels ? "uppercase" : ""}`}>
            {techLabels ? "Italian Builders" : "Italian Builders"}
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="/builders" className={navLabelClass}>{techLabels ? "/builders" : "Builders"}</a>
          <a href="/projects" className={navLabelClass}>{techLabels ? "/projects" : "Projects"}</a>
          <a href="/os-projects" className={navLabelClass}>{techLabels ? "/initiatives" : "Initiatives"}</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <TechLabelToggle />
          <a href="/join" className={secondaryActionClass}>{techLabels ? "Sign in" : "Sign in"}</a>
          <a href="/join" className={`${primaryActionClass} h-8 px-4`}>
            {techLabels ? "Join Waitlist" : "Join Waitlist"}
          </a>
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
            <a href="/builders" onClick={() => setMobileMenuOpen(false)} className={mobileNavClass}>{techLabels ? "/builders" : "Builders"}</a>
            <a href="/projects" onClick={() => setMobileMenuOpen(false)} className={mobileNavClass}>{techLabels ? "/projects" : "Projects"}</a>
            <a href="/os-projects" onClick={() => setMobileMenuOpen(false)} className={mobileNavClass}>{techLabels ? "/initiatives" : "Initiatives"}</a>
          </nav>
          <div className="pt-4 border-t border-zinc-800 flex flex-col gap-3">
            <TechLabelToggle compact />
            <a href="/join" onClick={() => setMobileMenuOpen(false)} className={`inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border h-9 w-full text-xs dt-button rounded-sm border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-white ${techLabels ? "font-mono uppercase" : "font-semibold"}`}>{techLabels ? "Sign in" : "Sign in"}</a>
            <a href="/join" onClick={() => setMobileMenuOpen(false)} className={`${primaryActionClass} h-9 w-full`}>
              {techLabels ? "Join Waitlist" : "Join Waitlist"}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

type GlobePoint = {
  lat: number;
  lng: number;
  color: string;
  radius: number;
};

function BuilderGlobe({ activeBuilder }: { activeBuilder: any | null }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const activeBuilderRef = useRef(activeBuilder);

  const activePoint = (builder: any | null): GlobePoint[] => {
    const location = builder?.location ? CITY_COORDS[builder.location] : undefined;
    return location
      ? [
          { lat: location[0], lng: location[1], color: MAP_PIN_OUTLINE, radius: 0.17 },
          { lat: location[0], lng: location[1], color: MAP_PIN_COLOR, radius: 0.12 },
        ]
      : [];
  };

  const activeRing = (builder: any | null): GlobePoint[] => {
    const location = builder?.location ? CITY_COORDS[builder.location] : undefined;
    return location ? [{ lat: location[0], lng: location[1], color: MAP_PIN_RING, radius: 0.12 }] : [];
  };

  useEffect(() => {
    activeBuilderRef.current = activeBuilder;
    const pointData = activePoint(activeBuilder);
    globeRef.current?.pointsData(pointData);
    globeRef.current?.ringsData(activeRing(activeBuilder));
  }, [activeBuilder]);

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

    Promise.all([import("three"), import("three-globe")]).then(([THREE, threeGlobeModule]) => {
      if (disposed) return;

      const ThreeGlobe = threeGlobeModule.default;
      scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(18, 1, 0.1, 1200);
      camera.position.set(0, 0, 160);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      host.appendChild(renderer.domElement);

      const globe = new ThreeGlobe({ waitForGlobeReady: false, animateIn: false })
        .showAtmosphere(true)
        .atmosphereColor("#3b82f6")
        .atmosphereAltitude(0.11)
        .globeCurvatureResolution(2)
        .pointsData(activePoint(activeBuilderRef.current))
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
        .polygonCapColor((feature: any) => (feature.properties?.ISO_A2 === "IT" ? MAP_ITALY_COLOR : MAP_COUNTRY_COLOR))
        .polygonSideColor((feature: any) => (feature.properties?.ISO_A2 === "IT" ? "rgba(37, 99, 235, 0.18)" : "rgba(30, 58, 104, 0.1)"))
        .polygonStrokeColor((feature: any) => (feature.properties?.ISO_A2 === "IT" ? MAP_ITALY_STROKE : "rgba(0, 0, 0, 0)"))
        .polygonAltitude((feature: any) => (feature.properties?.ISO_A2 === "IT" ? 0.007 : 0.004))
        .polygonCapCurvatureResolution(1);

      globeRef.current = globe;
      scene.add(globe);

      globe.globeMaterial(new THREE.MeshBasicMaterial({ color: MAP_OCEAN_COLOR }));

      const ambient = new THREE.AmbientLight(0xb8c5d9, 2.2);
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
      keyLight.position.set(-90, 80, 140);
      const rimLight = new THREE.DirectionalLight(0x3b82f6, 1.6);
      rimLight.position.set(120, -40, -80);
      scene.add(ambient, keyLight, rimLight);

      const italyCoords = globe.getCoords(42.85, 12.45, 0);
      const italyVector = new THREE.Vector3(italyCoords.x, italyCoords.y, italyCoords.z).normalize();
      const italyTargetVector = new THREE.Vector3(0, 0.02, 1).normalize();
      const baseQuaternion = new THREE.Quaternion().setFromUnitVectors(italyVector, italyTargetVector);
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
        const rect = panel?.getBoundingClientRect() ?? host.getBoundingClientRect();
        const viewport = window.innerHeight || 1;
        const centerDelta = (rect.top + rect.height / 2 - viewport / 2) / viewport;
        targetScroll = Math.max(-1, Math.min(1, centerDelta));
      };

      const animate = () => {
        if (disposed) return;
        easedScroll += (targetScroll - easedScroll) * 0.06;
        const scrollAmount = Math.abs(easedScroll);
        const time = performance.now() * 0.00035;

        scrollQuaternion.setFromAxisAngle(xAxis, easedScroll * 0.045);
        driftQuaternion.setFromAxisAngle(yAxis, Math.sin(time) * 0.018);
        globe.quaternion.copy(scrollQuaternion).multiply(driftQuaternion).multiply(baseQuaternion);
        camera.position.z = 160 + scrollAmount * 105;

        renderer.render(scene, camera);
        frame = requestAnimationFrame(animate);
      };

      fetch(EUROPE_GEOJSON_URL)
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`GeoJSON ${res.status}`))))
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
      removeScrollListener = () => window.removeEventListener("scroll", updateScroll);
      resize();
      updateScroll();
      animate();
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

  return <div ref={hostRef} className="h-full w-full overflow-hidden" />;
}

function Hero() {
  const { data: buildersData } = useListBuilders({ query: { queryKey: getListBuildersQueryKey() } });
  const { data: statsData } = useGetDirectoryStats({ query: { queryKey: getGetDirectoryStatsQueryKey() } });
  const builders = hasItems(buildersData) ? buildersData : STATIC_BUILDERS;
  const stats = isDirectoryStats(statsData) ? statsData : STATIC_DIRECTORY_STATS;
  const { techLabels } = useTechLabels();
  
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (builders.length === 0) return;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % builders.length);
    }, 2600);
    return () => clearInterval(id);
  }, [builders.length]);

  const current = builders.length > 0 ? builders[active] : null;
  const avatarStack = builders.slice(0, 3);

  return (
    <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 border-b border-zinc-800 overflow-hidden bg-zinc-950">
      <div className="absolute inset-0 dt-grid-bg opacity-[0.6] pointer-events-none" />
      <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 xl:gap-16 items-center">
          <div className="flex-1 lg:flex-[0.9] max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold text-zinc-50 mb-6 leading-[1.1] tracking-tight">
              The home of Italian Builders.<br />
              <span className="text-blue-500">Connecting the people who build.</span>
            </h1>

            <p className="text-base md:text-lg text-zinc-400 mb-8 max-w-xl leading-relaxed">
              Italian Builders exists to help founders, developers, designers and makers discover each other, share projects and create opportunities.
              <br /><br />
              From AI and open source to SaaS, mobile apps and startups, what unites us is not what we build, but the fact that we choose to build.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <a href="#join" className="inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white font-mono uppercase text-xs dt-button rounded-sm w-full sm:w-auto">
                {techLabels ? "Join Waitlist" : "Join Waitlist"} <ArrowRight size={16} className="ml-2" />
              </a>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
              <div className="flex -space-x-1">
                {avatarStack.map((b, i) => (
                  <img key={i} src={b.avatarUrl} className="w-6 h-6 border border-zinc-700 rounded-sm" alt="Builder" />
                ))}
              </div>
              <div className="h-4 w-px bg-zinc-700" />
              <p>500+ builders across Italy</p>
            </div>
          </div>

          <div className="w-full lg:flex-[1.18] lg:max-w-none">
            <div className="dt-card p-3 relative overflow-hidden">
              <div className="absolute inset-0 dt-grid-bg opacity-40 pointer-events-none" />

              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">{techLabels ? "Builder map" : "Builder map"}</span>
                <span className="text-[10px] font-mono text-blue-400 uppercase flex items-center gap-1">
                  <MapPin size={10} /> Italia
                </span>
              </div>

              <div data-globe-panel className="relative h-[330px] w-full sm:h-[420px] lg:h-[520px] xl:h-[590px]">
                <BuilderGlobe activeBuilder={current} />

                {current && (
                  <div className="absolute bottom-2 left-2 right-2 z-10">
                    <div className="dt-card bg-zinc-950/80 backdrop-blur-sm p-2.5 flex items-center gap-3">
                      <img src={current.avatarUrl} alt={current.name} className="w-8 h-8 object-cover border border-zinc-700 grayscale rounded-sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          <span className="text-xs font-bold text-zinc-100 truncate">{current.name}</span>
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
                {[
                  { label: "Builders", value: stats.builders },
                  { label: "Regions", value: stats.regions },
                  { label: "Cities", value: stats.cities },
                ].map((stat) => (
                  <div key={stat.label} className="bg-zinc-950 px-3 py-2.5 text-center">
                    <div className="text-sm font-bold text-zinc-100">{stat.value}</div>
                    <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">{stat.label}</div>
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

export function FeaturedBuilders() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: buildersData } = useListBuilders({ query: { queryKey: getListBuildersQueryKey() } });
  const builders = hasItems(buildersData) ? buildersData : STATIC_BUILDERS;
  const { techLabels } = useTechLabels();

  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  
  // Safe offset calculation
  const offset = builders.length > 0 ? dayOfYear % builders.length : 0;
  const todaysBuilders = builders.length > 0 
    ? [...builders.slice(offset), ...builders.slice(0, offset)] 
    : [];

  const formattedDate = now.toISOString().split('T')[0];

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  if (!builders || builders.length === 0) {
    return null; // or loading state
  }

  return (
    <section id="builders" className="py-20 bg-zinc-950 border-b border-zinc-800">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <div className="text-xs font-mono text-blue-400 mb-2 font-semibold tracking-wider">
              {techLabels ? `Featured builders - ${formattedDate}` : "Featured builders"}
            </div>
            <h2 className="text-3xl font-bold text-zinc-50 mb-2">Builder Highlights</h2>
            <p className="text-sm text-zinc-500 font-mono">
              {techLabels ? "People building products, startups and experiments across Italy." : "People building products, startups and experiments across Italy."}
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
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto dt-scrollbar snap-x snap-mandatory scroll-smooth pb-4"
          >
            {todaysBuilders.map((builder, i) => (
              <div
                key={`${builder.id}-${i}`}
                className="snap-start flex-shrink-0 w-80 dt-card p-5 flex flex-col group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={builder.avatarUrl}
                      alt={builder.name}
                      className="w-10 h-10 object-cover border border-zinc-700 grayscale rounded-sm"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-zinc-100">{builder.name}</h3>
                      <div className="text-xs font-mono text-zinc-500">
                        {builder.role}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 uppercase">
                    <MapPin size={10} /> {builder.location}
                  </div>
                </div>

                <div className="text-sm text-zinc-300 leading-relaxed mb-4 flex-grow border-l-2 border-zinc-700 pl-3">
                  "{builder.highlight}"
                </div>

                <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
                  {builder.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 border border-zinc-800 bg-zinc-900 text-[10px] font-mono font-medium text-zinc-400 uppercase rounded-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  className="w-full justify-between h-8 rounded-sm border border-zinc-800 text-xs font-mono uppercase bg-zinc-900 hover:bg-zinc-800 hover:text-zinc-100 text-zinc-400"
                >
                  {techLabels ? "View profile" : "View profile"}
                  <ArrowRight size={14} className="text-zinc-500 group-hover:text-zinc-200 transition-colors" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function BuilderProjects() {
  // Use category filter query if active !== "All"
  const [active, setActive] = useState("All");
  const [showAll, setShowAll] = useState(false);
  const { techLabels } = useTechLabels();
  
  // We'll fetch all projects to extract categories, then use the filtered ones for display
  const { data: projectsData } = useListProjects(undefined, { query: { queryKey: getListProjectsQueryKey() } });
  const allProjects = hasItems(projectsData) ? projectsData : STATIC_PROJECTS;
  
  const categories = ["All", "AI", "SaaS", "B2B", "B2C", "Open Source", "Developer Tools", "Mobile", "Crypto"];
  
  const filtered = active === "All" ? allProjects : allProjects.filter((p) => p.category === active);
  const visible = showAll ? filtered : filtered.slice(0, 6);
  const hasMore = filtered.length > visible.length;

  return (
    <section id="projects" className="py-20 bg-zinc-900/40 border-b border-zinc-800">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-8">
          <div className="text-xs font-mono text-blue-400 mb-2 font-semibold tracking-wider">
            {techLabels ? "Project showcase" : "Project showcase"}
          </div>
          <h2 className="text-3xl font-bold text-zinc-50 mb-2">
            {techLabels ? "Community Projects" : "Community Projects"}
          </h2>
          <p className="text-sm text-zinc-500 font-mono max-w-2xl">
            Discover products, startups, side projects and experiments created by members of the community.
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto dt-scrollbar pb-3 mb-6 md:flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActive(cat); setShowAll(false); }}
              className={`px-3 py-1 text-xs font-mono uppercase border transition-colors flex-shrink-0 rounded-sm ${
                active === cat
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((project, i) => (
            <div key={`${project.id}-${i}`} className="group dt-card flex flex-col">
              <div className="aspect-[16/9] w-full bg-zinc-900 border-b border-zinc-800 relative overflow-hidden">
                 <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" />
                 <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-[10px] font-mono font-bold uppercase border rounded-sm ${project.statusColor} backdrop-blur-sm`}>
                      {project.status}
                    </span>
                 </div>
              </div>

              <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-base text-zinc-100 leading-none">{project.name}</h3>
                  <span className="text-[10px] font-mono text-zinc-500 border border-zinc-800 px-1.5 py-0.5 bg-zinc-900 rounded-sm">{project.category}</span>
                </div>

                <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{project.description}</p>

                <div className="mt-auto pt-3 border-t border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={project.avatarUrl} alt={project.builder} className="w-5 h-5 rounded-sm border border-zinc-700 grayscale" />
                    <span className="text-xs font-mono text-zinc-300">{project.builder}</span>
                  </div>
                  <ArrowRight size={14} className="text-zinc-600 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="mt-10 flex justify-center border-t border-zinc-800 pt-10">
            <Button
              onClick={() => setShowAll(true)}
              variant="outline"
              className="h-10 px-6 border-zinc-800 text-zinc-300 text-xs font-mono uppercase bg-zinc-950 hover:bg-zinc-900 hover:text-zinc-100 rounded-sm"
            >
              {techLabels ? "Show more projects" : "Show more projects"} <ChevronUp className="ml-2 rotate-180" size={14} />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

export function CommunityProjects() {
  const { data: osProjectsData } = useListOsProjects({ query: { queryKey: getListOsProjectsQueryKey() } });
  const osProjects = hasItems(osProjectsData) ? osProjectsData : STATIC_OS_PROJECTS;
  const { techLabels } = useTechLabels();

  return (
    <section id="os-projects" className="py-20 bg-zinc-950 border-b border-zinc-800">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="text-xs font-mono text-blue-400 mb-2 font-semibold tracking-wider">
            {techLabels ? "Community initiatives" : "Community initiatives"}
          </div>
          <h2 className="text-3xl font-bold text-zinc-50 mb-3">Community Initiatives</h2>
          <p className="text-sm text-zinc-500 font-mono">
            {techLabels ? "Projects created together to help builders connect, collaborate and grow." : "Projects created together to help builders connect, collaborate and grow."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {osProjects.map((project, i) => {
            const Icon = OS_PROJECT_ICONS[project.icon] || Code2;
            return (
              <div key={project.id} className="dt-card p-5 group flex flex-col hover:border-blue-500/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-8 h-8 rounded-sm bg-zinc-900 border border-zinc-800 flex items-center justify-center ${project.color} group-hover:border-blue-500/40 transition-colors`}>
                    <Icon size={16} />
                  </div>
                  <span className="text-[10px] font-mono border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-zinc-500 uppercase rounded-sm">
                    {project.status}
                  </span>
                </div>

                <h3 className="font-bold text-base text-zinc-100 mb-2">{project.title}</h3>
                <p className="text-sm text-zinc-400 mb-6 flex-grow">{project.description}</p>

                <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pt-4 border-t border-zinc-800">
                  <span className="uppercase">{project.category}</span>
                  <a href="#" className="text-blue-400 hover:text-blue-300 font-semibold group-hover:underline flex items-center gap-1">
                    {techLabels ? "View project" : "View project"} <ArrowRight size={12} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Join() {
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { techLabels } = useTechLabels();
  const formLabelClass = `text-xs text-zinc-400 ${techLabels ? "font-mono" : "font-medium"}`;
  const helperTextClass = `text-sm text-zinc-400 ${techLabels ? "font-mono" : ""}`;
  const smallHelperClass = `text-xs text-zinc-400 ${techLabels ? "font-mono" : ""}`;
  const inputClass = `bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 h-9 text-sm rounded-sm focus-visible:ring-1 focus-visible:ring-blue-500 ${techLabels ? "font-mono" : ""}`;
  const iconInputClass = `pl-8 bg-zinc-900 border-zinc-700 text-zinc-100 h-9 text-sm rounded-sm ${techLabels ? "font-mono" : ""}`;
  const buttonLabelClass = `w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white h-10 rounded-sm text-xs dt-button shadow-none disabled:opacity-50 ${techLabels ? "font-mono uppercase" : "font-semibold"}`;
  const queryClient = useQueryClient();
  const { data: countData } = useGetWaitlistCount({ query: { queryKey: getGetWaitlistCountQueryKey() } });
  
  const createWaitlist = useCreateWaitlistSignup({
    mutation: {
      onSuccess: (row) => {
        if (!isWaitlistSignup(row)) {
          setErrorMsg("Waitlist API is not connected yet. Please try again after launch.");
          return;
        }
        setSubmitted(true);
        setErrorMsg("");
        queryClient.invalidateQueries({ queryKey: getGetWaitlistCountQueryKey() });
      },
      onError: (err: any) => {
        setErrorMsg(err?.message || err?.error || "Connection refused. Please verify inputs.");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Map empty optional fields to undefined
    const getValue = (key: string) => {
      const val = formData.get(key)?.toString();
      return val ? val : undefined;
    };

    createWaitlist.mutate({
      data: {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        role: formData.get("role") as string,
        building: getValue("building"),
        xHandle: getValue("twitter"),
        linkedin: getValue("linkedin"),
        website: getValue("website"),
        projectUrl: getValue("project"),
      }
    });
  };

  return (
    <section id="join" className="py-24 bg-zinc-900 text-zinc-300 border-t-4 border-blue-600">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.86fr)_minmax(500px,1.14fr)] gap-16 lg:gap-14 xl:gap-16 items-start">

          <div>
            <div className="text-xs font-mono text-blue-400 mb-4 font-semibold tracking-wider uppercase flex items-center gap-2">
              <span>{techLabels ? "Who can join" : "Who can join"}</span>
              {isWaitlistCount(countData) && (
                <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-sm text-[10px]">
                  {techLabels ? `${countData.count} waiting` : `${countData.count} waiting`}
                </span>
              )}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
              {techLabels ? "Join the Community" : "Join the Community"}
            </h2>
            <p className={`${helperTextClass} mb-10`}>
              {techLabels
                ? "Tell us who you are and what you're building. We'll let you know when the platform launches."
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
                      <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">{item.description}</p>
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
                {techLabels ? "Join request" : "Join request"}
               </span>
            </div>

            <div className="mt-4">
              {submitted ? (
                <div className="flex flex-col items-center justify-center text-center py-12 h-full">
                  <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-sm flex items-center justify-center mb-6">
                    <CheckCircle2 size={24} className="text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {techLabels ? "You're on the list." : "You're on the list."}
                  </h3>
                  <p className={`${helperTextClass} mb-8 max-w-xs`}>
                    {techLabels
                      ? "We'll keep you updated as Italian Builders grows."
                      : "We'll keep you updated as Italian Builders grows."}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSubmitted(false)}
                    className={`h-8 text-xs bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white rounded-sm ${techLabels ? "font-mono" : "font-semibold"}`}
                  >
                    {techLabels ? "Submit another" : "Submit another"}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {techLabels ? "Join the Waitlist" : "Join the Waitlist"}
                    </h3>
                    <p className={smallHelperClass}>
                      {techLabels ? "Tell us who you are and what you're building." : "Tell us who you are and what you're building."}
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-sm mb-4">
                      <p className={`text-xs text-red-400 ${techLabels ? "font-mono" : "font-medium"}`}>{techLabels ? "ERR:" : "Problem:"} {errorMsg}</p>
                    </div>
                  )}

                    <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="name" className={formLabelClass}>{techLabels ? "Name" : "Name"} <span className="text-blue-400">*</span></Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        placeholder="John Doe"
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="email" className={formLabelClass}>{techLabels ? "Email" : "Email"} <span className="text-blue-400">*</span></Label>
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
                      <Label htmlFor="role" className={formLabelClass}>{techLabels ? "Role" : "Role"} <span className="text-blue-400">*</span></Label>
                      <Select required defaultValue={ROLES[0]} name="role">
                        <SelectTrigger id="role" className={`bg-zinc-900 border-zinc-700 text-zinc-100 h-9 text-sm rounded-sm focus:ring-1 focus:ring-blue-500 ${techLabels ? "font-mono" : ""}`}>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100 rounded-sm">
                          {ROLES.map(role => (
                            <SelectItem key={role} value={role} className={`focus:bg-zinc-700 focus:text-white text-xs ${techLabels ? "font-mono" : ""}`}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="building" className={formLabelClass}>
                        {techLabels ? "What are you building?" : "What are you building?"} <span className="text-zinc-600">{techLabels ? "(optional)" : "(optional)"}</span>
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
                        <Label htmlFor="twitter" className={formLabelClass}>{techLabels ? "X (optional)" : "X (optional)"}</Label>
                        <div className="relative">
                          <Twitter size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
                          <Input id="twitter" name="twitter" placeholder="@username" className={iconInputClass} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="linkedin" className={formLabelClass}>{techLabels ? "LinkedIn (optional)" : "LinkedIn (optional)"}</Label>
                        <div className="relative">
                          <Linkedin size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
                          <Input id="linkedin" name="linkedin" placeholder="in/username" className={iconInputClass} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="website" className={formLabelClass}>{techLabels ? "Website (optional)" : "Website (optional)"}</Label>
                      <div className="relative">
                        <Globe size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
                        <Input id="website" name="website" type="url" placeholder="https://..." className={iconInputClass} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="project" className={formLabelClass}>{techLabels ? "Project URL (optional)" : "Project URL (optional)"}</Label>
                      <div className="relative">
                        <LinkIcon size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
                        <Input id="project" name="project" type="url" placeholder="https://..." className={iconInputClass} />
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={createWaitlist.isPending}
                    className={buttonLabelClass}
                  >
                    {createWaitlist.isPending
                      ? techLabels ? "Submitting..." : "Submitting..."
                      : techLabels ? "Join the Community" : "Join the Community"}
                  </Button>
                  <p className={`text-[10px] text-center text-zinc-500 mt-3 ${techLabels ? "font-mono" : ""}`}>
                    {techLabels ? "We'll use this to keep you updated." : "We'll use this to keep you updated."}
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

  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 pt-12 pb-8 text-zinc-400">
      <div className="container mx-auto px-4 md:px-6">
        <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12 ${techLabels ? "font-mono text-xs" : "text-sm"}`}>
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4 text-white">
              <div className="w-5 h-5 bg-white text-zinc-900 flex items-center justify-center text-[10px] font-bold">
                IT
              </div>
              <span className={`font-semibold ${techLabels ? "uppercase tracking-wider" : ""}`}>
                {techLabels ? "Italian Builders" : "Italian Builders"}
              </span>
            </div>
            <p className="text-zinc-500 mb-6 max-w-xs leading-relaxed">
              {techLabels
                ? "Connecting people who build. A community for builders, founders, developers, designers and creators across Italy."
                : "Connecting people who build. A community for builders, founders, developers, designers and creators across Italy."}
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-zinc-500 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter size={16} />
              </a>
              <a href="#" className="text-zinc-500 hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin size={16} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2">
              <li><a href="/builders" className="hover:text-white transition-colors">Directory</a></li>
              <li><a href="/projects" className="hover:text-white transition-colors">Showcase</a></li>
              <li><a href="/os-projects" className="hover:text-white transition-colors">{techLabels ? "Initiatives" : "Initiatives"}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Mission</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Guidelines</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">{techLabels ? "Privacy policy" : "Privacy policy"}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{techLabels ? "Terms of service" : "Terms of service"}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{techLabels ? "Contact us" : "Contact us"}</a></li>
            </ul>
          </div>
        </div>

        <div className={`pt-6 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4 ${techLabels ? "font-mono text-[10px]" : "text-xs"}`}>
          <p className="text-zinc-600">© {new Date().getFullYear()} ITALIAN BUILDERS. ALL RIGHTS RESERVED.</p>
          <TechLabelToggle />
        </div>
      </div>
    </footer>
  );
}

// --- Main Page Component ---

export default function Home() {
  return (
    <div className="dark-technical-theme min-h-screen">
      <Header />
      <main>
        <Hero />
        <FeaturedBuilders />
        <BuilderProjects />
        <CommunityProjects />
        <Join />
      </main>
      <Footer />
    </div>
  );
}
