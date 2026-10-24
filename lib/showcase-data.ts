/** What the signed-in `/home` showcase needs from the server. Plain data, safe to pass to client components. */
export interface ShowcaseCard {
  handle: string;
  displayName: string;
  tagline: string;
  courseName: string;
  coverImageUrl: string | null;
  featuredProject: { title: string; description: string };
}

export interface ShowcaseCourse {
  name: string;
  label: string;
}

export interface Showcase {
  cards: ShowcaseCard[];
  courses: ShowcaseCourse[];
}

/** Cards in one course, or every card when no course is chosen. */
export function cardsInCourse(cards: ShowcaseCard[], courseName: string | null): ShowcaseCard[] {
  return courseName ? cards.filter((card) => card.courseName === courseName) : cards;
}
