import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-3xl font-semibold">PCU Community</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Portfolio pages for PCU tech students. Coming soon.
        </p>
      </div>
      <Link
        href="/login"
        className="flex h-12 items-center justify-center rounded-lg bg-zinc-900 text-base font-medium text-white dark:bg-white dark:text-zinc-900"
      >
        Sign in
      </Link>
    </main>
  );
}
