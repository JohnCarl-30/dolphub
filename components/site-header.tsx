import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { AuthenticatedSiteMenu } from "./authenticated-site-menu";
import { NavLink } from "./nav-link";
import { SiteMenu } from "./site-menu";

export function SiteHeader() {
  return (
    <Suspense fallback={<SiteHeaderContent homeHref="/" />}>
      <AuthenticatedSiteHeader />
    </Suspense>
  );
}

async function AuthenticatedSiteHeader() {
  const signedIn = Boolean(await getCurrentUser());
  return <SiteHeaderContent homeHref={signedIn ? "/home" : "/"} signedIn={signedIn} />;
}

function SiteHeaderContent({ homeHref, signedIn }: { homeHref: "/" | "/home"; signedIn?: boolean }) {
  const nav = [
    { href: "/what", label: "What" },
    { href: "/about", label: "About" },
    { href: "/vision", label: "Vision" },
    ...(signedIn
      ? [{ href: homeHref, label: "Home" }, { href: "/dashboard", label: "Dashboard" }]
      : [{ href: "/login", label: "Log in / Sign up" }]),
  ];

  return (
    <header className="border-b border-ink/10">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href={homeHref}
          className="flex shrink-0 items-center gap-2 font-mono text-xs tracking-wide uppercase outline-none transition-colors hover:text-muted focus-visible:ring-2 focus-visible:ring-ink"
        >
          <Image src="/dolphub-logo.svg" width={48} height={26} alt="" className="h-[26px] w-12 object-contain" />
          Dolphub
        </Link>
        <div className="flex items-center gap-3">
          <nav aria-label="Primary" className="hidden items-center gap-x-3 lg:flex">
            {nav.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                className="font-mono text-[11px] uppercase tracking-wide outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink"
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Suspense fallback={<SiteMenu />}>
            <AuthenticatedSiteMenu homeHref={homeHref} />
          </Suspense>
        </div>
      </div>
      <nav aria-label="Legal" className="border-t border-ink/10 px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-muted sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-x-4 gap-y-1">
          <NavLink href="/privacy" className="outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink">Privacy &amp; Security</NavLink>
          <NavLink href="/terms" className="outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink">Terms</NavLink>
          <NavLink href="/support" className="outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink">Support</NavLink>
        </div>
      </nav>
    </header>
  );
}
