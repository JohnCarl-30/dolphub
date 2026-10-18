import Link from "next/link";
import Image from "next/image";
import { NavLink } from "./nav-link";
import { SiteMenu } from "./site-menu";

const NAV = [
  { href: "/", index: "00", label: "Home" },
  { href: "/dashboard", index: "01", label: "Dashboard" },
  { href: "/profile", index: "02", label: "Profile" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-ink/10">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-mono text-xs tracking-wide uppercase outline-none transition-colors hover:text-muted focus-visible:ring-2 focus-visible:ring-ink"
        >
          <Image src="/dolphub-logo.svg" width={48} height={26} alt="" className="h-[26px] w-12 object-contain" />
          Dolphub
        </Link>
        <div className="flex items-center gap-4">
          <nav aria-label="Primary" className="hidden items-center gap-x-4 sm:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                className="font-mono text-[11px] uppercase tracking-wide outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink"
              >
                [ {item.index} ] {item.label}
              </NavLink>
            ))}
          </nav>
          <SiteMenu />
        </div>
      </div>
    </header>
  );
}
