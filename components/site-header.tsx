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
  const homeHref = (await getCurrentUser()) ? "/home" : "/";
  return <SiteHeaderContent homeHref={homeHref} />;
}

function SiteHeaderContent({ homeHref }: { homeHref: "/" | "/home" }) {
  const nav = [
    { href: homeHref, index: "00", label: "Home" },
    { href: "/dashboard", index: "01", label: "Dashboard" },
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
        <div className="flex items-center gap-4">
          <nav aria-label="Primary" className="hidden items-center gap-x-4 sm:flex">
            {nav.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                className="font-mono text-[11px] uppercase tracking-wide outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink"
              >
                [ {item.index} ] {item.label}
              </NavLink>
            ))}
          </nav>
          <Suspense fallback={<SiteMenu />}>
            <AuthenticatedSiteMenu homeHref={homeHref} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
