import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignInOptions } from "@/components/sign-in-options";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/next-path";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import { MOCK_ADMIN, mockAdminEnabled } from "@/lib/services/mock-admin";
import { LoginForm } from "./login-form";
import { MockAdminForm } from "./mock-admin-form";

export const metadata: Metadata = { title: "Sign in", robots: PRIVATE_ROBOTS };

export default function LoginPage(props: PageProps<"/login">) {
  return (
    // The shell already renders <main>; a second one would give screen readers two landmarks.
    <section className="mx-auto w-full max-w-md px-4 py-16 sm:py-24">
      <p className="rise font-mono text-[11px] uppercase tracking-wide text-muted">/login</p>
      <h1 className="rise mt-3 text-4xl font-medium tracking-tight" style={{ "--i": 1 } as React.CSSProperties}>
        Sign in
      </h1>
      <p className="rise mt-3 text-sm leading-6 text-muted" style={{ "--i": 2 } as React.CSSProperties}>
        Continue with your PCU Google account, or get a sign-in link by email. No password needed.
      </p>
      <div className="rise mt-8" style={{ "--i": 3 } as React.CSSProperties}>
        <Suspense fallback={<SignInOptions next={null} email={<LoginForm next={null} />} />}>
          <LoginWithNext searchParams={props.searchParams} />
        </Suspense>
      </div>
      {mockAdminEnabled(process.env) ? <MockAdminForm email={MOCK_ADMIN.email} /> : null}
    </section>
  );
}

/** ?next= is where to go after sign-in, for example back to an opportunity. */
async function LoginWithNext({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const next = safeNextPath((await searchParams).next);
  // Already signed in, so there is nothing to email.
  if (await getCurrentUser()) redirect(next ?? "/dashboard");
  return <SignInOptions next={next} email={<LoginForm next={next} />} />;
}
