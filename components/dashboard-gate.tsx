import Link from "next/link";
import { GoogleMark } from "./google-mark";

/** Messages for /dashboard?signin=<reason>, set by the Google callback route. */
const PROBLEMS: Record<string, string> = {
  cancelled: "Google sign-in was cancelled. Try again when you are ready.",
  expired: "That sign-in took too long or was already used. Please try again.",
  "not-pcu": "That Google account is not a PCU address. Choose your @pcu.edu.ph account.",
  frozen: "New signups are paused. Please try again later.",
  unavailable: "Google sign-in is not available right now. Get a sign-in link by email instead.",
  failed: "Google sign-in did not finish. Please try again.",
};

/** The landing shown at /dashboard before sign-in. The button goes to the /auth/google route. */
export function DashboardGate({ problem }: { problem: string | null }) {
  const error = problem ? (PROBLEMS[problem] ?? PROBLEMS.failed!) : null;

  return (
    // The shell already renders <main>; a second one would give screen readers two landmarks.
    <section className="mx-auto w-full max-w-md px-4 py-16 sm:py-24">
      <p className="rise font-mono text-[11px] uppercase tracking-wide text-muted">/dashboard</p>
      <h1 className="rise mt-3 text-4xl font-medium tracking-tight" style={{ "--i": 1 } as React.CSSProperties}>
        Your page starts here
      </h1>
      <p className="rise mt-3 text-sm leading-6 text-muted" style={{ "--i": 2 } as React.CSSProperties}>
        Sign in with your PCU Google account to set up your page, add projects and share one link.
      </p>

      <div className="rise mt-8 flex flex-col gap-3" style={{ "--i": 3 } as React.CSSProperties}>
        {/* A plain link: /auth/google is a route handler that redirects to Google. */}
        <a
          href="/auth/google"
          aria-describedby="google-hint"
          className="press flex h-12 items-center justify-center gap-3 border border-ink bg-ink font-mono text-[11px] uppercase tracking-wide text-white outline-none hover:border-ink/85 hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-ink"
        >
          <span className="grid size-6 place-items-center rounded-full bg-white">
            <GoogleMark className="size-3.5" />
          </span>
          Continue with Google
        </a>
        <p id="google-hint" className="text-sm leading-6 text-muted">
          Use your @pcu.edu.ph account. Personal Gmail addresses cannot sign in.
        </p>
        {error ? (
          <p role="alert" className="rise border border-ink/10 bg-paper p-4 text-sm leading-6">
            {error}
          </p>
        ) : null}
        <Link href="/login" className="text-sm underline underline-offset-4 transition-colors hover:text-muted">
          Get a sign-in link by email instead
        </Link>
      </div>
    </section>
  );
}
