import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JsonLd } from "@/lib/json-ld";
import { getOpportunityPage } from "@/lib/opportunities";
import { actionLabel, dateTimeLabel, KIND_NAMES, whereLabel } from "@/lib/opportunity-display";
import { closingLabel } from "@/lib/opportunity-time";
import {
  missingOpportunityMetadata,
  OPPORTUNITIES_PATH,
  opportunityJsonLd,
  opportunityMetadata,
  siteUrl,
} from "@/lib/seo";

/** Where "Report a problem with this post" goes: the maintainer who runs the admin page. */
const REPORT_EMAIL = "johncarlsantos30@gmail.com";

const inlineLink =
  "font-medium text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-ink focus-visible:ring-2 focus-visible:ring-ink";

/**
 * Cache Components needs one param at build time to prerender the page shell.
 * Builds run without a database, so this is a placeholder: every real post,
 * including this slug, is still read per request inside the Suspense boundary.
 */
export function generateStaticParams() {
  return [{ slug: "placeholder" }];
}

export async function generateMetadata({ params }: PageProps<"/opportunities/[slug]">): Promise<Metadata> {
  const post = await getOpportunityPage((await params).slug);
  return post ? opportunityMetadata(post, post.isClosed) : missingOpportunityMetadata();
}

export default function Page({ params }: PageProps<"/opportunities/[slug]">) {
  return (
    <Suspense
      fallback={
        <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/opportunities</p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight">Loading post…</h1>
        </section>
      }
    >
      <OpportunityDetail params={params} />
    </Suspense>
  );
}

async function OpportunityDetail({ params }: { params: PageProps<"/opportunities/[slug]">["params"] }) {
  const { slug } = await params;
  const post = await getOpportunityPage(slug);
  if (!post) notFound();

  const now = new Date();
  const ld = opportunityJsonLd(post, siteUrl(), post.isClosed);
  const action = actionLabel(post.kind);
  const reportSubject = `Problem with an opportunity: ${post.slug}`;

  const facts: { label: string; value: string }[] = [];
  if (post.deadline) facts.push({ label: `${action} by`, value: dateTimeLabel(post.deadline, now) });
  if (post.startsAt) facts.push({ label: "Starts", value: dateTimeLabel(post.startsAt, now) });
  if (post.endsAt) facts.push({ label: "Ends", value: dateTimeLabel(post.endsAt, now) });
  facts.push({ label: "Where", value: whereLabel(post) });

  return (
    <article className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
      {ld ? <JsonLd data={ld} /> : null}
      <Link href={OPPORTUNITIES_PATH} className={`font-mono text-[11px] uppercase tracking-wide ${inlineLink}`}>
        <span aria-hidden="true">← </span>All opportunities
      </Link>

      <p className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wide">
        <span className="text-muted">/opportunities/{post.kind}</span>
        <span className="text-ink">{closingLabel(post.closesAt, now)}</span>
      </p>
      <h1 className="mt-3 text-4xl font-medium tracking-tight [overflow-wrap:anywhere] sm:text-5xl">{post.title}</h1>
      <p className="mt-3 text-base leading-7 text-muted">
        {KIND_NAMES[post.kind]} · {post.organization}
      </p>

      {post.isClosed ? (
        <div role="status" className="mt-8 border border-ink px-4 py-5">
          <p className="font-medium">This opportunity has closed</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            It is no longer taking applications.{" "}
            <Link href={OPPORTUNITIES_PATH} className={inlineLink}>
              See what is open now
            </Link>
            .
          </p>
        </div>
      ) : null}

      <p className="mt-8 whitespace-pre-line text-base leading-7">{post.summary}</p>

      <dl className="mt-8 grid gap-px border border-ink/10 bg-ink/10 sm:grid-cols-2">
        {facts.map((fact) => (
          <div key={fact.label} className="bg-background px-4 py-4">
            <dt className="font-mono text-[11px] uppercase tracking-wide text-muted">{fact.label}</dt>
            <dd className="mt-1 text-base leading-6">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {post.isClosed ? null : (
        <div className="mt-8">
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="press inline-flex min-h-11 items-center gap-2 border border-ink bg-ink px-5 py-2 font-mono text-[11px] uppercase tracking-wide text-white outline-none hover:border-ink/85 hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-ink"
          >
            {action} <span aria-hidden="true">→</span>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <p className="mt-3 text-sm leading-6 text-muted">
            The link opens the organization&apos;s own page. Dolphub does not record who opens it.
          </p>
        </div>
      )}

      <p className="mt-12 border-t border-ink/10 pt-5 text-sm leading-6 text-muted">
        Broken link, wrong date, or asked to pay to apply?{" "}
        <a href={`mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(reportSubject)}`} className={inlineLink}>
          Report a problem with this post
        </a>
        .
      </p>
    </article>
  );
}
