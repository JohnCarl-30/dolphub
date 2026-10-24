import type { PublicProject } from "@/lib/services/profiles";
import { ProjectStar } from "./project-star";

export function ProjectList({
  projects,
  starredProjectIds = new Set<string>(),
  signedIn = false,
  isOwner = false,
}: {
  projects: PublicProject[];
  starredProjectIds?: Set<string>;
  signedIn?: boolean;
  isOwner?: boolean;
}) {
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
          <ProjectImage project={project} />
          <div className="flex flex-col gap-3 px-4 py-5">
            <h3 className="text-xl font-medium tracking-tight">{project.title}</h3>
            <p className="text-sm leading-6 text-muted">{project.description}</p>
            <div className="flex flex-wrap gap-4 font-mono text-[11px] uppercase tracking-wide">
              <ProjectStar
                projectId={project.id}
                count={project.starCount}
                starred={starredProjectIds.has(project.id)}
                canStar={signedIn && !isOwner}
                signedIn={signedIn}
              />
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

function ProjectImage({ project }: { project: PublicProject }) {
  const image = project.images[0];
  if (!image) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center border-y border-ink/10 bg-white">
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted">No image yet</span>
      </div>
    );
  }
  return (
    <div className="aspect-[16/9] overflow-hidden border-y border-ink/10 bg-white">
      {/* Uploads are already re-encoded WebP under 500 KB, so they skip the image optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        width={image.width}
        height={image.height}
        alt={`Screenshot of ${project.title}`}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
