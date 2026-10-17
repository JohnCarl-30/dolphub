import type { Metadata } from "next";
import { Suspense } from "react";
import { signOutAction } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard · PCU Community" };

export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4">
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <Account />
      </Suspense>
    </main>
  );
}

/** Placeholder until the profile editor is built. */
async function Account() {
  const user = await requireUser();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">You&apos;re signed in</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400" data-testid="signed-in-email">
          {user.email}
        </p>
      </div>
      <form action={signOutAction}>
        <button
          type="submit"
          className="h-12 w-full rounded-lg border border-zinc-300 text-base font-medium dark:border-zinc-700"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
