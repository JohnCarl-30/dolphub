import type { Metadata } from "next";
import { AdminHeading } from "@/components/admin/admin-heading";
import { OpportunityForm } from "@/components/admin/opportunity-form";
import { EMPTY_FORM } from "@/lib/opportunity-form";
import { requireAdminPage } from "@/lib/admin";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = { title: "Post an opportunity · Admin", robots: PRIVATE_ROBOTS };
export const instant = false;

export default async function Page() {
  await requireAdminPage();
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
      <AdminHeading label="/admin/opportunities/new" title="Post an opportunity" current={null}>
        Before posting, check that the organization is real, the link is its official page, nobody is asked to pay to
        apply, and the deadline is right.
      </AdminHeading>
      <OpportunityForm mode="create" initial={EMPTY_FORM} />
    </div>
  );
}
