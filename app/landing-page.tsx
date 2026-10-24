import Link from "next/link";
import { Suspense } from "react";
import { ProfileCard } from "@/components/profile-card";
import { FEATURED_STUDENT_HANDLES, featuredStudents } from "@/lib/featured-students";
import { getShowcase } from "@/lib/profiles";

export function LandingPage() {
  return (
    <div>
      <section data-hero className="mx-auto w-full max-w-6xl px-4 pb-12 pt-10 sm:px-6 sm:pt-16">
        <p className="rise font-mono text-[11px] uppercase tracking-wide text-muted">/dolphub</p>
        <h1 className="rise mt-3 max-w-4xl text-5xl font-medium tracking-tight sm:text-7xl" style={{ "--i": 1 } as React.CSSProperties}>
          One link for every project you&apos;ve built.
        </h1>
        <p className="rise mt-6 max-w-2xl text-base leading-7 text-muted" style={{ "--i": 2 } as React.CSSProperties}>
          Dolphub gives PCU IT, Computer Science, and Computer Engineering students a public portfolio they can share with classmates, employers, and collaborators.
        </p>
        <div className="rise mt-8 flex flex-wrap gap-3" style={{ "--i": 3 } as React.CSSProperties}>
          <Link href="/dashboard" className="press inline-flex min-h-11 items-center border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white outline-none hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-ink">
            Create your page →
          </Link>
          <Link href="/login" className="press inline-flex min-h-11 items-center border border-ink/10 bg-background px-4 py-2 font-mono text-[11px] uppercase tracking-wide outline-none hover:bg-paper focus-visible:ring-2 focus-visible:ring-ink">
            Log in →
          </Link>
        </div>
      </section>

      <section aria-labelledby="what-is-dolphub" className="border-y border-ink/10 bg-paper">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 sm:grid-cols-[12rem_minmax(0,1fr)] sm:px-6">
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">01 / What is Dolphub</p>
          <div>
            <h2 id="what-is-dolphub" className="text-3xl font-medium tracking-tight">What is Dolphub?</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">A focused portfolio space for PCU tech students to show their work, explain what they built, and share one lasting link.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="about-dolphub" className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 sm:grid-cols-[12rem_minmax(0,1fr)] sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">02 / About Dolphub</p>
        <div>
          <h2 id="about-dolphub" className="text-3xl font-medium tracking-tight">About Dolphub</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">Dolphub is built for PCU students in IT, Computer Science, and Computer Engineering. It makes projects easier to discover and gives each student a clearer way to present practical work.</p>
        </div>
      </section>

      <section aria-labelledby="vision-of-dolphub" className="border-y border-ink/10 bg-paper">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 sm:grid-cols-[12rem_minmax(0,1fr)] sm:px-6">
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">03 / Vision of Dolphub</p>
          <div>
            <h2 id="vision-of-dolphub" className="text-3xl font-medium tracking-tight">Vision of Dolphub</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">Every PCU tech student should leave with a portfolio that makes their projects visible, useful, and easy to share.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="featured-students" className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/featured</p>
        <h2 id="featured-students" className="mt-3 text-3xl font-medium tracking-tight">Featured students</h2>
        <Suspense fallback={<FeaturedStudentsFallback />}>
          <FeaturedStudents />
        </Suspense>
      </section>
    </div>
  );
}

async function FeaturedStudents() {
  if (FEATURED_STUDENT_HANDLES.length === 0) return <FeaturedStudentsEmpty />;

  const { cards } = await getShowcase();
  const featured = featuredStudents(cards);
  if (featured.length === 0) return <FeaturedStudentsEmpty />;

  return (
    <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {featured.map((profile, index) => (
        <li key={profile.handle}>
          <ProfileCard profile={profile} index={index + 1} preview />
        </li>
      ))}
    </ol>
  );
}

function FeaturedStudentsEmpty() {
  return <p className="mt-4 max-w-xl text-base leading-7 text-muted">Featured student portfolios will appear here soon.</p>;
}

function FeaturedStudentsFallback() {
  return <p className="mt-4 font-mono text-[11px] uppercase tracking-wide text-muted">Loading featured students…</p>;
}
