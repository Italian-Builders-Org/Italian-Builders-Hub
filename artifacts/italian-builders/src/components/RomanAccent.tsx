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
