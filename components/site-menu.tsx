"use client";

import { useEffect, useId, useRef, useState } from "react";
import { signOutAction } from "@/app/auth/actions";
import { ProfileAvatar } from "./profile-avatar";
import { NavLink } from "./nav-link";

const MENU_LINKS = [
  { href: "/profile", index: "02", label: "Profile" },
  { href: "/privacy", index: "03", label: "Privacy & Security" },
  { href: "/terms", index: "04", label: "Terms" },
  { href: "/support", index: "05", label: "Support" },
];

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
  const mobileHeaderLinks = [
    { href: homeHref, index: "00", label: "Home" },
    { href: "/dashboard", index: "01", label: "Dashboard" },
  ];

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
        className="press flex size-10 items-center justify-center border border-ink/10 bg-background outline-none transition-colors hover:bg-paper focus-visible:ring-2 focus-visible:ring-ink"
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
          className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(18rem,calc(100vw-2rem))] border border-ink/10 bg-background shadow-[0_16px_40px_rgb(14_16_18_/_0.14)]"
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
          <div className="border-b border-ink/10 sm:hidden">
            {mobileHeaderLinks.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                [ {item.index} ] {item.label}
              </NavLink>
            ))}
          </div>
          <div>
            {MENU_LINKS.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                [ {item.index} ] {item.label}
              </NavLink>
            ))}
          </div>
          {account ? (
            <form action={signOutAction} className="border-t border-ink/10">
              <button type="submit" className={`${linkClass} w-full text-left`}>
                [ 06 ] Log out
              </button>
            </form>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
