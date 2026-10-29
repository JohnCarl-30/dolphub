import Link from "next/link";
import { Suspense } from "react";
import { ProfileAvatar } from "@/components/profile-avatar";
import { SharePageButton } from "@/components/share-page-button";
import { courseLabel } from "@/lib/course-labels";
import { getOpenOpportunities } from "@/lib/opportunities";
import { KIND_NAMES } from "@/lib/opportunity-display";
import { closingLabel } from "@/lib/opportunity-time";
import { opportunityPath, profilePath } from "@/lib/seo";

/** The signed-in student's own page, or null before they create one. */
export type DashboardMe = {
  handle: string;
  displayName: string;
  tagline: string;
  courseName: string;
  projectCount: number;
  photoCount: number;
  profilePictureUrl: string | null;
} | null;

/** How many open posts the dashboard lists before pointing to /opportunities. */
const OPPORTUNITY_PREVIEW = 3;

/** Signed in: the student's page, what to do next, and open opportunities. */
export function DashboardPage({ email, me }: { email: string; me: DashboardMe }) {
  // Before a page exists, the card uses the sign-in address's name part.
  const name = me?.displayName ?? email.split("@")[0]!;

  const steps = [
    { label: "Create your page", hint: "Pick a handle and add your name and course.", done: me !== null },
    {
      label: "Add a project",
      hint: "Your page joins the home showcase once it has a project.",
      done: (me?.projectCount ?? 0) > 0,
    },
    { label: "Add a photo", hint: "A screenshot makes a project easier to picture.", done: (me?.photoCount ?? 0) > 0 },
  ];
  const doneCount = steps.filter((step) => step.done).length;

  return (
    <section aria-labelledby="dashboard-title" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/dashboard</p>
        <h1 id="dashboard-title" className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
          Dashboard
        </h1>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[14rem_minmax(0,1fr)_16rem]">
        <aside data-testid="identity-rail" aria-label="Your profile" className="border border-ink/10 bg-background">
          <div className="flex items-center gap-3 p-4 lg:block">
            <ProfileAvatar name={name} src={me?.profilePictureUrl} className="size-12 lg:size-16" />
            <div className="min-w-0 lg:mt-4">
              <h2 className="truncate text-lg font-medium tracking-tight">{name}</h2>
              {me ? (
                <>
                  {me.tagline ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{me.tagline}</p> : null}
                  <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-wide text-muted">
                    {courseLabel(me.courseName)}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-xs leading-5 text-muted">You don&apos;t have a public page yet.</p>
              )}
            </div>
          </div>
          {me ? (
            <div className="grid grid-cols-2 border-t border-ink/10 lg:grid-cols-1">
              <Link href="/profile" className="press border-r border-ink/10 px-4 py-3 font-mono text-[11px] uppercase tracking-wide outline-none hover:bg-paper focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink lg:border-b lg:border-r-0">
                Edit profile →
              </Link>
              <Link href={profilePath(me.handle)} className="press px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-muted outline-none hover:bg-paper hover:text-ink focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink">
                View public page →
              </Link>
            </div>
          ) : (
            <div className="border-t border-ink/10">
              <Link href="/profile" className="press block px-4 py-3 font-mono text-[11px] uppercase tracking-wide outline-none hover:bg-paper focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink">
                Create your page →
              </Link>
            </div>
          )}
        </aside>

        <section aria-labelledby="steps-heading" className="min-w-0 border border-ink/10 bg-background">
          <div className="flex items-baseline justify-between gap-4 border-b border-ink/10 p-4">
            <h2 id="steps-heading" className="text-xl font-medium tracking-tight">
              {doneCount === steps.length ? "Your page is ready" : "Next steps"}
            </h2>
            <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
              {doneCount} of {steps.length} done
            </p>
          </div>
          <ol className="divide-y divide-ink/10">
            {steps.map((step) => (
              <li key={step.label} className="flex items-start gap-3 p-4">
                <span aria-hidden="true" className="w-12 shrink-0 font-mono text-[11px] uppercase tracking-wide text-muted">
                  {step.done ? "[ x ]" : "[   ]"}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-medium leading-6 ${step.done ? "text-muted line-through decoration-ink/30" : ""}`}>
                    {step.label}
                    <span className="sr-only">{step.done ? ", done" : ", not done yet"}</span>
                  </p>
                  {step.done ? null : <p className="text-xs leading-5 text-muted">{step.hint}</p>}
                </div>
              </li>
            ))}
          </ol>
          <div className="border-t border-ink/10 p-4">
            {doneCount === steps.length && me ? (
              <>
                <p className="text-sm leading-6">
                  Share your link in your class group chat:{" "}
                  <Link href={profilePath(me.handle)} className="font-medium underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                    dolphub.tech/u/{me.handle}
                  </Link>
                </p>
                <SharePageButton path={profilePath(me.handle)} name={me.displayName} />
              </>
            ) : (
              <Link
                href={me ? "/profile/projects" : "/profile"}
                className="press inline-flex min-h-11 items-center border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white outline-none hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-ink"
              >
                {me ? "Continue your projects →" : "Create your page →"}
              </Link>
            )}
          </div>
        </section>

        <aside data-testid="discovery-rail" aria-labelledby="discover-heading" className="border border-ink/10 bg-background">
          <div className="border-b border-ink/10 p-4">
            <p className="font-mono text-[10px] uppercase tracking-wide text-muted">Discover</p>
            <h2 id="discover-heading" className="mt-2 text-xl font-medium tracking-tight">
              Open opportunities
            </h2>
          </div>
          <Suspense fallback={<p className="p-4 font-mono text-[11px] uppercase tracking-wide text-muted">Loading posts…</p>}>
            <OpenOpportunities />
          </Suspense>
          <Link href="/opportunities" className="press block border-t border-ink/10 px-4 py-3 font-mono text-[11px] uppercase tracking-wide outline-none hover:bg-paper focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink">
            See all opportunities →
          </Link>
        </aside>
      </div>
    </section>
  );
}
async function OpenOpportunities() {
  const posts = (await getOpenOpportunities()).slice(0, OPPORTUNITY_PREVIEW);
  const now = new Date();
  if (posts.length === 0) {
    return <p className="p-4 text-sm leading-6 text-muted">Nothing open right now. New posts go up every week.</p>;
  }
  return (
    <ol className="divide-y divide-ink/10">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link href={opportunityPath(post.slug)} className="press block p-4 outline-none hover:bg-paper focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink">
            <p className="flex items-baseline justify-between gap-3 font-mono text-[10px] uppercase tracking-wide">
              <span className="text-muted">{KIND_NAMES[post.kind]}</span>
              <span>{closingLabel(post.closesAt, now)}</span>
            </p>
            <h3 className="mt-2 text-sm font-medium leading-5">{post.title}</h3>
            <p className="mt-1 text-xs leading-5 text-muted">{post.organization}</p>
          </Link>
        </li>
      ))}
    </ol>
  );
}
