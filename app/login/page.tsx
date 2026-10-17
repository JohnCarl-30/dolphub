import type { Metadata } from "next";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in", robots: PRIVATE_ROBOTS };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Use your PCU email. We&apos;ll send you a link, no password needed.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
