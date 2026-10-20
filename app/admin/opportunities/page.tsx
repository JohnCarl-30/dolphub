import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeading } from "@/components/admin/admin-heading";
import { OpportunityRow } from "@/components/admin/opportunity-row";
import { inlineLink, primaryButton } from "@/components/admin/styles";
import { requireAdminPage } from "@/lib/admin";
import { getAdminOpportunities } from "@/lib/opportunities";
import { opportunityPath, PRIVATE_ROBOTS } from "@/lib/seo";
import type { AdminOpportunity } from "@/lib/services/opportunities";

export const metadata: Metadata = { title: "Opportunities · Admin", robots: PRIVATE_ROBOTS };
export const instant = false;

/** Every post, grouped as open, hidden and closed, with a notice after a save. */
export default async function Page(props: PageProps<"/admin/opportunities">) {
  await requireAdminPage();
  const { saved } = await props.searchParams;
  const posts = await getAdminOpportunities();
  const savedPost = typeof saved === "string" ? posts.find((post) => post.slug === saved) : undefined;

  const groups: { id: string; title: string; empty: string; posts: AdminOpportunity[] }[] = [
    {
      id: "open",
      title: "Open",
      empty: "Nothing open. Students see an empty list until you post something.",
      posts: posts
        .filter((post) => !post.isHidden && !post.isClosed)
        .sort((a, b) => a.closesAt.getTime() - b.closesAt.getTime()),
    },
    {
      id: "hidden",
      title: "Hidden",
      empty: "No hidden posts.",
      posts: posts.filter((post) => post.isHidden),
    },
    {
      id: "closed",
      title: "Closed",
      empty: "No closed posts yet.",
      posts: posts.filter((post) => !post.isHidden && post.isClosed),
    },
  ];

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
      <AdminHeading label="/admin/opportunities" title="Opportunities" current="/admin/opportunities">
        Posts leave the public list when they close. Hide a post to take it down at once, and restore it later.
      </AdminHeading>

      {savedPost ? (
        <p role="status" className="rise border border-ink px-4 py-4 text-sm leading-6">
          Saved &quot;{savedPost.title}&quot;.{" "}
          {savedPost.isHidden ? null : (
            <Link href={opportunityPath(savedPost.slug)} className={inlineLink}>
              See the public page
            </Link>
          )}
        </p>
      ) : null}

      <div>
        <Link href="/admin/opportunities/new" className={primaryButton}>
          Post an opportunity
        </Link>
      </div>

      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`${group.id}-heading`}>
          <h2 id={`${group.id}-heading`} className="text-xl font-medium tracking-tight">
            {group.title} <span className="font-mono text-[11px] uppercase tracking-wide text-muted">[{group.posts.length}]</span>
          </h2>
          {group.posts.length === 0 ? (
            <p className="mt-4 border border-dashed border-ink/20 px-4 py-5 text-sm leading-6 text-muted">{group.empty}</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {group.posts.map((post) => (
                <li key={post.id}>
                  <OpportunityRow post={post} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
