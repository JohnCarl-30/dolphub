import Link from "next/link";
import type { PublicOpportunity } from "@/lib/services/opportunities";
import { closingLabel } from "@/lib/opportunity-time";
import { dateTimeLabel, KIND_NAMES, whereLabel } from "@/lib/opportunity-display";
import { opportunityPath } from "@/lib/seo";

/** One open post in the /opportunities list. Opens the post's own page, which has the apply link. */
export function OpportunityCard({ post, now }: { post: PublicOpportunity; now: Date }) {
  const date = post.startsAt ?? post.deadline;

  return (
    <Link
      href={opportunityPath(post.slug)}
      data-opportunity-card
      className="press group flex h-full flex-col border border-ink/10 bg-white px-4 py-5 outline-none transition-colors hover:border-ink/40 focus-visible:ring-2 focus-visible:ring-ink"
    >
      <p className="flex items-baseline justify-between gap-4 font-mono text-[11px] uppercase tracking-wide">
        <span className="text-muted">{KIND_NAMES[post.kind]}</span>
        <span className="text-ink">{closingLabel(post.closesAt, now)}</span>
      </p>
      <h2 className="mt-3 text-xl font-medium tracking-tight">{post.title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted">{post.organization}</p>
      <dl className="mt-4 text-sm leading-6">
        {date ? (
          <div>
            <dt className="sr-only">{post.startsAt ? "Starts" : "Deadline"}</dt>
            <dd>
              {post.startsAt ? "" : "Apply by "}
              {dateTimeLabel(date, now)}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="sr-only">Where</dt>
          <dd className="text-muted">{whereLabel(post)}</dd>
        </div>
      </dl>
      <p className="mt-auto pt-5 font-mono text-[11px] uppercase tracking-wide text-ink">
        Details{" "}
        <span aria-hidden="true" className="inline-block transition-transform duration-150 group-hover:translate-x-1">
          →
        </span>
      </p>
    </Link>
  );
}
