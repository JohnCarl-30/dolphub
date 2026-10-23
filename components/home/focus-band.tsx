import Link from "next/link";
import { closingLabel, formatManilaTime } from "@/lib/opportunity-time";
import { actionLabel, KIND_NAMES, type OpportunityPreview } from "@/lib/opportunity-display";
import { opportunityPath } from "@/lib/seo";

/** One post that closes within three days, set apart on ink so it is the first thing read. Opens the post's page, where signed-in students apply. */
export function FocusBand({ post, now }: { post: OpportunityPreview; now: Date }) {
  const when = post.startsAt && post.kind === "event" ? `Starts ${formatManilaTime(post.startsAt)}` : null;

  return (
    <aside aria-labelledby="focus-heading" className="rise mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="flex flex-col gap-4 border border-ink bg-ink px-4 py-5 text-white sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-white/70">
            <span className="text-white">{closingLabel(post.closesAt, now)}</span>
            {" · "}
            {KIND_NAMES[post.kind]}
            {when ? ` · ${when}` : null}
          </p>
          <h2 id="focus-heading" className="mt-2 text-xl font-medium tracking-tight">
            {post.title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-white/70">{post.organization}</p>
        </div>
        <Link
          href={opportunityPath(post.slug)}
          className="press inline-flex h-12 shrink-0 items-center self-start border border-white bg-white px-5 font-mono text-[11px] uppercase tracking-wide text-ink outline-none hover:bg-white/85 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:self-auto"
        >
          {actionLabel(post.kind)}
          <span className="sr-only"> for {post.title}</span>
        </Link>
      </div>
    </aside>
  );
}
