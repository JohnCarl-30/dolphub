export const COURSES = [
  { id: "it", label: "IT", name: "BS Information Technology" },
  { id: "cs", label: "CS", name: "BS Computer Science" },
  { id: "cpe", label: "Computer Engineering", name: "BS Computer Engineering" },
] as const;

export type CourseId = (typeof COURSES)[number]["id"];

export type MockProject = {
  id: string;
  title: string;
  description: string;
  demoUrl: string | null;
  sourceUrl: string | null;
};

export type MockProfile = {
  handle: string;
  displayName: string;
  tagline: string;
  courseId: CourseId;
  messengerUrl: string | null;
  githubUsername: string | null;
  contactEmail: string | null;
  projects: MockProject[];
};

/** The dashboard edits this one student for the session. */
export const EDITABLE_HANDLE = "mira";

export const INITIAL_PROFILES: MockProfile[] = [
  {
    handle: "mira",
    displayName: "Mira Santos",
    tagline: "Campus apps for people who still use Messenger.",
    courseId: "it",
    messengerUrl: "https://m.me/mira.santos.pcu",
    githubUsername: "mira-santos",
    contactEmail: "mira.santos@example.com",
    projects: [
      {
        id: "mira-orgs",
        title: "OrgFair",
        description: "A phone-sized directory of PCU student orgs with meeting rooms and join links.",
        demoUrl: "https://example.com/orgfair",
        sourceUrl: "https://github.com/example/orgfair",
      },
      {
        id: "mira-lost",
        title: "Lost & Found locker",
        description: "Photo log of items left at the library desk, searchable by building.",
        demoUrl: null,
        sourceUrl: "https://github.com/example/locker",
      },
    ],
  },
  {
    handle: "kenji",
    displayName: "Kenji Ramos",
    tagline: "Embedded projects that still compile on a lab PC.",
    courseId: "cpe",
    messengerUrl: "https://m.me/kenji.ramos.pcu",
    githubUsername: "kenji-ramos",
    contactEmail: null,
    projects: [
      {
        id: "kenji-gate",
        title: "Lab gate logger",
        description: "RFID check-in for the CpE lab, with a public occupancy page.",
        demoUrl: "https://example.com/lab-gate",
        sourceUrl: "https://github.com/example/lab-gate",
      },
    ],
  },
  {
    handle: "aisha",
    displayName: "Aisha Villanueva",
    tagline: "Small tools for class groups that hate shared drives.",
    courseId: "cs",
    messengerUrl: "https://m.me/aisha.villanueva.pcu",
    githubUsername: null,
    contactEmail: null,
    projects: [
      {
        id: "aisha-notes",
        title: "Section notes",
        description: "A write-once note wall for one CS section, with a public read page.",
        demoUrl: "https://example.com/section-notes",
        sourceUrl: null,
      },
    ],
  },
  {
    handle: "paolo",
    displayName: "Paolo Cruz",
    tagline: "Maps and schedules, nothing fancier than a phone can load.",
    courseId: "it",
    messengerUrl: null,
    githubUsername: null,
    contactEmail: null,
    projects: [
      {
        id: "paolo-jeep",
        title: "Jeep wait",
        description: "Crowd-reported wait times for the common jeepney stops near campus.",
        demoUrl: "https://example.com/jeep-wait",
        sourceUrl: "https://github.com/example/jeep-wait",
      },
    ],
  },
  {
    handle: "lea",
    displayName: "Lea Mendoza",
    tagline: "Still writing the first project.",
    courseId: "cs",
    messengerUrl: "https://m.me/lea.mendoza.pcu",
    githubUsername: null,
    contactEmail: null,
    projects: [],
  },
];

export function courseById(courseId: string) {
  return COURSES.find((course) => course.id === courseId);
}

export function courseName(courseId: string) {
  return courseById(courseId)?.name ?? courseId;
}

export function hasProjects(profile: MockProfile) {
  return profile.projects.length > 0;
}

export function listGridProfiles(profiles: MockProfile[], courseId?: string | null) {
  return profiles.filter(
    (profile) => hasProjects(profile) && (!courseId || profile.courseId === courseId),
  );
}

export function getPublicProfile(profiles: MockProfile[], rawHandle: string) {
  const handle = rawHandle.trim().toLowerCase();
  return profiles.find((profile) => profile.handle === handle) ?? null;
}

export function upsertProfile(profiles: MockProfile[], next: MockProfile, previousHandle: string) {
  return profiles.map((profile) =>
    profile.handle === previousHandle ? next : profile,
  );
}
