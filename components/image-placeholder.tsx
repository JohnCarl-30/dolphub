import { initialsFor } from "./profile-avatar";

/** Stands in for a missing project or cover photo: a short dotted band with the name's initials, so photo-less cards still look finished instead of showing a tall empty box. */
export function ImagePlaceholder({ name, className = "border-y" }: { name: string; className?: string }) {
  return (
    <div aria-hidden="true" className={`image-placeholder flex h-24 items-center justify-between border-ink/10 px-4 sm:h-28 ${className}`}>
      <span className="text-4xl font-medium tracking-tight text-ink/70">{initialsFor(name)}</span>
      <span className="bg-background px-1 font-mono text-[11px] uppercase tracking-wide text-muted">No photo yet</span>
    </div>
  );
}
