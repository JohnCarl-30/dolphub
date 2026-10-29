"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

/** A header link that marks the page it points to. */
export function NavLink({ href, className, exact = false, ...rest }: ComponentProps<typeof Link> & { href: string; exact?: boolean }) {
  const pathname = usePathname();
  const current = href === "/" || exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`${className ?? ""} ${current ? "text-ink" : "text-muted"}`}
      {...rest}
    />
  );
}
