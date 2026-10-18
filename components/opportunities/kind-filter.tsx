import Link from "next/link";
import { OPPORTUNITIES_PATH } from "@/lib/seo";
import { KIND_LABELS, OPPORTUNITY_KINDS, type OpportunityKind } from "@/lib/services/opportunities";

/**
 * Kind filter for /opportunities. Links rather than buttons, so each filter has
 * its own shareable address and works before JavaScript loads.
 */
export function KindFilter({
  value,
  counts,
}: {
  value: OpportunityKind | null;
  counts: Record<OpportunityKind, number>;
}) {
  const total = OPPORTUNITY_KINDS.reduce((sum, kind) => sum + counts[kind], 0);
  const options = [
    { kind: null, label: "All", count: total, href: OPPORTUNITIES_PATH },
    ...OPPORTUNITY_KINDS.map((kind) => ({
      kind,
      label: KIND_LABELS[kind].many,
      count: counts[kind],
      href: `${OPPORTUNITIES_PATH}?kind=${kind}`,
    })),
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Filter</p>
      <nav aria-label="Filter by kind">
        <ul className="flex flex-wrap gap-2">
          {options.map((option) => {
            const selected = value === option.kind;
            return (
              <li key={option.label}>
                <Link
                  href={option.href}
                  scroll={false}
                  aria-current={selected ? "page" : undefined}
                  className={`press inline-block border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink ${
                    selected ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink hover:border-ink"
                  }`}
                >
                  {option.label} [{option.count}]
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
