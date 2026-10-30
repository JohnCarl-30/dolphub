import Link from "next/link";
import { withNext } from "@/lib/next-path";
import { GoogleMark } from "./google-mark";

/**
 * "Continue with Google" and the email-link fallback. `next` is a path to
 * return to after sign-in; both flows carry it through. Pass `email` to show
 * the email form in place of the link to /login.
 */
export function SignInOptions({
  next,
  children,
  email,
}: {
  next: string | null;
  children?: React.ReactNode;
  email?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* A plain link: /auth/google is a route handler that redirects to Google. */}
      <a
        href={withNext("/auth/google", next)}
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
      {children}
      {email ?? (
        <Link href={withNext("/login", next)} className="text-sm underline underline-offset-4 transition-colors hover:text-muted">
          Get a sign-in link by email instead
        </Link>
      )}
    </div>
  );
}
