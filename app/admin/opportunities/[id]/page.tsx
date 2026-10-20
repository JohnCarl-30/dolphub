import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminHeading } from "@/components/admin/admin-heading";
import { OpportunityForm } from "@/components/admin/opportunity-form";
import { toFormValues } from "@/lib/opportunity-form";
import { requireAdminPage } from "@/lib/admin";
import { getAdminOpportunities } from "@/lib/opportunities";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = { title: "Edit opportunity · Admin", robots: PRIVATE_ROBOTS };
export const instant = false;

/** Editing keeps the post's address: the slug never changes. */
export default async function Page(props: PageProps<"/admin/opportunities/[id]">) {
  await requireAdminPage();
  const { id } = await props.params;
  const post = (await getAdminOpportunities()).find((candidate) => candidate.id === id);
  if (!post) notFound();

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
      <AdminHeading label={`/opportunities/${post.slug}`} title="Edit opportunity" current={null}>
        The address stays the same after you save, so links people have shared keep working.
      </AdminHeading>
      <OpportunityForm mode="edit" id={post.id} initial={toFormValues(post)} />
    </div>
  );
}
