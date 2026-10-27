/* eslint-disable @next/next/no-img-element -- uploaded image URLs are already optimized by the upload pipeline. */
import Link from "next/link";
import { Suspense } from "react";
import { ContentErrorBoundary } from "@/components/content-error-boundary";
import { revealStyle } from "@/components/animations/reveal";
import { LandingPageJourney } from "@/components/landing-page-journey";
import { getFeaturedProjects } from "@/lib/profiles";

const PAGES = [
  { href: "/what", label: "What", text: "A focused portfolio space for PCU tech students to show practical work and share one lasting link." },
  { href: "/about", label: "About", text: "Built for IT, Computer Science, and Computer Engineering students who want their projects to be easier to discover." },
  { href: "/vision", label: "Vision", text: "Every PCU tech student should leave with work that is visible, useful, and easy to share." },
];

export function LandingPage() {
  return <LandingPageJourney>
    <section data-landing-panel data-hero className="landing-panel flex items-center">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <p className="intro-reveal font-mono text-[11px] uppercase tracking-wide text-muted">/dolphub</p>
        <h1 className="intro-reveal mt-3 max-w-4xl text-5xl font-medium tracking-tight sm:text-7xl" style={{ "--i": 1 } as React.CSSProperties}>One link for every project you&apos;ve built.</h1>
        <p className="intro-reveal mt-6 max-w-2xl text-base leading-7 text-muted" style={{ "--i": 2 } as React.CSSProperties}>Dolphub gives PCU IT, Computer Science, and Computer Engineering students a public portfolio they can share with classmates, employers, and collaborators.</p>
        <div className="intro-reveal mt-8 flex flex-wrap gap-3" style={{ "--i": 3 } as React.CSSProperties}>
          <Link href="/dashboard" className="press inline-flex min-h-11 items-center border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white outline-none hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-ink">Create your page →</Link>
          <Link href="/login" className="press inline-flex min-h-11 items-center border border-ink/10 bg-background px-4 py-2 font-mono text-[11px] uppercase tracking-wide outline-none hover:bg-paper focus-visible:ring-2 focus-visible:ring-ink">Log in / Sign up →</Link>
        </div>
      </div>
    </section>
    {PAGES.map((page) => <section key={page.href} data-landing-panel aria-labelledby={`landing-${page.label.toLowerCase()}`} className="landing-panel flex items-center">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/{page.label.toLowerCase()}</p>
        <h2 id={`landing-${page.label.toLowerCase()}`} className="mt-4 text-5xl font-medium tracking-tight sm:text-7xl">{page.label}</h2>
        <p className="mt-6 max-w-2xl text-base leading-7 text-muted">{page.text}</p>
        <Link href={page.href} className="press mt-8 inline-flex min-h-11 items-center border border-ink bg-background px-4 py-2 font-mono text-[11px] uppercase tracking-wide outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-ink">Read {page.label} →</Link>
      </div>
    </section>)}
    <section data-landing-panel aria-labelledby="featured-projects" className="landing-panel flex items-center">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/featured</p><h2 id="featured-projects" className="mt-3 text-3xl font-medium tracking-tight">Featured projects</h2>
      <ContentErrorBoundary
        title="Featured projects are temporarily unavailable."
        description="Please try again shortly. You can still explore what Dolphub is building."
      >
        <Suspense fallback={<p className="mt-4 font-mono text-[11px] uppercase tracking-wide text-muted">Loading featured projects…</p>}><FeaturedProjects /></Suspense>
      </ContentErrorBoundary>
      </div>
    </section>
  </LandingPageJourney>;
}

async function FeaturedProjects() {
  const { projects, starsAvailable } = await getFeaturedProjects();
  if (projects.length === 0) return <p className="mt-4 max-w-xl text-base leading-7 text-muted">Featured projects will appear here as students publish their work.</p>;
  return <>
    {!starsAvailable ? <p role="status" className="mt-4 font-mono text-[11px] uppercase tracking-wide text-muted">Stars temporarily unavailable · showing recent work</p> : null}
    <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{projects.map((project, index) => <li key={project.id} className="viewport-reveal" style={revealStyle(index)}>
      <Link href={`/u/${project.handle}`} className="press flex h-full flex-col border border-ink/10 bg-paper outline-none hover:border-ink focus-visible:ring-2 focus-visible:ring-ink">
        {project.imageUrl ? <img src={project.imageUrl} alt="" className="aspect-[16/10] w-full border-b border-ink/10 object-cover" /> : <div className="flex aspect-[16/10] items-center justify-center border-b border-ink/10 bg-white font-mono text-[11px] uppercase tracking-wide text-muted">No image yet</div>}
        <div className="flex flex-1 flex-col gap-3 p-5"><p className="font-mono text-[11px] uppercase tracking-wide text-muted">{String(index + 1).padStart(2, "0")} · {starsAvailable && project.starCount !== null ? `★ ${project.starCount}` : "Stars temporarily unavailable"}</p><h3 className="text-2xl font-medium tracking-tight">{project.title}</h3>{project.description ? <p className="text-sm leading-6 text-muted">{project.description}</p> : null}<p className="mt-auto font-mono text-[11px] uppercase tracking-wide text-muted">{project.displayName} · /u/{project.handle} →</p></div>
      </Link>
    </li>)}</ol>
  </>;
}
