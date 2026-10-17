import Link from "next/link";
import { courseById, type MockProfile } from "@/lib/mock-profiles";

export function ProfileCard({
  profile,
  preview = false,
}: {
  profile: MockProfile;
  index?: number;
  preview?: boolean;
}) {
  const course = courseById(profile.courseId);
  const featured = profile.projects[0];

  return (
    <Link
      href={`/u/${profile.handle}`}
      className={`press group flex h-full flex-col bg-paper outline-none focus-visible:ring-2 focus-visible:ring-ink ${preview ? "showcase-card" : ""}`}
    >
      <div className="flex items-baseline justify-between gap-3 px-5 pt-5 text-note">
        <span className="text-accent transition-colors group-hover:text-ink">/u/{profile.handle}</span>
        <span className="text-muted">{course?.label}</span>
      </div>
      {/* The featured project stands where a photograph will go once students upload one. */}
      <div className="mx-5 mt-5 flex min-h-32 flex-col justify-end bg-white px-4 py-4">
        {featured ? (
          <>
            <p className="text-note text-muted">Featured project</p>
            <p className="mt-1 text-xl font-medium leading-tight">{featured.title}</p>
          </>
        ) : (
          <p className="text-note text-muted">No project yet</p>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 pb-6 pt-5">
        <h3 className="text-2xl font-medium tracking-tight">{profile.displayName}</h3>
        <p className="text-note text-muted">{course?.name}</p>
        <p className="text-lede text-ink">{profile.tagline}</p>
        <p className="mt-auto pt-3 text-note font-medium text-ink">Open the page →</p>
      </div>
    </Link>
  );
}

export function FirstCard() {
  return (
    <div className="flex min-h-64 flex-col justify-between bg-paper px-5 py-6">
      <p className="text-note text-muted">Nobody yet</p>
      <div>
        <h3 className="text-2xl font-medium tracking-tight">Be the first</h3>
        <p className="mt-3 max-w-sm text-lede text-ink">
          No published page in this course yet. Add a project on the dashboard and it shows up here.
        </p>
      </div>
    </div>
  );
}
