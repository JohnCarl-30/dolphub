"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function LandingPageJourney({ children }: { children: ReactNode }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
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
    let scheduled = 0;
    let measuring = 0;
    let disposed = false;
    let panels: { element: HTMLElement; left: number }[] = [];

    // --panel-shift runs from -1 (gone left) through 0 (centred) to 1 (waiting right); CSS turns it into drift and fade.
    const paintPanels = (x: number) => {
      const width = windowElement.clientWidth;
      const animate = !reducedMotion.matches && section.dataset.layout !== "measuring" && width > 0;
      for (const { element, left } of panels) {
        if (!animate) {
          element.style.removeProperty("--panel-shift");
          element.style.removeProperty("--panel-distance");
          continue;
        }
        const shift = Math.max(-1, Math.min(1, (left - x) / width));
        element.style.setProperty("--panel-shift", shift.toFixed(3));
        element.style.setProperty("--panel-distance", Math.abs(shift).toFixed(3));
      }
    };

    const paint = () => {
      scheduled = 0;
      if (disposed) return;
      const p = maxX > 0 ? Math.max(0, Math.min(maxX, window.scrollY - start)) : 0;
      const percent = maxX > 0 ? Math.round((p / maxX) * 100) : 0;
      const scrollDriven = desktop.matches && !reducedMotion.matches && maxX > 0;
      cards.style.transform = scrollDriven ? `translate3d(${-p}px, 0, 0)` : "";
      bar.style.transform = `scaleX(${percent / 100})`;
      meter.setAttribute("aria-valuenow", String(percent));
      paintPanels(scrollDriven ? p : windowElement.scrollLeft);
    };

    const schedulePaint = () => {
      if (!scheduled) scheduled = requestAnimationFrame(paint);
    };

    const measure = () => {
      measuring = 0;
      if (disposed) return;
      const enhanced = desktop.matches;
      const motionScroll = enhanced && !reducedMotion.matches;
      const header = document.querySelector("header");
      const headerHeight = header?.getBoundingClientRect().height ?? 0;
      cards.style.transform = "";
      section.dataset.layout = enhanced ? "measuring" : "native";
      section.style.height = "";
      sticky.style.setProperty("--landing-header-height", `${headerHeight}px`);
      maxX = enhanced ? Math.max(0, cards.scrollWidth - windowElement.clientWidth) : 0;
      const frameHeight = sticky.clientHeight;
      const hold = Math.round(window.innerHeight * 0.15);
      if (motionScroll && maxX > 0) {
        section.dataset.layout = "scroll";
        section.style.height = `${frameHeight + maxX + hold}px`;
      } else if (enhanced) {
        section.dataset.layout = "native";
      }
      start = section.getBoundingClientRect().top + window.scrollY;
      // Where each panel sits in the untransformed track, measured from the window's left edge.
      const origin = windowElement.getBoundingClientRect().left - windowElement.scrollLeft;
      panels = Array.from(cards.querySelectorAll<HTMLElement>("[data-landing-panel]"), (element) => ({
        element,
        left: element.getBoundingClientRect().left - origin,
      }));
      schedulePaint();
    };

    const scheduleMeasure = () => {
      if (!measuring) measuring = requestAnimationFrame(measure);
    };

    const revealFocused = (event: FocusEvent) => {
      if (section.dataset.layout !== "scroll" || !(event.target instanceof HTMLElement)) return;
      const panel = event.target.closest<HTMLElement>("[data-landing-panel]");
      if (!panel) return;
      const target = start + Math.max(0, Math.min(maxX, panel.offsetLeft));
      window.scrollTo({ top: target, behavior: "auto" });
      schedulePaint();
    };

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    for (const element of [section, sticky, windowElement, cards]) resizeObserver.observe(element);
    window.addEventListener("scroll", schedulePaint, { passive: true });
    windowElement.addEventListener("scroll", schedulePaint, { passive: true });
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
      windowElement.removeEventListener("scroll", schedulePaint);
      window.removeEventListener("resize", scheduleMeasure);
      desktop.removeEventListener("change", scheduleMeasure);
      reducedMotion.removeEventListener("change", scheduleMeasure);
      cards.removeEventListener("focusin", revealFocused);
      document.fonts.removeEventListener("loadingdone", scheduleMeasure);
      section.style.height = "";
      sticky.style.removeProperty("--landing-header-height");
      cards.style.transform = "";
      for (const { element } of panels) {
        element.style.removeProperty("--panel-shift");
        element.style.removeProperty("--panel-distance");
      }
    };
  }, []);

  return (
    <div ref={wrapper} className="landing-journey border-y border-ink/10 bg-paper">
      <div ref={frame} className="landing-journey-frame">
        <div ref={progress} className="landing-journey-progress" role="progressbar" aria-label="Landing page progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
          <div ref={fill} className="h-full origin-left bg-ink" />
        </div>
        <div ref={viewport} className="landing-journey-viewport">
          <div ref={track} className="landing-journey-track">{children}</div>
        </div>
      </div>
    </div>
  );
}
