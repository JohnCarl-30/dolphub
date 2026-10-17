"use client";

import { ProjectList } from "@/components/project-list";
import { useMockStore } from "@/components/mock-store";
import { courseName, getPublicProfile } from "@/lib/mock-profiles";
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
          className="mt-8 inline-block font-mono text-[11px] uppercase tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-ink"
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
      {profile.messengerUrl ? (
        <a
          href={profile.messengerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ink"
        >
          Message on Messenger
        </a>
      ) : (
        <p className="mt-8 text-sm text-muted">No Messenger link on this page.</p>
      )}

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
