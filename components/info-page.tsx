import type { ReactNode } from "react";

export function InfoPage({
  path,
  title,
  intro,
  motion = false,
  children,
}: {
  path: string;
  title: string;
  intro: string;
  motion?: boolean;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="border-b border-ink/10 pb-8">
        <p className={`${motion ? "intro-reveal " : ""}font-mono text-[11px] uppercase tracking-wide text-muted`}>{path}</p>
        <h1 className={`${motion ? "intro-reveal " : ""}mt-3 text-4xl font-medium tracking-tight sm:text-5xl`} style={motion ? ({ "--i": 1 } as React.CSSProperties) : undefined}>{title}</h1>
        <p className={`${motion ? "intro-reveal " : ""}mt-5 max-w-2xl text-base leading-7 text-muted`} style={motion ? ({ "--i": 2 } as React.CSSProperties) : undefined}>{intro}</p>
        <p className={`${motion ? "intro-reveal " : ""}mt-5 font-mono text-[11px] uppercase tracking-wide text-muted`} style={motion ? ({ "--i": 3 } as React.CSSProperties) : undefined}>
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
  motion = false,
  children,
}: {
  id: string;
  title: string;
  motion?: boolean;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={motion ? "viewport-reveal" : undefined}>
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
