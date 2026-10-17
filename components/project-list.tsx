import type { MockProject } from "@/lib/mock-profiles";

export function ProjectList({ projects }: { projects: MockProject[] }) {
  if (projects.length === 0) {
    return (
      <p className="text-sm leading-6 text-muted">No projects on this page yet.</p>
    );
  }

  return (
    <ol className="grid gap-4">
      {projects.map((project, index) => (
        <li
          key={project.id}
          className="rise border border-ink/10 bg-paper"
          style={{ "--i": Math.min(index, 8) } as React.CSSProperties}
        >
          <div className="flex items-center justify-between px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-muted">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <span>Project</span>
          </div>
          <div className="flex aspect-[16/9] items-center justify-center border-y border-ink/10 bg-white">
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
              Image slot
            </span>
          </div>
          <div className="flex flex-col gap-3 px-4 py-5">
            <h3 className="text-xl font-medium tracking-tight">{project.title}</h3>
            <p className="text-sm leading-6 text-muted">{project.description}</p>
            <div className="flex flex-wrap gap-4 font-mono text-[11px] uppercase tracking-wide">
              {project.demoUrl ? (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="outline-none transition-colors hover:text-muted focus-visible:ring-2 focus-visible:ring-ink"
                >
                  Demo →
                </a>
              ) : null}
              {project.sourceUrl ? (
                <a
                  href={project.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="outline-none transition-colors hover:text-muted focus-visible:ring-2 focus-visible:ring-ink"
                >
                  Source →
                </a>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
