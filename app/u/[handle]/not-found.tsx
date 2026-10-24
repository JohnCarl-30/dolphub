import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/u</p>
      <h1 className="mt-3 text-4xl font-medium tracking-tight">No page for this handle.</h1>
      <p className="mt-4 text-sm leading-6 text-muted">
        Check the spelling of the link. Handles never change, so an old link still works unless the page was taken
        down.
      </p>
      <Link
        href="/home"
        className="mt-8 inline-block font-mono text-[11px] uppercase tracking-wide outline-none transition-colors hover:text-muted focus-visible:ring-2 focus-visible:ring-ink"
      >
        ← Back to students
      </Link>
    </section>
  );
}
