import type { Dashboard } from "./services/dashboard";

/*
 * The /profile editor keeps every field as a string, the way inputs hold them.
 * On save, these helpers work out which profile fields changed and which
 * projects to create, update or delete, so each action gets only what changed.
 */

export interface ProfileFields {
  displayName: string;
  tagline: string;
  courseId: string;
  messengerUrl: string;
  githubUsername: string;
  contactEmail: string;
  searchVisible: boolean;
}

export interface ProjectFields {
  /** Stable React key. Saved projects use their id. */
  key: string;
  /** Null until the project is saved. */
  id: string | null;
  title: string;
  description: string;
  demoUrl: string;
  sourceUrl: string;
}

const PROJECT_TEXT = ["title", "description", "demoUrl", "sourceUrl"] as const;
type ProjectText = (typeof PROJECT_TEXT)[number];

export function profileFields(profile: NonNullable<Dashboard["profile"]>): ProfileFields {
  return {
    displayName: profile.displayName,
    tagline: profile.tagline,
    courseId: String(profile.courseId),
    messengerUrl: profile.messengerUrl ?? "",
    githubUsername: profile.githubUsername ?? "",
    contactEmail: profile.contactEmail ?? "",
    searchVisible: profile.searchVisible,
  };
}

export function projectFields(projects: Dashboard["projects"]): ProjectFields[] {
  return projects.map((p) => ({
    key: p.id,
    id: p.id,
    title: p.title,
    description: p.description,
    demoUrl: p.demoUrl ?? "",
    sourceUrl: p.sourceUrl ?? "",
  }));
}

/** Only the fields that differ, ready for updateProfileAction. Empty when nothing changed. */
export function changedProfileFields(
  saved: ProfileFields,
  draft: ProfileFields,
): Partial<ProfileFields> {
  const changes: Partial<ProfileFields> = {};
  for (const key of Object.keys(saved) as (keyof ProfileFields)[]) {
    if (draft[key] !== saved[key]) Object.assign(changes, { [key]: draft[key] });
  }
  return changes;
}

export interface ProjectPlan {
  create: { key: string; input: Record<ProjectText, string> }[];
  update: { key: string; id: string; input: Partial<Record<ProjectText, string>> }[];
  remove: string[];
}

/** What to send for the projects: new ones, changed fields of saved ones, and saved ones removed from the form. */
export function planProjectSaves(saved: ProjectFields[], draft: ProjectFields[]): ProjectPlan {
  const plan: ProjectPlan = { create: [], update: [], remove: [] };
  const kept = new Set<string>();
  for (const project of draft) {
    const input = Object.fromEntries(PROJECT_TEXT.map((k) => [k, project[k]])) as Record<ProjectText, string>;
    if (!project.id) {
      plan.create.push({ key: project.key, input });
      continue;
    }
    kept.add(project.id);
    const before = saved.find((p) => p.id === project.id);
    const changes = PROJECT_TEXT.filter((k) => !before || before[k] !== project[k]);
    if (changes.length > 0) {
      plan.update.push({
        key: project.key,
        id: project.id,
        input: Object.fromEntries(changes.map((k) => [k, project[k]])),
      });
    }
  }
  for (const project of saved) {
    if (project.id && !kept.has(project.id)) plan.remove.push(project.id);
  }
  return plan;
}

export function hasProfileChanges(changes: Partial<ProfileFields>): boolean {
  return Object.keys(changes).length > 0;
}

export function hasProjectChanges(plan: ProjectPlan): boolean {
  return plan.create.length > 0 || plan.update.length > 0 || plan.remove.length > 0;
}
