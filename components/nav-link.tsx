"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

/** A header link that marks the page it points to. */
export function NavLink({ href, className, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  const pathname = usePathname();
  const current = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`${className ?? ""} ${current ? "text-ink" : "text-muted"}`}
      {...rest}
    />
  );
}
