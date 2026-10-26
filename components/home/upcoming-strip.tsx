import { closingLabel, formatManilaDate, formatManilaTime } from "@/lib/opportunity-time";
import { actionLabel, KIND_NAMES, whereLabel, type OpportunityPreview } from "@/lib/opportunity-display";
import { opportunityPath } from "@/lib/seo";
import Link from "next/link";
import { revealStyle } from "@/components/animations/reveal";

/** The next three open posts, soonest closing first. `posts` is null while the clock loads. */
export function UpcomingStrip({ posts, now }: { posts: OpportunityPreview[] | null; now: Date | null }) {
  return (
    <section aria-labelledby="upcoming-heading" className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <p className="viewport-reveal font-mono text-[11px] uppercase tracking-wide text-muted">/upcoming</p>
      <h2 id="upcoming-heading" className="viewport-reveal mt-3 text-3xl font-medium tracking-tight">
        Upcoming
      </h2>
      <p className="viewport-reveal mt-3 max-w-xl text-sm leading-6 text-muted">
        Internships, events, competitions and programs, soonest closing first.
      </p>

      {/* Height is reserved so the page does not jump when the cards arrive. */}
      <div className="mt-8 min-h-72">
        {posts === null || now === null ? null : posts.length === 0 ? (
          <div className="rise border border-dashed border-ink/20 px-4 py-5">
            <p className="font-medium">Nothing open right now</p>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
              New internships and events are posted every week. Sign up below to hear when they are.
            </p>
          </div>
        ) : (
          <ol className="grid gap-4 md:grid-cols-3">
            {posts.map((post, index) => (
              <li key={post.slug} className="rise" style={{ "--i": index } as React.CSSProperties}>
                <div className="viewport-reveal h-full" style={revealStyle(index)}>
                  <UpcomingCard post={post} now={now} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
      <Link
        href="/opportunities"
        className="mt-6 inline-block font-mono text-[11px] uppercase tracking-wide text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-ink focus-visible:ring-2 focus-visible:ring-ink"
      >
        See all opportunities <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}

/** Opens the post's own page, where signed-in students find the apply link. */
function UpcomingCard({ post, now }: { post: OpportunityPreview; now: Date }) {
  const date = post.startsAt ?? post.deadline;
  const time = post.startsAt ? `, ${formatManilaTime(post.startsAt)}` : "";
  const where = whereLabel(post);

  return (
    <Link
      href={opportunityPath(post.slug)}
      className="press group flex h-full flex-col border border-ink/10 bg-white px-4 py-5 outline-none transition-colors hover:border-ink/40 focus-visible:ring-2 focus-visible:ring-ink"
    >
      <p className="flex items-baseline justify-between gap-4 font-mono text-[11px] uppercase tracking-wide">
        <span className="text-muted">{KIND_NAMES[post.kind]}</span>
        <span className="text-ink">{closingLabel(post.closesAt, now)}</span>
      </p>
      <h3 className="mt-3 text-xl font-medium tracking-tight">{post.title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted">{post.organization}</p>
      <dl className="mt-4 text-sm leading-6">
        {date ? (
          <div>
            <dt className="sr-only">{post.startsAt ? "Starts" : "Deadline"}</dt>
            <dd>
              {post.startsAt ? "" : "Apply by "}
              {formatManilaDate(date, now)}
              {time}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="sr-only">Where</dt>
          <dd className="text-muted">{where}</dd>
        </div>
      </dl>
      <p className="mt-auto pt-5 font-mono text-[11px] uppercase tracking-wide text-ink">
        {actionLabel(post.kind)}{" "}
        <span aria-hidden="true" className="inline-block transition-transform duration-150 group-hover:translate-x-1">
          →
        </span>
      </p>
    </Link>
  );
}
