import { ProjectList } from "@/components/project-list";
import { ProfileAvatar } from "@/components/profile-avatar";
import { REPORT_EMAIL } from "@/components/support-contacts";
import type { PublicProfile } from "@/lib/services/profiles";

export function ProfilePage({
  profile,
  starredProjectIds,
  signedIn,
  isOwner,
}: {
  profile: PublicProfile;
  starredProjectIds: Set<string>;
  signedIn: boolean;
  isOwner: boolean;
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
        /u/{profile.handle}
      </p>
      <div className="mt-3 flex items-start gap-4 sm:gap-6">
        <ProfileAvatar name={profile.displayName} src={profile.profilePicture?.url} className="size-20 shrink-0 sm:size-24" />
        <div className="min-w-0">
          <h1 className="text-5xl font-medium tracking-tight">{profile.displayName}</h1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-muted">
            {profile.courseName}
          </p>
        </div>
      </div>
      {profile.tagline ? (
        <p className="mt-6 max-w-xl text-lg leading-8 text-muted">{profile.tagline}</p>
      ) : null}
      <ContactLinks profile={profile} />

      <section className="mt-14">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/projects</p>
        <h2 className="mt-2 text-2xl font-medium tracking-tight">Projects</h2>
        <div className="mt-6">
          <ProjectList projects={profile.projects} starredProjectIds={starredProjectIds} signedIn={signedIn} isOwner={isOwner} />
        </div>
      </section>

      <p className="mt-12 border-t border-ink/10 pt-5 text-sm leading-6 text-muted">
        Fake page, copied work, or something that should not be here?{" "}
        <a
          href={`mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(`Report a student page: ${profile.handle}`)}`}
          className={inlineLink}
        >
          Report this page
        </a>
        .
      </p>
    </article>
  );
}

const inlineLink =
  "font-medium text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-ink focus-visible:ring-2 focus-visible:ring-ink";
const primaryLink =
  "press inline-flex min-h-11 items-center border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white outline-none hover:border-ink/85 hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-ink";
const secondaryLink =
  "press inline-flex min-h-11 items-center border border-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wide outline-none hover:bg-paper focus-visible:ring-2 focus-visible:ring-ink";

function ContactLinks({ profile }: { profile: PublicProfile }) {
  const github = profile.githubUsername;
  const email = profile.contactEmail;

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
