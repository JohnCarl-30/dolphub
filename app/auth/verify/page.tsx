import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = {
  title: "Sign in",
  // The URL holds the sign-in token, so never send it to another site.
  referrer: "no-referrer",
  robots: PRIVATE_ROBOTS,
};

export default function VerifyPage(props: PageProps<"/auth/verify">) {
  return (
    <section className="mx-auto w-full max-w-md px-4 py-16 sm:py-24">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/login</p>
      <h1 className="mt-3 text-4xl font-medium tracking-tight">One more step</h1>
      <p className="mt-3 text-sm leading-6 text-muted">Press the button to finish signing in.</p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
          <Verify searchParams={props.searchParams} />
        </Suspense>
      </div>
    </section>
  );
}

async function Verify({ searchParams }: { searchParams: PageProps<"/auth/verify">["searchParams"] }) {
  const { token } = await searchParams;
  if (typeof token !== "string" || !token) {
    return (
      <p className="text-sm leading-6">
        This link is incomplete.{" "}
        <Link href="/login" className="underline underline-offset-4 transition-colors hover:text-muted">
          Request a new one
        </Link>
        .
      </p>
    );
  }
  return <VerifyForm token={token} />;
}
