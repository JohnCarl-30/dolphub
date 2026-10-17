"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useState } from "react";
import { StudentShowcase } from "@/components/student-showcase";
import { HandleSlot } from "@/components/handle-slot";
import { PublishStages } from "@/components/publish-stages";
import { ClaimHandle } from "@/components/claim-handle";
import { useMockStore } from "@/components/mock-store";
import { COURSES, listGridProfiles } from "@/lib/mock-profiles";
import { shouldPlayParticles } from "@/lib/particles";
import { useMotionEnvironment } from "@/components/animations/use-motion-environment";
import { useReveal } from "@/components/animations/use-reveal";
import { ParticleBoundary } from "@/components/particles/particle-boundary";

const ParticleBackground = dynamic(
  () => import("@/components/particles/particle-background"),
  { ssr: false },
);

const style = (i: number) => ({ "--i": i }) as React.CSSProperties;

type Picture = { src: string; alt: string; width: number; height: number; credit: string; page: string };

function World({ picture, className, sizes, lazy = true, decorative = false }: {
  picture: Picture;
  className: string;
  sizes: string;
  lazy?: boolean;
  decorative?: boolean;
}) {
  return (
    <Image
      src={picture.src}
      alt={decorative ? "" : picture.alt}
      width={picture.width}
      height={picture.height}
      sizes={sizes}
      loading={lazy ? "lazy" : "eager"}
      className={className}
    />
  );
}

/** Real pictures of the world around PCU, found in the open collections and credited below. */
const WORLD = {
  taft: {
    src: "/world/national-museum-top-view-with-lrt-1.jpg",
    alt: "An LRT-1 train running along Taft Avenue past the National Museum in Manila, seen from above.",
    width: 1600,
    height: 1200,
    credit: "Patrickroque01, CC BY-SA 4.0, via Wikimedia Commons",
    page: "https://commons.wikimedia.org/w/index.php?curid=146669058",
  },
  jeepney: {
    src: "/world/manila-jeepney-philippines.jpg",
    alt: "A chrome jeepney waiting at a curb in Manila under a covered walkway.",
    width: 1600,
    height: 1067,
    credit: "Vyacheslav Argenberg, CC BY 4.0, via Wikimedia Commons",
    page: "https://commons.wikimedia.org/w/index.php?curid=114477545",
  },
  skyline: {
    src: "/world/manila-skyline-philippines.jpg",
    alt: "Barges on the Pasig River with the Manila skyline behind them in haze.",
    width: 1600,
    height: 1067,
    credit: "Vyacheslav Argenberg, CC BY 4.0, via Wikimedia Commons",
    page: "https://commons.wikimedia.org/w/index.php?curid=114473455",
  },
  court: {
    src: "/world/supreme-court-old-building-side-view-taft.jpg",
    alt: "The arched entrance of the old Supreme Court building on Taft Avenue, with two statues and a flag.",
    width: 1600,
    height: 1200,
    credit: "patrickroque01, CC BY-SA 4.0, via Wikimedia Commons",
    page: "https://commons.wikimedia.org/w/index.php?curid=90912720",
  },
};

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
  useReveal(homepage);

  const published = useMemo(() => listGridProfiles(profiles), [profiles]);
  const visible = useMemo(() => listGridProfiles(profiles, courseId), [courseId, profiles]);
  const counts = useMemo(() => {
    const next: Record<string, number> = {};
    for (const course of COURSES) next[course.id] = listGridProfiles(profiles, course.id).length;
    return next;
  }, [profiles]);
  const handles = useMemo(() => published.map((profile) => profile.handle), [published]);
  const projectCount = published.reduce((sum, profile) => sum + profile.projects.length, 0);
  const coursesWithPages = COURSES.filter((course) => counts[course.id] > 0).length;

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

      {/* The sentence is the layout. The word "link" is shown, not said: a live student link sits in its place. */}
      <section data-hero className="flex min-h-[88svh] flex-col justify-center px-margin pb-16 pt-10">
        <h1 className="lines text-display font-medium">
          <span className="line">
            <span data-line style={style(0)}>Every PCU coder,</span>
          </span>
          <span className="line">
            <span data-line style={style(1)}>
              one <HandleSlot handles={handles} />
            </span>
          </span>
        </h1>
        <p data-after-lines style={style(0)} className="mt-10 max-w-[40ch] text-lede text-ink">
          Dolphub is the public directory of IT, CS and Computer Engineering students at PCU. Each
          student gets one address, and it appears here once they have published a project.
        </p>
        <div data-after-lines style={style(1)} className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/dashboard"
            className="press inline-flex min-h-12 items-center bg-accent px-5 text-lede font-medium text-white outline-none hover:bg-ink focus-visible:ring-2 focus-visible:ring-ink"
          >
            Publish your page
          </Link>
          <a href="#students" className="text-note text-ink underline underline-offset-4 transition-colors hover:text-accent">
            Or look through the pages first
          </a>
        </div>
      </section>

      {/* Object in front of type: the course names are the filter, the published pages are the proof. */}
      <div id="students" className="scroll-mt-6">
        <StudentShowcase
          profiles={visible} courseId={courseId} counts={counts} onCourseChange={setCourseId}
          homepage={homepage} network={network} ready={environment.ready}
          reducedMotion={environment.reducedMotion} hidden={environment.hidden}
          onActive={setShowcaseActive}
        />
      </div>

      {/* The small window in the sentence opens to full width: Taft Avenue, where PCU stands. */}
      <section id="after-showcase" tabIndex={-1} aria-label="Taft Avenue, Manila" className="mt-24 sm:mt-40">
        <figure data-drift className="overflow-hidden">
          <World picture={WORLD.taft} sizes="100vw" className="h-[70svh] w-full object-cover sm:h-[88svh]" />
          <figcaption className="px-margin pt-3 text-note text-muted">
            Taft Avenue, Manila, where PCU stands. Photo by {WORLD.taft.credit}.
          </figcaption>
        </figure>
      </section>

      {/* Figures inside a sentence. */}
      <section aria-labelledby="figures-heading" className="flex min-h-[80svh] items-center px-margin py-24">
        <h2 id="figures-heading" className="sr-only">
          The numbers
        </h2>
        <p data-reveal className="max-w-[30ch] text-statement font-medium text-ink">
          So far <span className="text-accent">{published.length}&nbsp;students</span> in{" "}
          <span className="text-accent">{coursesWithPages}&nbsp;programs</span> have published{" "}
          <span className="text-accent">{projectCount}&nbsp;projects</span>, and every one of them fits in{" "}
          <span className="text-accent">1&nbsp;link</span>.
        </p>
      </section>

      {/* Drag through the stages. */}
      <PublishStages />

      {/* Two more windows onto the world the pages come from. */}
      <section aria-label="Manila" className="grid grid-cols-1 gap-margin px-margin pt-24 sm:grid-cols-2 sm:pt-40">
        <figure data-reveal style={style(0)}>
          <World picture={WORLD.jeepney} sizes="(min-width: 640px) 50vw, 100vw" className="aspect-[4/3] w-full object-cover" />
          <figcaption className="pt-3 text-note text-muted">A jeepney in Makati. Photo by {WORLD.jeepney.credit}.</figcaption>
        </figure>
        <figure data-reveal style={style(1)}>
          <World picture={WORLD.court} sizes="(min-width: 640px) 50vw, 100vw" className="aspect-[4/3] w-full object-cover" />
          <figcaption className="pt-3 text-note text-muted">The old Supreme Court on Taft Avenue. Photo by {WORLD.court.credit}.</figcaption>
        </figure>
      </section>

      {/* A sentence with a blank. */}
      <div className="mt-24 sm:mt-40">
        <ClaimHandle />
      </div>

      {/* Contact as the headline: the address itself, on a field of the one accent. */}
      <section aria-label="Where to find Dolphub" className="relative flex min-h-[90svh] flex-col justify-between overflow-hidden bg-accent px-margin py-10 text-white">
        <World
          picture={WORLD.skyline}
          decorative
          sizes="100vw"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-6 text-note">
          <div className="max-w-[40ch]">
            <p>Philippine Christian University, Taft Avenue, Manila.</p>
            <p>Open to IT, CS and Computer Engineering students with a PCU address.</p>
          </div>
          <a href="#top" className="underline underline-offset-4 transition-colors hover:text-ink">
            Back to top
          </a>
        </div>
        <div className="relative">
          <Link
            href="/dashboard"
            className="press block break-words text-display font-medium leading-[0.95] tracking-[-0.04em] text-white outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-white"
            data-reveal
          >
            dolphub.tech
            <br />
            /u/you
          </Link>
          <div className="mt-8 flex flex-wrap justify-between gap-x-8 gap-y-2 text-note" data-reveal style={style(1)}>
            <p>
              <Link href="/dashboard" className="underline underline-offset-4">Dashboard</Link>
            </p>
            <p className="max-w-[60ch]">
              Pictures: <a href={WORLD.taft.page} className="underline underline-offset-4">Taft Avenue</a> and{" "}
              <a href={WORLD.court.page} className="underline underline-offset-4">the old Supreme Court</a> by patrickroque01, CC BY-SA 4.0;{" "}
              <a href={WORLD.jeepney.page} className="underline underline-offset-4">jeepney</a> and{" "}
              <a href={WORLD.skyline.page} className="underline underline-offset-4">skyline</a> by Vyacheslav Argenberg, CC BY 4.0. All via Wikimedia Commons.
            </p>
            <p>Manila, 2026</p>
          </div>
        </div>
      </section>
    </div>
  );
}
