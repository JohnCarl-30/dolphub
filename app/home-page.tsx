"use client";

import { StudentShowcase } from "@/components/student-showcase";
import { cardsInCourse, type Showcase } from "@/lib/showcase-data";
import { useParticleNetwork } from "@/components/particles/particle-network-provider";
import { FocusBand } from "@/components/home/focus-band";
import { NewsletterSignup } from "@/components/home/newsletter-signup";
import { UpcomingStrip } from "@/components/home/upcoming-strip";
import { useNow } from "@/components/home/use-now";
import { focusOpportunity, upcomingOpportunities } from "@/lib/opportunity-display";
import type { PublicOpportunity } from "@/lib/services/opportunities";
import { Suspense, use, useMemo, useRef, useState, type RefObject } from "react";
const STEPS = [
  {
    index: "01",
    title: "Sign in with a PCU address",
    copy: "Accounts are for PCU's IT, CS, and Computer Engineering students.",
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

export function HomePage({
  showcase,
  opportunities,
}: {
  showcase: Promise<Showcase>;
  /** Open posts from the database, soonest closing first. */
  opportunities: Promise<PublicOpportunity[]>;
}) {
  const { environment, network, setShowcaseActive } = useParticleNetwork();
  const now = useNow();
  const homepage = useRef<HTMLDivElement>(null);

  return (
    <div ref={homepage} className="homepage relative isolate">
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

        <Suspense fallback={null}>
          <LoadedFocusBand opportunities={opportunities} now={now} />
        </Suspense>

        <Suspense fallback={<ShowcaseFallback />}>
          <LoadedShowcase
            showcase={showcase}
            homepage={homepage} network={network} ready={environment.ready}
            reducedMotion={environment.reducedMotion} hidden={environment.hidden}
            onActive={setShowcaseActive}
          />
        </Suspense>

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

        <Suspense fallback={<UpcomingStrip posts={null} now={null} />}>
          <LoadedUpcomingStrip opportunities={opportunities} now={now} />
        </Suspense>
        <NewsletterSignup />
    </div>
  );
}

/** Both wait for the visitor's clock, so a post that closed since the server read it never shows. */
function LoadedFocusBand({ opportunities, now }: { opportunities: Promise<PublicOpportunity[]>; now: Date | null }) {
  const posts = use(opportunities);
  const post = now ? focusOpportunity(posts, now) : null;
  return post && now ? <FocusBand post={post} now={now} /> : null;
}

function LoadedUpcomingStrip({ opportunities, now }: { opportunities: Promise<PublicOpportunity[]>; now: Date | null }) {
  const posts = use(opportunities);
  return <UpcomingStrip posts={now ? upcomingOpportunities(posts, now) : null} now={now} />;
}

function LoadedShowcase({ showcase, ...motion }: {
  showcase: Promise<Showcase>;
  homepage: RefObject<HTMLDivElement | null>;
  network: RefObject<HTMLDivElement | null>;
  ready: boolean;
  reducedMotion: boolean;
  hidden: boolean;
  onActive: (active: boolean) => void;
}) {
  const { cards, courses } = use(showcase);
  const [courseName, setCourseName] = useState<string | null>(null);
  const visible = useMemo(() => cardsInCourse(cards, courseName), [cards, courseName]);
  const counts = useMemo(
    () => Object.fromEntries(courses.map((course) => [course.name, cardsInCourse(cards, course.name).length])),
    [cards, courses],
  );

  return (
    <StudentShowcase
      profiles={visible} courses={courses} courseId={courseName} counts={counts}
      onCourseChange={setCourseName} {...motion}
    />
  );
}

function ShowcaseFallback() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Loading students…</p>
    </section>
  );
}
