import Link from "next/link";

const SECTIONS = [
  { href: "/admin", label: "Overview", index: "A1" },
  { href: "/admin/opportunities", label: "Opportunities", index: "A2" },
] as const;

/**
 * The slash label, heading and section links at the top of every admin page.
 * `current` is passed in rather than read from the address, so the page needs
 * no client code here.
 */
export function AdminHeading({
  label,
  title,
  current,
  children,
}: {
  label: string;
  title: string;
  current: (typeof SECTIONS)[number]["href"] | null;
  children?: React.ReactNode;
}) {
  return (
    <header>
      <nav aria-label="Admin sections">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-wide">
          {SECTIONS.map((section) => (
            <li key={section.href}>
              <Link
                href={section.href}
                aria-current={current === section.href ? "page" : undefined}
                className="text-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink aria-[current=page]:text-ink"
              >
                [ {section.index} ] {section.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p className="rise mt-8 font-mono text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <h1 className="rise mt-3 text-4xl font-medium tracking-tight sm:text-5xl" style={{ "--i": 1 } as React.CSSProperties}>
        {title}
      </h1>
      {children ? (
        <div className="rise mt-3 max-w-xl text-sm leading-6 text-muted" style={{ "--i": 2 } as React.CSSProperties}>
          {children}
        </div>
      ) : null}
    </header>
  );
}
