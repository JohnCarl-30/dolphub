/* eslint-disable @next/next/no-img-element -- uploaded image URLs are already optimized by the upload pipeline. */
import Link from "next/link";
import { Suspense } from "react";
import { getFeaturedProjects } from "@/lib/profiles";

const PAGES = [
  { href: "/what", label: "What", text: "A focused portfolio space for PCU tech students to show practical work and share one lasting link." },
  { href: "/about", label: "About", text: "Built for IT, Computer Science, and Computer Engineering students who want their projects to be easier to discover." },
  { href: "/vision", label: "Vision", text: "Every PCU tech student should leave with work that is visible, useful, and easy to share." },
];

export function LandingPage() {
  return <div>
    <section data-hero className="mx-auto w-full max-w-6xl px-4 pb-12 pt-10 sm:px-6 sm:pt-16">
      <p className="rise font-mono text-[11px] uppercase tracking-wide text-muted">/dolphub</p>
      <h1 className="rise mt-3 max-w-4xl text-5xl font-medium tracking-tight sm:text-7xl" style={{ "--i": 1 } as React.CSSProperties}>One link for every project you&apos;ve built.</h1>
      <p className="rise mt-6 max-w-2xl text-base leading-7 text-muted" style={{ "--i": 2 } as React.CSSProperties}>Dolphub gives PCU IT, Computer Science, and Computer Engineering students a public portfolio they can share with classmates, employers, and collaborators.</p>
      <div className="rise mt-8 flex flex-wrap gap-3" style={{ "--i": 3 } as React.CSSProperties}>
        <Link href="/dashboard" className="press inline-flex min-h-11 items-center border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white outline-none hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-ink">Create your page →</Link>
        <Link href="/login" className="press inline-flex min-h-11 items-center border border-ink/10 bg-background px-4 py-2 font-mono text-[11px] uppercase tracking-wide outline-none hover:bg-paper focus-visible:ring-2 focus-visible:ring-ink">Log in / Sign up →</Link>
      </div>
    </section>
    <section className="border-y border-ink/10 bg-paper"><div className="mx-auto grid w-full max-w-6xl gap-px sm:grid-cols-3">
      {PAGES.map((page) => <Link key={page.href} href={page.href} className="press p-6 outline-none transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/{page.label.toLowerCase()}</p><h2 className="mt-3 text-2xl font-medium tracking-tight">{page.label} Dolphub</h2><p className="mt-3 text-sm leading-6 text-muted">{page.text}</p>
      </Link>)}
    </div></section>
    <section aria-labelledby="featured-projects" className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/featured</p><h2 id="featured-projects" className="mt-3 text-3xl font-medium tracking-tight">Featured projects</h2>
      <Suspense fallback={<p className="mt-4 font-mono text-[11px] uppercase tracking-wide text-muted">Loading featured projects…</p>}><FeaturedProjects /></Suspense>
    </section>
  </div>;
}

async function FeaturedProjects() {
  const { projects, starsAvailable } = await getFeaturedProjects();
  if (projects.length === 0) return <p className="mt-4 max-w-xl text-base leading-7 text-muted">Featured projects will appear here as students publish their work.</p>;
  return <>
    {!starsAvailable ? <p role="status" className="mt-4 font-mono text-[11px] uppercase tracking-wide text-muted">Stars temporarily unavailable · showing recent work</p> : null}
    <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{projects.map((project, index) => <li key={project.id}>
      <Link href={`/u/${project.handle}`} className="press flex h-full flex-col border border-ink/10 bg-paper outline-none hover:border-ink focus-visible:ring-2 focus-visible:ring-ink">
        {project.imageUrl ? <img src={project.imageUrl} alt="" className="aspect-[16/10] w-full border-b border-ink/10 object-cover" /> : <div className="flex aspect-[16/10] items-center justify-center border-b border-ink/10 bg-white font-mono text-[11px] uppercase tracking-wide text-muted">No image yet</div>}
        <div className="flex flex-1 flex-col gap-3 p-5"><p className="font-mono text-[11px] uppercase tracking-wide text-muted">{String(index + 1).padStart(2, "0")} · {starsAvailable && project.starCount !== null ? `★ ${project.starCount}` : "Stars temporarily unavailable"}</p><h3 className="text-2xl font-medium tracking-tight">{project.title}</h3>{project.description ? <p className="text-sm leading-6 text-muted">{project.description}</p> : null}<p className="mt-auto font-mono text-[11px] uppercase tracking-wide text-muted">{project.displayName} · /u/{project.handle} →</p></div>
      </Link>
    </li>)}</ol>
  </>;
}
