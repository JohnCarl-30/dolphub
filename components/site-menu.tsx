"use client";

import { useEffect, useId, useRef, useState } from "react";
import { signOutAction } from "@/app/auth/actions";
import { ProfileAvatar } from "./profile-avatar";
import { NavLink } from "./nav-link";
import { PUBLIC_NAV_LINKS } from "./site-navigation";

const linkClass =
  "block border-b border-ink/10 px-4 py-3 font-mono text-[11px] uppercase tracking-wide outline-none transition-colors last:border-b-0 hover:bg-paper hover:text-ink focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink";

export function SiteMenu({
  account,
  homeHref = "/",
}: {
  account?: { name: string; handle: string | null; profilePictureUrl: string | null };
  homeHref?: "/" | "/home";
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const signedIn = Boolean(account);
  const accountLinks = signedIn
    ? [{ href: homeHref, label: "Home" }, { href: "/dashboard", label: "Dashboard" }, { href: "/profile", label: "Profile" }]
    : [];

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={container} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        className="press flex size-10 items-center justify-center rounded-full border border-ink/10 bg-white/55 outline-none transition-colors hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-ink"
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {open ? (
        <nav
          id={panelId}
          aria-label="Site menu"
          className="glass-popover absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(18rem,calc(100vw-2rem))] border border-white/50 shadow-[0_16px_40px_rgb(14_16_18_/_0.14)]"
        >
          {account ? (
            <div className="flex items-center gap-3 border-b border-ink/10 p-4">
              <ProfileAvatar name={account.name} src={account.profilePictureUrl} className="size-10 shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{account.name}</p>
                <p className="truncate font-mono text-[10px] uppercase tracking-wide text-muted">
                  {account.handle ? `/u/${account.handle}` : "Signed in"}
                </p>
              </div>
            </div>
          ) : null}
          <div>
            {PUBLIC_NAV_LINKS.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            {accountLinks.length > 0 ? (
              <div className="lg:hidden">
                {accountLinks.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    className={linkClass}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
          {!signedIn ? (
            <div className="flex gap-2 border-t border-ink/10 p-3 sm:hidden">
              <NavLink href="/login" className="press inline-flex min-h-10 flex-1 items-center justify-center rounded-full border border-ink/15 bg-white/55 px-3 font-mono text-[11px] uppercase tracking-wide outline-none transition-colors hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-ink" onClick={() => setOpen(false)}>Log in</NavLink>
              <NavLink href="/login" className="press inline-flex min-h-10 flex-1 items-center justify-center rounded-full border border-ink bg-ink px-3 font-mono text-[11px] uppercase tracking-wide text-white outline-none transition-colors hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-ink" onClick={() => setOpen(false)}>Sign up</NavLink>
            </div>
          ) : null}
          {account ? (
            <form action={signOutAction} className="border-t border-ink/10">
              <button type="submit" className={`${linkClass} w-full text-left`}>
                Log out
              </button>
            </form>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
