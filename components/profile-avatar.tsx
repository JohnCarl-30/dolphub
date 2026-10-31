export function initialsFor(name: string) {
  return name
    .split(/[\s._-]+/)
    // Skip "&" and other symbols so "Lost & Found" reads LF, not L&.
    .filter((part) => /[\p{L}\p{N}]/u.test(part[0]))
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** A square public portrait with a text fallback for students without one. */
export function ProfileAvatar({
  name,
  src,
  className,
}: {
  name: string;
  src: string | null | undefined;
  className: string;
}) {
  if (src) {
    return (
      // Uploads are already re-encoded WebP under 500 KB, so they skip the image optimizer.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`Profile picture of ${name}`}
        className={`border border-ink/15 bg-paper object-cover object-center ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`grid place-items-center border border-ink/15 bg-paper font-mono text-xs font-medium tracking-wide ${className}`}
    >
      {initialsFor(name)}
    </span>
  );
}
