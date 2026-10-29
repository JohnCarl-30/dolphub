"use client";

import { useEffect } from "react";
import { NavLink } from "@/components/nav-link";

const WARNING = "You have unsaved changes. Leave this page?";
const tabClass = "border-b-2 px-1 py-3 font-mono text-[11px] uppercase tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-ink";

export function useBeforeUnloadWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
}

export function ProfileTabs({ active, dirty }: { active: "details" | "projects"; dirty: boolean }) {
  const guard = (event: { preventDefault: () => void }) => {
    if (dirty && !window.confirm(WARNING)) event.preventDefault();
  };

  return (
    <nav aria-label="Profile editor" className="mt-5 flex gap-5 border-b border-ink/10">
      <NavLink href="/profile" exact onNavigate={active === "details" ? undefined : guard} className={`${tabClass} ${active === "details" ? "border-ink" : "border-transparent"}`}>
        Details
      </NavLink>
      <NavLink href="/profile/projects" exact onNavigate={active === "projects" ? undefined : guard} className={`${tabClass} ${active === "projects" ? "border-ink" : "border-transparent"}`}>
        Projects
      </NavLink>
    </nav>
  );
}
