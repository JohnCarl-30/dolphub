"use client";

import { COURSES } from "@/lib/mock-profiles";

/** The course names at display size are the filter. The chosen one is in ink, the rest in muted. */
export function CourseFilter({
  value,
  counts,
  onChange,
}: {
  value: string | null;
  counts: Record<string, number>;
  onChange: (courseId: string | null) => void;
}) {
  const allCount = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const options = [
    { id: null, label: "Everyone", count: allCount },
    ...COURSES.map((course) => ({
      id: course.id,
      label: course.label,
      count: counts[course.id] ?? 0,
    })),
  ];

  return (
    <div role="group" aria-label="Filter by course" className="flex flex-wrap items-baseline gap-x-[0.5em] gap-y-1 text-words font-medium">
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.label}
            type="button"
            data-filter
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={`press text-left outline-none focus-visible:ring-2 focus-visible:ring-ink ${
              selected ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {option.label}
            <span className="ml-[0.2em] align-top text-[0.4em] font-normal" aria-label={`${option.count} published`}>
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
