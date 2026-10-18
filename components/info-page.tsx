import type { ReactNode } from "react";

export function InfoPage({
  path,
  title,
  intro,
  children,
}: {
  path: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="border-b border-ink/10 pb-8">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">{path}</p>
        <h1 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted">{intro}</p>
        <p className="mt-5 font-mono text-[11px] uppercase tracking-wide text-muted">
          Last updated · October 18, 2026
        </p>
      </header>
      <div className="mt-10 space-y-10">{children}</div>
    </article>
  );
}

export function InfoSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-2xl font-medium tracking-tight">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-base leading-7 text-muted">{children}</div>
    </section>
  );
}

export function InfoList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5 marker:text-ink">{children}</ul>;
}
