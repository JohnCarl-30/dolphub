"use client";

import { StudentShowcase } from "@/components/student-showcase";
import { useMockStore } from "@/components/mock-store";
import { COURSES, listGridProfiles } from "@/lib/mock-profiles";
import { shouldPlayParticles } from "@/lib/particles";
import { useMotionEnvironment } from "@/components/animations/use-motion-environment";
import { ParticleBoundary } from "@/components/particles/particle-boundary";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useState } from "react";

const ParticleBackground = dynamic(
  () => import("@/components/particles/particle-background"),
  { ssr: false },
);
const STEPS = [
  {
    index: "01",
    title: "Sign in with a PCU address",
    copy: "The live site will limit accounts to tech programs. This mock skips that step.",
  },
  {
    index: "02",
    title: "Add at least one project",
    copy: "A page stays out of the showcase until it has a project with a title.",
  },
  {
    index: "03",
    title: "Share /u/your-handle",
    copy: "That is the one link for resumes, Messenger, and class chats.",
  },
];

export function HomePage() {
  const { profiles } = useMockStore();
  const [courseId, setCourseId] = useState<string | null>(null);
  const environment = useMotionEnvironment();
  const [showcaseActive, setShowcaseActive] = useState(false);
  const homepage = useRef<HTMLDivElement>(null);
  const network = useRef<HTMLDivElement>(null);
  const [particleFailed, setParticleFailed] = useState(false);
  const onParticleStatus = useCallback((status: "ready" | "failed") => {
    if (status === "failed") setParticleFailed(true);
  }, []);
  const onParticleError = useCallback(() => setParticleFailed(true), []);
  const showParticles = environment.ready && !environment.reducedMotion && !particleFailed;

  const visible = useMemo(
    () => listGridProfiles(profiles, courseId),
    [courseId, profiles],
  );
  const counts = useMemo(() => {
    const next: Record<string, number> = {};
    for (const course of COURSES) {
      next[course.id] = listGridProfiles(profiles, course.id).length;
    }
    return next;
  }, [profiles]);

  return (
    <div ref={homepage} className="homepage relative isolate">
        <div className="home-network-window pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
          <div ref={network} className="home-network">
            {showParticles ? (
              <ParticleBoundary onError={onParticleError}>
                <ParticleBackground
                  playing={shouldPlayParticles(environment, showcaseActive)}
                  finePointer={environment.finePointer}
                  onStatus={onParticleStatus}
                />
              </ParticleBoundary>
            ) : null}
          </div>
        </div>
        {/* The entrance is CSS so it runs off the main thread while the particle chunk loads. */}
        <section data-hero className="mx-auto w-full max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
          <p className="rise font-mono text-[11px] uppercase tracking-wide text-muted">
            /students
          </p>
          <h1
            className="rise mt-3 max-w-3xl text-5xl font-medium tracking-tight sm:text-7xl"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            PCU tech pages, one link each.
          </h1>
          <p
            className="rise mt-6 max-w-xl text-base leading-7 text-muted"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            Dolphub is a public portfolio for IT, CS, and Computer Engineering
            students. Explore people who have published at least one
            project.
          </p>
        </section>

        <StudentShowcase
          profiles={visible} courseId={courseId} counts={counts} onCourseChange={setCourseId}
          homepage={homepage} network={network} ready={environment.ready}
          reducedMotion={environment.reducedMotion} hidden={environment.hidden}
          onActive={setShowcaseActive}
        />

        <section
          id="after-showcase"
          tabIndex={-1}
          aria-label="Publishing steps"
          className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6"
        >
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
            /publish
          </p>
          <h2 className="mt-3 text-3xl font-medium tracking-tight">
            How a page gets published
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.index} className="border border-ink/10 px-4 py-5">
                <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
                  {step.index}
                </p>
                <h3 className="mt-3 text-xl font-medium tracking-tight">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{step.copy}</p>
              </li>
            ))}
          </ol>
        </section>
    </div>
  );
}
