import Link from "next/link";
import { courseLabel } from "@/lib/course-labels";
import type { ShowcaseCard } from "@/lib/showcase-data";
import { ImagePlaceholder } from "./image-placeholder";

export function ProfileCard({
  profile,
  index,
  preview = false,
}: {
  profile: ShowcaseCard;
  index: number;
  preview?: boolean;
}) {
  const number = String(index).padStart(3, "0");

  return (
    <Link
      href={`/u/${profile.handle}`}
      className={`press group flex h-full flex-col border border-ink/10 bg-white outline-none hover:border-ink focus-visible:ring-2 focus-visible:ring-ink ${preview ? "showcase-card" : ""}`}
    >
      <div className="flex items-center justify-between px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-muted">
        <span>{number}</span>
        <span>{courseLabel(profile.courseName)}</span>
      </div>
      {profile.coverImageUrl ? (
        <div className="aspect-[16/10] overflow-hidden border-y border-ink/10 bg-white">
          {/* Uploads are already re-encoded WebP under 500 KB, so they skip the image optimizer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={profile.coverImageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </div>
      ) : (
        <ImagePlaceholder name={profile.displayName} />
      )}
      <div className="flex flex-1 flex-col gap-3 px-4 py-5">
        <h2 className="text-2xl font-medium tracking-tight">{profile.displayName}</h2>
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
          {profile.courseName}
        </p>
        <p className="text-sm leading-6 text-muted">{profile.tagline}</p>
        {preview ? (
          <div className="border-t border-ink/10 pt-3">
            <p className="font-mono text-[10px] uppercase tracking-wide text-muted">Featured project</p>
            <h3 className="mt-1 text-lg font-medium tracking-tight">{profile.featuredProject.title}</h3>
            {profile.featuredProject.description ? (
              <p className="mt-1 text-sm leading-6 text-muted">{profile.featuredProject.description}</p>
            ) : null}
          </div>
        ) : null}
        <p className="mt-auto font-mono text-[11px] uppercase tracking-wide transition-colors group-hover:text-muted">
          /u/{profile.handle} →
        </p>
      </div>
    </Link>
  );
}

export function FirstCard() {
  return (
    <div className="flex min-h-64 flex-col justify-between border border-dashed border-ink/30 bg-white px-4 py-5">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">000</p>
      <div>
        <h2 className="text-2xl font-medium tracking-tight">Be the first</h2>
        <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
          No published page in this filter yet. Add a project on the dashboard and it shows up
          here.
        </p>
      </div>
    </div>
  );
}
