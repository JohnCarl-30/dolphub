"use client";

import { ProjectList } from "@/components/project-list";
import { useMockStore } from "@/components/mock-store";
import { courseName, getPublicProfile, type MockProfile } from "@/lib/mock-profiles";
import Link from "next/link";

export function ProfilePage({ handle }: { handle: string }) {
  const { profiles } = useMockStore();
  const profile = getPublicProfile(profiles, handle);

  if (!profile) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/u/{handle}</p>
        <h1 className="mt-3 text-4xl font-medium tracking-tight">No page for this handle.</h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          That student is not in this mock, or the handle was changed in the dashboard.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block font-mono text-[11px] uppercase tracking-wide outline-none transition-colors hover:text-muted focus-visible:ring-2 focus-visible:ring-ink"
        >
          ← Back to students
        </Link>
      </section>
    );
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
        /u/{profile.handle}
      </p>
      <h1 className="mt-3 text-5xl font-medium tracking-tight">{profile.displayName}</h1>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-muted">
        {courseName(profile.courseId)}
      </p>
      <p className="mt-6 max-w-xl text-lg leading-8 text-muted">{profile.tagline}</p>
      <ContactLinks profile={profile} />

      <section className="mt-14">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/projects</p>
        <h2 className="mt-2 text-2xl font-medium tracking-tight">Projects</h2>
        <div className="mt-6">
          <ProjectList projects={profile.projects} />
        </div>
      </section>
    </article>
  );
}

const primaryLink =
  "press inline-flex min-h-11 items-center border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white outline-none hover:border-ink/85 hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-ink";
const secondaryLink =
  "press inline-flex min-h-11 items-center border border-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wide outline-none hover:bg-paper focus-visible:ring-2 focus-visible:ring-ink";

function ContactLinks({ profile }: { profile: MockProfile }) {
  // Older saved mock data may not have the newer fields.
  const github = profile.githubUsername ?? null;
  const email = profile.contactEmail ?? null;

  if (!profile.messengerUrl && !github && !email) {
    return <p className="mt-8 text-sm text-muted">No contact links on this page.</p>;
  }

  return (
    <ul className="mt-8 flex flex-wrap gap-3">
      {profile.messengerUrl ? (
        <li>
          <a href={profile.messengerUrl} target="_blank" rel="noopener noreferrer" className={primaryLink}>
            Message on Messenger
          </a>
        </li>
      ) : null}
      {github ? (
        <li>
          <a
            href={`https://github.com/${github}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`GitHub: ${github}`}
            className={secondaryLink}
          >
            GitHub
          </a>
        </li>
      ) : null}
      {email ? (
        <li>
          <a
            href={`mailto:${email}`}
            aria-label={`Email ${profile.displayName}`}
            className={secondaryLink}
          >
            Email
          </a>
        </li>
      ) : null}
    </ul>
  );
}
