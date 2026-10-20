"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { CourseFilter } from "./course-filter";
import { FirstCard, ProfileCard } from "./profile-card";
import { useShowcaseScroll } from "./animations/use-showcase-scroll";
import type { ShowcaseCard, ShowcaseCourse } from "@/lib/showcase-data";
import type { ShowcaseLayout } from "@/lib/showcase";

const VIEW_KEY = "dolphub-showcase-view";

export function StudentShowcase({ profiles, courses, courseId, counts, onCourseChange, homepage, network, ready, reducedMotion, hidden, onActive }: {
  profiles: ShowcaseCard[];
  courses: ShowcaseCourse[];
  courseId: string | null;
  counts: Record<string, number>;
  onCourseChange: (course: string | null) => void;
  homepage: RefObject<HTMLDivElement | null>;
  network: RefObject<HTMLDivElement | null>;
  ready: boolean;
  reducedMotion: boolean;
  hidden: boolean;
  onActive: (active: boolean) => void;
}) {
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const controls = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const [preference, setPreference] = useState<"pending" | "scroll" | "list">("pending");
  const [layout, setLayout] = useState<ShowcaseLayout>("list");

  useEffect(() => {
    let saved: "scroll" | "list" = "scroll";
    try { if (sessionStorage.getItem(VIEW_KEY) === "list") saved = "list"; } catch { /* In-memory preference still works. */ }
    // Read browser-only storage after the server and hydration render agree.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreference(saved);
  }, []);

  const { captureAnchor, requestReset, revealFocused } = useShowcaseScroll({
    homepage, network, section, frame, controls, viewport, track, progress, fill, profiles,
    motionAllowed: ready && !reducedMotion && preference !== "pending",
    listPreferred: preference === "list", hidden, onLayout: setLayout, onActive,
  });

  const toggle = () => {
    captureAnchor();
    const next = preference === "list" ? "scroll" : "list";
    setPreference(next);
    try { sessionStorage.setItem(VIEW_KEY, next); } catch { /* Keep the current in-memory choice. */ }
  };

  return (
    <section ref={section} aria-label="Student showcase" className="showcase mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div ref={frame} className="showcase-frame">
        <div ref={controls} className="showcase-controls">
          <CourseFilter courses={courses} value={courseId} counts={counts} onChange={(value) => { requestReset(); onCourseChange(value); }} />
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-wide">
            <p className="text-muted" aria-live="polite">
              {ready && reducedMotion ? "List view · reduced motion" : layout === "short" ? "List view · more room to read" : layout === "scroll" ? "Scroll down to explore →" : "Explore student projects"}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {ready && !reducedMotion && layout !== "short" ? (
                <button type="button" onPointerDown={captureAnchor} onClick={toggle} aria-pressed={preference === "list"} className="press min-h-11 underline underline-offset-4 hover:text-muted focus-visible:ring-2 focus-visible:ring-ink">
                  {preference === "list" ? "Use scroll view" : "Use list view"}
                </button>
              ) : null}
              <a href="#after-showcase" className="inline-flex min-h-11 items-center underline underline-offset-4 transition-colors hover:text-muted focus-visible:ring-2 focus-visible:ring-ink" onClick={(event) => {
                const target = document.getElementById("after-showcase");
                if (!target) return;
                event.preventDefault();
                target.focus({ preventScroll: true });
                target.scrollIntoView({ block: "start", behavior: "instant" });
              }}>Skip showcase ↓</a>
            </div>
          </div>
          <div ref={progress} className="showcase-progress" role="progressbar" aria-label="Student showcase progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
            <div ref={fill} className="h-full origin-left bg-ink" />
          </div>
        </div>
        <div ref={viewport} className="showcase-viewport">
          <ol ref={track} className="showcase-track" onFocusCapture={(event) => revealFocused(event.target)}>
            {profiles.length === 0 ? <li key={`${courseId}-empty`} className="rise"><FirstCard /></li> : profiles.map((profile, index) => (
              // Keyed by filter so a new result set rises in again, staggered.
              <li
                key={`${courseId}-${profile.handle}`}
                data-showcase-card={profile.handle}
                className="rise"
                style={{ "--i": Math.min(index, 8) } as React.CSSProperties}
              >
                <ProfileCard profile={profile} index={index + 1} preview />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
