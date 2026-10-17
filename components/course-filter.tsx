"use client";

import { COURSES } from "@/lib/mock-profiles";
import { motion } from "motion/react";
import { useMotionEnvironment } from "./animations/use-motion-environment";

export function CourseFilter({
  value,
  counts,
  onChange,
}: {
  value: string | null;
  counts: Record<string, number>;
  onChange: (courseId: string | null) => void;
}) {
  const { reducedMotion } = useMotionEnvironment();
  const allCount = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const options = [
    { id: null, label: "All", count: allCount },
    ...COURSES.map((course) => ({
      id: course.id,
      label: course.label,
      count: counts[course.id] ?? 0,
    })),
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Filter</p>
      <div
        role="tablist"
        aria-label="Course"
        className="flex flex-wrap gap-2"
      >
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <motion.button
              key={option.label}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(option.id)}
              whileHover={reducedMotion ? undefined : { scale: 1.02 }}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                selected
                  ? "border-ink bg-ink text-white"
                  : "border-ink/15 bg-white text-ink hover:border-ink"
              }`}
            >
              {option.label} [{option.count}]
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
