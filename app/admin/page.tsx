import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeading } from "@/components/admin/admin-heading";
import { ProfileRow } from "@/components/admin/profile-row";
import { SignupSwitch } from "@/components/admin/signup-switch";
import { inlineLink } from "@/components/admin/styles";
import { getAdminProfiles, getAdminStats, LAUNCH_GATE, requireAdminPage } from "@/lib/admin";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import { KIND_LABELS, OPPORTUNITY_KINDS } from "@/lib/services/opportunities";

export const metadata: Metadata = { title: "Admin", robots: PRIVATE_ROBOTS };
export const instant = false;

/** Stats, the opportunities launch check, the signup switch and page moderation. Phone-first. */
export default async function Page(props: PageProps<"/admin">) {
  await requireAdminPage();
  const { show } = await props.searchParams;
  const filter = show === "hidden" ? "hidden" : "recent";
  const [stats, profiles] = await Promise.all([getAdminStats(), getAdminProfiles(filter)]);

  const openPosts = OPPORTUNITY_KINDS.reduce((sum, kind) => sum + stats.openOpportunities[kind], 0);
  const kindsWithPosts = OPPORTUNITY_KINDS.filter((kind) => stats.openOpportunities[kind] > 0).length;
  const checks = [
    { label: `${LAUNCH_GATE.posts} or more open posts`, have: openPosts, need: LAUNCH_GATE.posts },
    { label: `${LAUNCH_GATE.kinds} or more kinds`, have: kindsWithPosts, need: LAUNCH_GATE.kinds },
  ];

  const numbers = [
    { label: "Active pages", value: `${stats.activeProfiles} / ${stats.target}`, hint: "Visible, with a project" },
    { label: "Accounts", value: String(stats.users), hint: "Signed up" },
    { label: "New this week", value: String(stats.signupsLast7Days), hint: "Last 7 days" },
    { label: "Hidden pages", value: String(stats.hiddenProfiles), hint: "Taken down by an admin" },
  ];

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
      <AdminHeading label="/admin" title="Admin" current="/admin">
        Every change here is recorded in the audit log.
      </AdminHeading>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="text-xl font-medium tracking-tight">
          Numbers
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-px border border-ink/10 bg-ink/10">
          {numbers.map((item) => (
            <div key={item.label} className="bg-background px-4 py-4">
              <dt className="font-mono text-[11px] uppercase tracking-wide text-muted">{item.label}</dt>
              <dd className="mt-1 text-3xl font-medium tracking-tight">{item.value}</dd>
              <dd className="mt-1 text-xs leading-5 text-muted">{item.hint}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="launch-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="launch-heading" className="text-xl font-medium tracking-tight">
            Opportunities for launch
          </h2>
          <Link href="/admin/opportunities" className={`font-mono text-[11px] uppercase tracking-wide ${inlineLink}`}>
            Manage posts <span aria-hidden="true">→</span>
          </Link>
        </div>
        <ul className="mt-4 grid gap-2">
          {checks.map((check) => {
            const met = check.have >= check.need;
            return (
              <li key={check.label} className="flex items-baseline justify-between gap-4 border border-ink/10 px-4 py-3">
                <span className="text-sm leading-6">
                  <span className="font-mono text-[11px] uppercase tracking-wide">{met ? "[ Met ]" : "[ Not yet ]"}</span>{" "}
                  {check.label}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
                  {check.have} of {check.need}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-wide text-muted">
          {OPPORTUNITY_KINDS.map((kind) => `${KIND_LABELS[kind].many} ${stats.openOpportunities[kind]}`).join(" · ")}
        </p>
      </section>

      <section aria-labelledby="signups-heading">
        <h2 id="signups-heading" className="text-xl font-medium tracking-tight">
          Signups
        </h2>
        <div className="mt-4">
          <SignupSwitch frozen={stats.signupsFrozen} />
        </div>
      </section>

      <section aria-labelledby="pages-heading">
        <h2 id="pages-heading" className="text-xl font-medium tracking-tight">
          Student pages
        </h2>
        <nav aria-label="Which pages" className="mt-4">
          <ul className="flex flex-wrap gap-2">
            {[
              { value: "recent", label: "Newest", href: "/admin" },
              { value: "hidden", label: `Hidden [${stats.hiddenProfiles}]`, href: "/admin?show=hidden" },
            ].map((option) => (
              <li key={option.value}>
                <Link
                  href={option.href}
                  aria-current={filter === option.value ? "page" : undefined}
                  className="press inline-flex min-h-11 items-center border border-ink/15 bg-white px-4 font-mono text-[11px] uppercase tracking-wide outline-none transition-colors hover:border-ink/40 focus-visible:ring-2 focus-visible:ring-ink aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-white"
                >
                  {option.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {profiles.length === 0 ? (
          <div className="mt-4 border border-dashed border-ink/20 px-4 py-5">
            <p className="font-medium">{filter === "hidden" ? "No hidden pages" : "No student pages yet"}</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              {filter === "hidden"
                ? "Pages you hide appear here, with the reason, so you can restore them."
                : "Pages appear here as soon as students create them."}
            </p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-3">
            {profiles.map((profile) => (
              <li key={profile.handle}>
                <ProfileRow profile={profile} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
