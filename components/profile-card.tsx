import Link from "next/link";
import { courseById, type MockProfile } from "@/lib/mock-profiles";

export function ProfileCard({
  profile,
  index,
  preview = false,
}: {
  profile: MockProfile;
  index: number;
  preview?: boolean;
}) {
  const course = courseById(profile.courseId);
  const number = String(index).padStart(3, "0");

  return (
    <Link
      href={`/u/${profile.handle}`}
      className={`group flex h-full flex-col border border-ink/10 bg-paper outline-none transition-colors hover:border-ink focus-visible:ring-2 focus-visible:ring-ink ${preview ? "showcase-card" : ""}`}
    >
      <div className="flex items-center justify-between px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-muted">
        <span>{number}</span>
        <span>{course?.label}</span>
      </div>
      <div className="flex aspect-[16/10] items-center justify-center border-y border-ink/10 bg-white text-muted">
        <span className="font-mono text-[11px] uppercase tracking-wide">Image slot</span>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 py-5">
        <h2 className="text-2xl font-medium tracking-tight">{profile.displayName}</h2>
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
          {course?.name}
        </p>
        <p className="text-sm leading-6 text-muted">{profile.tagline}</p>
        {preview && profile.projects[0] ? (
          <div className="border-t border-ink/10 pt-3">
            <p className="font-mono text-[10px] uppercase tracking-wide text-muted">Featured project</p>
            <h3 className="mt-1 text-lg font-medium tracking-tight">{profile.projects[0].title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted">{profile.projects[0].description}</p>
          </div>
        ) : null}
        <p className="mt-auto font-mono text-[11px] uppercase tracking-wide">
          /u/{profile.handle} →
        </p>
      </div>
    </Link>
  );
}

export function FirstCard() {
  return (
    <div className="flex min-h-64 flex-col justify-between border border-dashed border-ink/30 bg-paper px-4 py-5">
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
