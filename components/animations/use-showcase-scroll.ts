"use client";

import { useEffect, useEffectEvent, useRef, type RefObject } from "react";
import {
  cardScrollPosition,
  showcaseParticleOffset,
  showcaseGeometry,
  showcaseLayout,
  showcasePosition,
  type ShowcaseLayout,
} from "@/lib/showcase";
import type { ShowcaseCard } from "@/lib/showcase-data";

export type ShowcaseAnchor = { handle: string };

export function useShowcaseScroll({
  homepage,
  network,
  section,
  frame,
  controls,
  viewport,
  track,
  progress,
  fill,
  profiles,
  motionAllowed,
  listPreferred,
  hidden,
  onLayout,
  onActive,
}: {
  homepage: RefObject<HTMLDivElement | null>;
  network: RefObject<HTMLDivElement | null>;
  section: RefObject<HTMLElement | null>;
  frame: RefObject<HTMLDivElement | null>;
  controls: RefObject<HTMLDivElement | null>;
  viewport: RefObject<HTMLDivElement | null>;
  track: RefObject<HTMLOListElement | null>;
  progress: RefObject<HTMLDivElement | null>;
  fill: RefObject<HTMLDivElement | null>;
  profiles: ShowcaseCard[];
  motionAllowed: boolean;
  listPreferred: boolean;
  hidden: boolean;
  onLayout: (layout: ShowcaseLayout) => void;
  onActive: (active: boolean) => void;
}) {
  const anchor = useRef<ShowcaseAnchor | null>(null);
  const reset = useRef(false);
  const reveal = useRef<(element: HTMLElement) => void>(() => {});
  const notifyLayout = useEffectEvent(onLayout);
  const notifyActive = useEffectEvent(onActive);

  useEffect(() => {
    const home = homepage.current;
    const layer = network.current;
    const wrapper = section.current;
    const sticky = frame.current;
    const toolbar = controls.current;
    const windowElement = viewport.current;
    const cards = track.current;
    const meter = progress.current;
    const bar = fill.current;
    if (!home || !layer || !wrapper || !sticky || !toolbar || !windowElement || !cards || !meter || !bar) return;

    let layout: ShowcaseLayout = "list";
    let start = 0;
    let travel = 0;
    let viewportWidth = 0;
    let screenWidth = 0;
    let offset = 0;
    let active = false;
    let measureNeeded = true;
    let animationFrame = 0;
    let disposed = false;
    let lastPercent = -1;
    let cardBounds: { element: HTMLElement; left: number; width: number }[] = [];

    const paint = (scrollY = window.scrollY) => {
      const position = showcasePosition(scrollY, start, layout === "scroll" ? travel : 0);
      offset = -position.x;
      cards.style.transform = layout === "scroll" ? `translate3d(${position.x}px, 0, 0)` : "";
      bar.style.transform = `scaleX(${position.eased})`;
      const percent = Math.round(position.eased * 100);
      if (percent !== lastPercent) {
        meter.setAttribute("aria-valuenow", String(percent));
        lastPercent = percent;
      }
      if (position.active !== active) {
        active = position.active;
        notifyActive(active);
      }
      const networkX = motionAllowed && !hidden ? showcaseParticleOffset(position.progress, screenWidth) : 0;
      layer.style.setProperty("--particle-showcase-x", `${networkX}px`);
    };

    const revealCard = (element: HTMLElement) => {
      if (layout !== "scroll") return;
      const card = cardBounds.find((entry) => entry.element.contains(element));
      if (!card) return;
      const top = cardScrollPosition({ ...card, viewportWidth, currentOffset: offset, travel, start });
      // Focus/skip corrections must be immediate, even with scroll-linked easing.
      window.scrollTo({ top, behavior: "instant" });
      paint();
    };
    reveal.current = revealCard;

    const measure = () => {
      const wasInSection = wrapper.getBoundingClientRect().top < window.innerHeight && wrapper.getBoundingClientRect().bottom > 0;
      // Keep the document tall while probing the horizontal layout. Temporarily
      // collapsing a pinned wrapper can clamp scrollY near the end of the page.
      wrapper.style.height = `${wrapper.offsetHeight}px`;
      wrapper.dataset.layout = motionAllowed && !listPreferred ? "measuring" : "list";
      cards.style.transform = "";
      const styles = getComputedStyle(sticky);
      const padding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
      const gap = parseFloat(styles.rowGap) || 0;
      const frameHeight = sticky.clientHeight;
      viewportWidth = windowElement.clientWidth;
      screenWidth = window.innerWidth;
      const geometry = showcaseGeometry(cards.scrollWidth, viewportWidth, frameHeight);
      layout = showcaseLayout({
        motionAllowed,
        listPreferred,
        frameHeight,
        requiredHeight: toolbar.offsetHeight + cards.offsetHeight + padding + gap,
        travel: geometry.travel,
      });
      wrapper.dataset.layout = layout;
      wrapper.style.height = layout === "scroll" ? `${geometry.height}px` : "";
      travel = geometry.travel;
      start = wrapper.getBoundingClientRect().top + window.scrollY;
      cardBounds = Array.from(cards.querySelectorAll<HTMLElement>("[data-showcase-card]")).map((element) => ({
        element,
        left: element.offsetLeft,
        width: element.offsetWidth,
      }));
      notifyLayout(layout);
      if (reset.current) {
        reset.current = false;
        if (wasInSection && layout === "scroll") window.scrollTo({ top: start, behavior: "instant" });
      }
      paint();
      const pending = anchor.current;
      anchor.current = null;
      if (pending) {
        const card = cardBounds.find(({ element }) => element.dataset.showcaseCard === pending.handle);
        const link = card?.element.querySelector<HTMLAnchorElement>("a");
        if (card && link) {
          link.focus({ preventScroll: true });
          if (layout === "scroll") revealCard(link);
          else card.element.scrollIntoView({ block: "center", behavior: "instant" });
        }
      } else if (document.activeElement instanceof HTMLElement && cards.contains(document.activeElement)) {
        revealCard(document.activeElement);
      }
    };

    const schedule = () => {
      if (animationFrame || disposed || hidden) return;
      animationFrame = requestAnimationFrame(() => {
        animationFrame = 0;
        if (measureNeeded) {
          measureNeeded = false;
          measure();
        } else paint();
      });
    };
    const resize = () => {
      measureNeeded = true;
      schedule();
    };
    const observer = new ResizeObserver(resize);
    for (const element of [home, sticky, toolbar, windowElement, cards]) observer.observe(element);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    document.fonts.addEventListener("loadingdone", resize);
    void document.fonts.ready.then(() => { if (!disposed) resize(); });
    schedule();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      document.fonts.removeEventListener("loadingdone", resize);
      reveal.current = () => {};
      layer.style.removeProperty("--particle-showcase-x");
      notifyActive(false);
    };
  }, [homepage, network, section, frame, controls, viewport, track, progress, fill, profiles, motionAllowed, listPreferred, hidden]);

  const captureAnchor = () => {
    if (anchor.current) return;
    const wrapper = section.current;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    if (rect.top >= window.innerHeight || rect.bottom <= 0) return;
    const cards = Array.from(wrapper.querySelectorAll<HTMLElement>("[data-showcase-card]"));
    const focused = cards.find((card) => card.contains(document.activeElement));
    const visible = cards.map((card) => {
      const bounds = card.getBoundingClientRect();
      const width = Math.max(0, Math.min(bounds.right, rect.right - 16) - Math.max(bounds.left, rect.left + 16));
      const height = Math.max(0, Math.min(bounds.bottom, window.innerHeight) - Math.max(bounds.top, 0));
      return { card, area: width * height };
    }).sort((a, b) => b.area - a.area)[0]?.card;
    const handle = (focused ?? visible)?.dataset.showcaseCard;
    if (handle) anchor.current = { handle };
  };

  return {
    captureAnchor,
    requestReset: () => { reset.current = true; },
    revealFocused: (element: HTMLElement) => reveal.current(element),
  };
}
