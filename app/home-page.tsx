"use client";

import { CourseFilter } from "@/components/course-filter";
import { FirstCard, ProfileCard } from "@/components/profile-card";
import { useMockStore } from "@/components/mock-store";
import { COURSES, listGridProfiles } from "@/lib/mock-profiles";
import { shouldPlayParticles } from "@/lib/particles";
import { useMotionEnvironment } from "@/components/animations/use-motion-environment";
import { ParticleBoundary } from "@/components/particles/particle-boundary";
import dynamic from "next/dynamic";
import { motion, MotionConfig } from "motion/react";
import { useCallback, useMemo, useState } from "react";

const ParticleBackground = dynamic(
  () => import("@/components/particles/particle-background"),
  { ssr: false },
);
const HERO_ENTRANCE = { opacity: [0, 1], y: [16, 0] };
const HERO_STATIC = { opacity: 1, y: 0 };

const STEPS = [
  {
    index: "01",
    title: "Sign in with a PCU address",
    copy: "The live site will limit accounts to tech programs. This mock skips that step.",
  },
  {
    index: "02",
    title: "Add at least one project",
    copy: "A page stays off the grid until it has a project with a title.",
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
  const [paused, setPaused] = useState(false);
  const [particleStatus, setParticleStatus] = useState<"loading" | "ready" | "failed">("loading");
  const onParticleStatus = useCallback((status: "ready" | "failed") => setParticleStatus(status), []);
  const onParticleError = useCallback(() => setParticleStatus("failed"), []);
  const showParticles = environment.ready && !environment.reducedMotion && particleStatus !== "failed";

  const published = useMemo(() => listGridProfiles(profiles), [profiles]);
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
    <MotionConfig reducedMotion="user">
      <div className="homepage relative isolate">
        <div className="home-network pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
          {showParticles ? (
            <ParticleBoundary onError={onParticleError}>
              <ParticleBackground
                playing={shouldPlayParticles(environment, paused)}
                finePointer={environment.finePointer}
                onStatus={onParticleStatus}
              />
            </ParticleBoundary>
          ) : null}
        </div>
        <motion.section
          initial={false}
          animate={environment.ready && !environment.reducedMotion ? HERO_ENTRANCE : HERO_STATIC}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mx-auto w-full max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14"
        >
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
            /students
          </p>
          <h1 className="mt-3 max-w-3xl text-5xl font-medium tracking-tight sm:text-7xl">
            PCU tech pages, one link each.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted">
            Dolphub is a public portfolio for IT, CS, and Computer Engineering
            students. The grid only lists people who have published at least one
            project.
          </p>
          <div className="mt-6 min-h-11" aria-live="polite">
            {environment.ready && environment.reducedMotion ? (
              <p className="py-3 font-mono text-[11px] text-muted">Reduced motion · static background</p>
            ) : showParticles && particleStatus === "ready" ? (
              <motion.button
                type="button"
                aria-pressed={paused}
                onClick={() => setPaused((value) => !value)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="min-h-11 border border-ink/15 bg-background px-3 font-mono text-[11px] uppercase tracking-wide text-ink hover:border-ink focus-visible:ring-2 focus-visible:ring-ink"
              >
                {paused ? "Resume particles" : "Pause particles"}
              </motion.button>
            ) : null}
          </div>
        </motion.section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
          <CourseFilter value={courseId} counts={counts} onChange={setCourseId} />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.length === 0 ? (
              <FirstCard />
            ) : (
              visible.map((profile, index) => (
                <ProfileCard key={profile.handle} profile={profile} index={index + 1} />
              ))
            )}
          </div>
        </section>

        <section className="border-y border-ink/10 bg-paper">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6">
            <Stat label="Published pages" value={String(published.length)} />
            <Stat label="Courses on the filter" value={String(COURSES.length)} />
            <Stat
              label="Status"
              value="Mock"
              hint="Edits in this tab update the grid"
            />
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
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
    </MotionConfig>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-3xl font-medium tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}
