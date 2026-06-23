import type { CSSProperties, ReactNode } from "react";

export const ROMAN_HERO_BACKGROUNDS = {
  home: {
    src: "/images/brand-heritage.png",
    position: "center 30%",
    opacity: 0.07,
  },
  pantheon: {
    src: "/images/pioneers/filippo-brunelleschi-work.jpg",
    position: "center center",
    opacity: 0.09,
  },
  mission: {
    src: "/images/pioneers/adriano-olivetti-work.jpg",
    position: "center 40%",
    opacity: 0.08,
  },
  builders: {
    src: "/images/pioneers/guglielmo-marconi-work.jpg",
    position: "center center",
    opacity: 0.08,
  },
  projects: {
    src: "/images/pioneers/leonardo-da-vinci-work.jpg",
    position: "center center",
    opacity: 0.08,
  },
} as const;

export type RomanHeroBackgroundKey = keyof typeof ROMAN_HERO_BACKGROUNDS;

export function romanHeroProps(key: RomanHeroBackgroundKey): {
  className: string;
  style: CSSProperties;
} {
  const bg = ROMAN_HERO_BACKGROUNDS[key];
  return {
    className: "dt-roman-hero dt-roman-hero--has-image",
    style: {
      "--roman-hero-image": `url(${bg.src})`,
      "--roman-hero-position": bg.position,
      "--roman-hero-opacity": String(bg.opacity),
    } as CSSProperties,
  };
}

type RomanDividerProps = {
  className?: string;
};

export function RomanDivider({ className = "" }: RomanDividerProps) {
  return (
    <div
      className={`dt-roman-divider ${className}`}
      role="presentation"
      aria-hidden="true"
    />
  );
}

type RomanEyebrowProps = {
  children: ReactNode;
  className?: string;
};

export function RomanEyebrow({ children, className = "" }: RomanEyebrowProps) {
  return (
    <div className={`dt-roman-eyebrow ${className}`}>
      <span className="dt-roman-eyebrow-mark" aria-hidden="true" />
      <span>{children}</span>
      <span className="dt-roman-eyebrow-mark" aria-hidden="true" />
    </div>
  );
}

type RomanLaurelProps = {
  className?: string;
  mirrored?: boolean;
};

export function RomanLaurel({ className = "", mirrored = false }: RomanLaurelProps) {
  return (
    <svg
      viewBox="0 0 80 28"
      className={`dt-roman-laurel text-[hsl(38_62%_58%/0.55)] ${mirrored ? "-scale-x-100" : ""} ${className}`}
      aria-hidden="true"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        d="M4 18c8-10 18-12 28-10M8 22c6-4 12-6 20-5M12 14c4-6 10-8 16-7"
      />
      <path
        fill="currentColor"
        d="M6 16.5a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zm4 3.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3-6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm5 4.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm4-7a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        transform="translate(80,0) scale(-1,1)"
        d="M4 18c8-10 18-12 28-10M8 22c6-4 12-6 20-5M12 14c4-6 10-8 16-7"
      />
      <path
        fill="currentColor"
        transform="translate(80,0) scale(-1,1)"
        d="M6 16.5a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zm4 3.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3-6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm5 4.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm4-7a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
      />
    </svg>
  );
}

type RomanMottoStripProps = {
  techLabels: boolean;
};

export function RomanMottoStrip({ techLabels }: RomanMottoStripProps) {
  return (
    <div className="dt-footer-crest">
      <RomanLaurel className="hidden h-5 w-20 sm:block" />
      <div className="text-center">
        <p className="dt-roman-motto">
          {techLabels ? "EX INGENIIS, FUTURA" : "Ex ingeniis, futura"}
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
          {techLabels
            ? "FROM_ITALIAN_INGENUITY_THE_FUTURE_IS_BUILT"
            : "From Italian ingenuity, the future is built"}
        </p>
      </div>
      <RomanLaurel className="hidden h-5 w-20 sm:block" mirrored />
    </div>
  );
}

type RomanStatueProps = {
  src: string;
  side: "left" | "right";
  variant?: "footer" | "hero";
  className?: string;
};

export function RomanStatue({
  src,
  side,
  variant = "footer",
  className = "",
}: RomanStatueProps) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className={`dt-roman-statue dt-roman-statue--${side} dt-roman-statue--${variant} ${className}`}
    />
  );
}

export const ROMAN_STATUES = {
  discobolus: "/images/roman/discobolus.jpg",
  nike: "/images/roman/nike-samothrace.jpg",
  venus: "/images/roman/venus-de-milo.jpg",
} as const;
