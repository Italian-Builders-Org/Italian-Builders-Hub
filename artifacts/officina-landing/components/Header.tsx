const NAV = [
  { href: "/#perche", label: "Perché" },
  { href: "/#community", label: "Community" },
  { href: "/#open-source", label: "Open source" },
  { href: "/#principi", label: "Principi" },
];

const COMMUNITY_URL = "https://x.com/italianbldrs";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 md:px-8">
        <a href="/" aria-label="Italian Builders, torna alla home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Italian Builders" className="h-7 w-auto" />
        </a>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Sezioni della pagina">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[15px] font-semibold text-ink transition-colors hover:text-rosso"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href={COMMUNITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-ink px-4 py-2.5 text-[15px] font-semibold text-paper transition-transform hover:-translate-y-px active:scale-[0.98]"
        >
          Entra via X
        </a>
      </div>
    </header>
  );
}
