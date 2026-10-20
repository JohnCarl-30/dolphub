"use client";

import type { ShowcaseCourse } from "@/lib/showcase-data";

export function CourseFilter({
  courses,
  value,
  counts,
  onChange,
}: {
  courses: ShowcaseCourse[];
  value: string | null;
  counts: Record<string, number>;
  onChange: (courseName: string | null) => void;
}) {
  const allCount = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const options = [
    { id: null, label: "All", count: allCount },
    ...courses.map((course) => ({
      id: course.name,
      label: course.label,
      count: counts[course.name] ?? 0,
    })),
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Filter</p>
      {/* Toggle buttons, not tabs: there is no tab panel and no arrow-key model. */}
      <div role="group" aria-label="Filter by course" className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.label}
              type="button"
              data-filter
              aria-pressed={selected}
              onClick={() => onChange(option.id)}
              className={`press border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                selected
                  ? "border-ink bg-ink text-white"
                  : "border-ink/15 bg-white text-ink hover:border-ink"
              }`}
            >
              {option.label} [{option.count}]
            </button>
          );
        })}
      </div>
    </div>
  );
}
