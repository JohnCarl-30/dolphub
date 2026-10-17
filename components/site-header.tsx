import Link from "next/link";
import { NavLink } from "./nav-link";

const NAV = [
  { href: "/", label: "Students" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteHeader() {
  return (
    <header>
      <div className="flex w-full items-center justify-between gap-4 px-margin py-4">
        <Link
          href="/"
          className="text-base font-medium tracking-tight outline-none transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-ink"
        >
          Dolphub
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-4 text-note sm:gap-5">
          {NAV.map((item) => (
            // On a phone the wordmark and the button cover both destinations.
            <NavLink
              key={item.href}
              href={item.href}
              className="hidden outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink sm:inline"
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            href="/dashboard"
            className="press inline-flex min-h-11 items-center whitespace-nowrap bg-ink px-4 text-note font-medium text-white outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ink"
          >
            Publish<span className="hidden sm:inline">&nbsp;your page</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
