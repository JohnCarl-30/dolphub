"use client";

import { useEffect, type RefObject } from "react";

/** Marks [data-reveal] and [data-drift] descendants once they scroll into view. */
export function useReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const targets = element.querySelectorAll<HTMLElement>("[data-reveal], [data-drift]");
    if (targets.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 },
    );
    for (const target of targets) observer.observe(target);
    element.setAttribute("data-reveal-ready", "");
    return () => {
      observer.disconnect();
      element.removeAttribute("data-reveal-ready");
    };
  }, [root]);
}
