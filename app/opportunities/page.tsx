import type { Metadata } from "next";
import { Suspense } from "react";
import { KindFilter } from "@/components/opportunities/kind-filter";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { getOpenOpportunities } from "@/lib/opportunities";
import { opportunitiesListMetadata } from "@/lib/seo";
import { KIND_LABELS, OPPORTUNITY_KINDS, type OpportunityKind } from "@/lib/services/opportunities";

export const metadata: Metadata = opportunitiesListMetadata();

export default function Page({ searchParams }: PageProps<"/opportunities">) {
  return (
    <section aria-labelledby="opportunities-heading" className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
      <p className="rise font-mono text-[11px] uppercase tracking-wide text-muted">/opportunities</p>
      <h1
        id="opportunities-heading"
        className="rise mt-3 max-w-3xl text-5xl font-medium tracking-tight sm:text-7xl"
        style={{ "--i": 1 } as React.CSSProperties}
      >
        Opportunities
      </h1>
      <p className="rise mt-6 max-w-xl text-base leading-7 text-muted" style={{ "--i": 2 } as React.CSSProperties}>
        Internships, events, competitions and programs for PCU tech students, soonest closing first. Each one links to
        where you apply or register. Posts leave the list when they close.
      </p>
      <Suspense fallback={<p className="mt-10 font-mono text-[11px] uppercase tracking-wide text-muted">Loading posts…</p>}>
        <OpportunityList searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function OpportunityList({ searchParams }: { searchParams: PageProps<"/opportunities">["searchParams"] }) {
  const { kind: rawKind } = await searchParams;
  const kind: OpportunityKind | null = OPPORTUNITY_KINDS.find((k) => k === rawKind) ?? null;
  const posts = await getOpenOpportunities();
  const now = new Date();

  const counts = Object.fromEntries(
    OPPORTUNITY_KINDS.map((k) => [k, posts.filter((post) => post.kind === k).length]),
  ) as Record<OpportunityKind, number>;
  const visible = kind ? posts.filter((post) => post.kind === kind) : posts;

  return (
    <div className="mt-10">
      <KindFilter value={kind} counts={counts} />
      {visible.length === 0 ? (
        <div className="rise mt-6 border border-dashed border-ink/20 px-4 py-5">
          <p className="font-medium">
            {kind ? `No open ${KIND_LABELS[kind].many.toLowerCase()} right now` : "Nothing open right now"}
          </p>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
            New posts go up every week, and each one stays until it closes. Check back soon.
          </p>
        </div>
      ) : (
        <ol aria-label={kind ? `Open ${KIND_LABELS[kind].many.toLowerCase()}` : "Open opportunities"} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((post, index) => (
            <li key={post.slug} className="rise" style={{ "--i": Math.min(index, 8) } as React.CSSProperties}>
              <OpportunityCard post={post} now={now} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
