import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { unstable_rethrow } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthenticatedSiteMenu } from "./authenticated-site-menu";
import { NavLink } from "./nav-link";
import { SiteMenu } from "./site-menu";
import { PUBLIC_NAV_LINKS } from "./site-navigation";
import { logError } from "@/lib/log";

export function SiteHeader() {
  return (
    <Suspense fallback={<SiteHeaderContent homeHref="/" />}>
      <AuthenticatedSiteHeader />
    </Suspense>
  );
}

async function AuthenticatedSiteHeader() {
  let signedIn: boolean;
  try {
    signedIn = Boolean(await getCurrentUser());
  } catch (error) {
    unstable_rethrow(error);
    logError("Load header session", error);
    return <SiteHeaderContent homeHref="/" signedIn={false} />;
  }
  return <SiteHeaderContent homeHref={signedIn ? "/home" : "/"} signedIn={signedIn} />;
}

function SiteHeaderContent({ homeHref, signedIn }: { homeHref: "/" | "/home"; signedIn?: boolean }) {
  return (
    <header className="glass-chrome sticky top-0 z-40">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:grid-cols-[1fr_auto_1fr]">
        <Link
          href={homeHref}
          className="flex shrink-0 items-center gap-2 font-mono text-xs tracking-wide uppercase outline-none transition-colors hover:text-muted focus-visible:ring-2 focus-visible:ring-ink lg:justify-self-start"
        >
          <Image src="/dolphub-logo.svg" width={48} height={26} alt="" className="h-[26px] w-12 object-contain" />
          Dolphub
        </Link>
        <nav aria-label={signedIn ? "Account" : "Primary"} className="hidden shrink-0 items-center justify-self-center gap-x-5 whitespace-nowrap lg:flex">
          {signedIn ? (
            <>
              <NavLink href={homeHref} className="font-mono text-[11px] uppercase tracking-wide outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink">Home</NavLink>
              <NavLink href="/dashboard" className="font-mono text-[11px] uppercase tracking-wide outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink">Dashboard</NavLink>
              <NavLink href="/profile" className="font-mono text-[11px] uppercase tracking-wide outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink">Profile</NavLink>
            </>
          ) : PUBLIC_NAV_LINKS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className="font-mono text-[11px] uppercase tracking-wide outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center justify-self-end gap-2">
          {!signedIn ? (
            <div className="hidden items-center gap-2 sm:flex">
              <NavLink
                href="/login"
                className="press inline-flex min-h-9 items-center rounded-full border border-ink/15 bg-white/55 px-4 font-mono text-[11px] uppercase tracking-wide text-ink outline-none transition-colors hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-ink"
              >
                Log in
              </NavLink>
              <NavLink
                href="/login"
                className="press inline-flex min-h-9 items-center rounded-full border border-ink bg-ink px-4 font-mono text-[11px] uppercase tracking-wide text-white outline-none transition-colors hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-ink"
              >
                Sign up
              </NavLink>
            </div>
          ) : null}
          <Suspense fallback={<SiteMenu />}>
            <AuthenticatedSiteMenu homeHref={homeHref} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
