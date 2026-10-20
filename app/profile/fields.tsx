export function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  // The hint describes the field; it must not become part of its name.
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="font-mono text-[11px] uppercase tracking-wide text-muted">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-xs leading-5 text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "w-full border border-ink/15 bg-white px-3 py-2 text-base outline-none transition-colors hover:border-ink/40 focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink aria-[invalid=true]:border-red-700";

export const submitClass =
  "press h-12 border border-ink bg-ink font-mono text-[11px] uppercase tracking-wide text-white outline-none hover:border-ink/85 hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-60";

/** Moves focus to the field an error names, after React has marked it invalid. */
export function focusField(id: string) {
  requestAnimationFrame(() => document.getElementById(id)?.focus());
}

/** Keyed so a repeated message rises in again instead of silently staying put. */
export function FormMessages({ error, notice }: { error: string | null; notice: string | null }) {
  return (
    <>
      {error ? <p key={error} role="alert" className="rise text-sm text-red-700">{error}</p> : null}
      {notice ? <p key={notice} role="status" className="rise text-sm text-ink">{notice}</p> : null}
    </>
  );
}
