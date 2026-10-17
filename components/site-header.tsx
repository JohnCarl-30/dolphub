import Link from "next/link";

const NAV = [
  { href: "/", index: "00", label: "Students" },
  { href: "/dashboard", index: "01", label: "Dashboard" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-ink/10">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="font-mono text-xs tracking-wide uppercase outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          ● Dolphub
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono text-[11px] uppercase tracking-wide text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ink"
            >
              [ {item.index} ] {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
