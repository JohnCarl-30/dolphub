"use client";

import { useEffect, useId, useRef, useState } from "react";
import { NavLink } from "./nav-link";

const PRIMARY_LINKS = [
  { href: "/", index: "00", label: "Home" },
  { href: "/dashboard", index: "01", label: "Profile" },
];

const INFO_LINKS = [
  { href: "/privacy", index: "02", label: "Privacy & Security" },
  { href: "/terms", index: "03", label: "Terms" },
  { href: "/support", index: "04", label: "Support" },
];

const linkClass =
  "block border-b border-ink/10 px-4 py-3 font-mono text-[11px] uppercase tracking-wide outline-none transition-colors last:border-b-0 hover:bg-paper hover:text-ink focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink";

export function SiteMenu() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

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
          <div className="border-b border-ink/10 sm:hidden">
            {PRIMARY_LINKS.map((item) => (
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
            {INFO_LINKS.map((item) => (
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
        </nav>
      ) : null}
    </div>
  );
}
