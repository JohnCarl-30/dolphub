import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/privacy", label: "Privacy & Security" },
  { href: "/terms", label: "Terms" },
  { href: "/support", label: "Support" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto shrink-0 border-t border-ink/10 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 font-mono text-[11px] uppercase tracking-wide text-muted sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="space-y-2">
          <p>Dolphub · Built for PCU tech students</p>
          <p>© 2026 Dolphub contributors · MIT License</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2">
          {FOOTER_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
