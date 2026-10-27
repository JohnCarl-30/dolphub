"use client";

import { useEffect, useRef } from "react";

export type LandingInformationPage = {
  href: string;
  label: string;
  text: string;
};

export function LandingInformationRail({ pages }: { pages: LandingInformationPage[] }) {
  const wrapper = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = wrapper.current;
    const sticky = frame.current;
    const windowElement = viewport.current;
    const cards = track.current;
    const meter = progress.current;
    const bar = fill.current;
    if (!section || !sticky || !windowElement || !cards || !meter || !bar) return;

    const desktop = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let start = 0;
    let maxX = 0;
    let frameHeight = 0;
    let hold = 0;
    let scheduled = 0;
    let measuring = 0;
    let disposed = false;

    const paint = () => {
      scheduled = 0;
      if (disposed) return;
      const travel = maxX;
      const p = travel > 0 ? Math.max(0, Math.min(travel, window.scrollY - start)) : 0;
      const percent = travel > 0 ? Math.round((p / travel) * 100) : 0;
      cards.style.transform = desktop.matches && !reducedMotion.matches && travel > 0
        ? `translate3d(${-p}px, 0, 0)`
        : "";
      bar.style.transform = `scaleX(${percent / 100})`;
      meter.setAttribute("aria-valuenow", String(percent));
    };

    const schedulePaint = () => {
      if (!scheduled) scheduled = requestAnimationFrame(paint);
    };

    const measure = () => {
      measuring = 0;
      if (disposed) return;
      const enhanced = desktop.matches && !reducedMotion.matches;
      cards.style.transform = "";
      section.dataset.layout = enhanced ? "measuring" : "native";
      section.style.height = "";
      maxX = enhanced ? Math.max(0, cards.scrollWidth - windowElement.clientWidth) : 0;
      frameHeight = sticky.clientHeight;
      hold = Math.round(window.innerHeight * 0.15);
      if (enhanced && maxX > 0) {
        section.dataset.layout = "scroll";
        section.style.height = `${frameHeight + maxX + hold}px`;
      } else if (enhanced) {
        section.dataset.layout = "fits";
      }
      start = section.getBoundingClientRect().top + window.scrollY;
      schedulePaint();
    };

    const scheduleMeasure = () => {
      if (!measuring) measuring = requestAnimationFrame(measure);
    };

    const revealFocused = (event: FocusEvent) => {
      if (section.dataset.layout !== "scroll" || !(event.target instanceof HTMLElement)) return;
      const card = event.target.closest<HTMLElement>("[data-information-card]");
      if (!card) return;
      const target = start + Math.max(0, Math.min(maxX, card.offsetLeft - 16));
      window.scrollTo({ top: target, behavior: "auto" });
      schedulePaint();
    };

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    for (const element of [section, sticky, windowElement, cards]) resizeObserver.observe(element);
    window.addEventListener("scroll", schedulePaint, { passive: true });
    window.addEventListener("resize", scheduleMeasure);
    desktop.addEventListener("change", scheduleMeasure);
    reducedMotion.addEventListener("change", scheduleMeasure);
    cards.addEventListener("focusin", revealFocused);
    document.fonts.addEventListener("loadingdone", scheduleMeasure);
    void document.fonts.ready.then(scheduleMeasure);
    scheduleMeasure();

    return () => {
      disposed = true;
      if (scheduled) cancelAnimationFrame(scheduled);
      if (measuring) cancelAnimationFrame(measuring);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", schedulePaint);
      window.removeEventListener("resize", scheduleMeasure);
      desktop.removeEventListener("change", scheduleMeasure);
      reducedMotion.removeEventListener("change", scheduleMeasure);
      cards.removeEventListener("focusin", revealFocused);
      document.fonts.removeEventListener("loadingdone", scheduleMeasure);
      section.style.height = "";
      cards.style.transform = "";
    };
  }, []);

  return (
    <section ref={wrapper} aria-label="About Dolphub" className="information-rail border-y border-ink/10 bg-paper">
      <div ref={frame} className="information-rail-frame mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/explore</p>
          <a href="#featured-projects" className="font-mono text-[11px] uppercase tracking-wide underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ink">
            Skip to projects ↓
          </a>
        </div>
        <div ref={progress} className="information-rail-progress" role="progressbar" aria-label="Information pages progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
          <div ref={fill} className="h-full origin-left bg-ink" />
        </div>
        <div ref={viewport} className="information-rail-viewport">
          <ol ref={track} className="information-rail-track">
            {pages.map((page, index) => (
              <li key={page.href} data-information-card className="viewport-reveal" style={{ "--i": index } as React.CSSProperties}>
                <a href={page.href} className="press flex h-full flex-col border border-ink/10 bg-background p-6 outline-none transition-colors hover:border-ink focus-visible:ring-2 focus-visible:ring-ink">
                  <p className="font-mono text-[11px] uppercase tracking-wide text-muted">{String(index + 1).padStart(2, "0")} · /{page.label.toLowerCase().replaceAll(" & ", "-").replaceAll(" ", "-")}</p>
                  <h2 className="mt-6 text-3xl font-medium tracking-tight">{page.label}</h2>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-muted">{page.text}</p>
                  <span className="mt-auto pt-8 font-mono text-[11px] uppercase tracking-wide text-muted">Read more →</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
