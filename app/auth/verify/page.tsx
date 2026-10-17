import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = {
  title: "Sign in · PCU Community",
  // The URL holds the sign-in token, so never send it to another site.
  referrer: "no-referrer",
  robots: { index: false },
};

export default function VerifyPage(props: PageProps<"/auth/verify">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold">One more step</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">Press the button to finish signing in.</p>
      </div>
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <Verify searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function Verify({ searchParams }: { searchParams: PageProps<"/auth/verify">["searchParams"] }) {
  const { token } = await searchParams;
  if (typeof token !== "string" || !token) {
    return (
      <p>
        This link is incomplete.{" "}
        <Link href="/login" className="underline">
          Request a new one
        </Link>
        .
      </p>
    );
  }
  return <VerifyForm token={token} />;
}
