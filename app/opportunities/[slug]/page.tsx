import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SignInOptions } from "@/components/sign-in-options";
import { REPORT_EMAIL } from "@/components/support-contacts";
import { getCurrentUser } from "@/lib/auth";
import { JsonLd } from "@/lib/json-ld";
import { getOpportunityPage } from "@/lib/opportunities";
import { actionLabel, dateTimeLabel, KIND_NAMES, whereLabel } from "@/lib/opportunity-display";
import { closingLabel } from "@/lib/opportunity-time";
import {
  missingOpportunityMetadata,
  OPPORTUNITIES_PATH,
  opportunityJsonLd,
  opportunityMetadata,
  opportunityPath,
  siteUrl,
} from "@/lib/seo";

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
  const [post, user] = await Promise.all([getOpportunityPage(slug), getCurrentUser()]);
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
      <Link href={OPPORTUNITIES_PATH} className={`intro-reveal font-mono text-[11px] uppercase tracking-wide ${inlineLink}`}>
        <span aria-hidden="true">← </span>All opportunities
      </Link>

      <p className="intro-reveal mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wide" style={{ "--i": 1 } as React.CSSProperties}>
        <span className="text-muted">/opportunities/{post.kind}</span>
        <span className="text-ink">{closingLabel(post.closesAt, now)}</span>
      </p>
      <h1 className="intro-reveal mt-3 text-4xl font-medium tracking-tight [overflow-wrap:anywhere] sm:text-5xl" style={{ "--i": 2 } as React.CSSProperties}>{post.title}</h1>
      <p className="intro-reveal mt-3 text-base leading-7 text-muted" style={{ "--i": 3 } as React.CSSProperties}>
        {KIND_NAMES[post.kind]} · {post.organization}
      </p>

      {post.isClosed ? (
        <div role="status" className="viewport-reveal mt-8 border border-ink px-4 py-5">
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

      <p className="viewport-reveal mt-8 whitespace-pre-line text-base leading-7">{post.summary}</p>

      <dl className="viewport-reveal mt-8 grid gap-px border border-ink/10 bg-ink/10 sm:grid-cols-2">
        {facts.map((fact) => (
          <div key={fact.label} className="bg-background px-4 py-4">
            <dt className="font-mono text-[11px] uppercase tracking-wide text-muted">{fact.label}</dt>
            <dd className="mt-1 text-base leading-6">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {post.isClosed ? null : !user ? (
        // The apply link is for signed-in students only, so it never reaches a signed-out page.
        <section aria-labelledby="sign-in-heading" className="viewport-reveal mt-8 border border-ink/10 bg-paper px-4 py-5">
          <h2 id="sign-in-heading" className="font-medium">
            Sign in to {action.toLowerCase()}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            The {action.toLowerCase()} link is for PCU students. Sign in and you&apos;ll come straight back to this post.
          </p>
          <div className="mt-4 max-w-sm">
            <SignInOptions next={opportunityPath(post.slug)} />
          </div>
        </section>
      ) : (
        <div className="viewport-reveal mt-8">
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

      <p className="viewport-reveal mt-12 border-t border-ink/10 pt-5 text-sm leading-6 text-muted">
        Broken link, wrong date, or asked to pay to apply?{" "}
        <a href={`mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(reportSubject)}`} className={inlineLink}>
          Report a problem with this post
        </a>
        .
      </p>
    </article>
  );
}
