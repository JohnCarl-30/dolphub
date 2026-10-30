"use server";

import { redirect } from "next/navigation";
import { clearSessionCookie, readSessionToken, setDeviceCookie, setSessionCookie } from "@/lib/auth";
import { logError } from "@/lib/log";
import { safeNextPath } from "@/lib/next-path";
import { consumeSignInLink, signOut, trustDevice } from "@/lib/services/auth";
import { ServiceError } from "@/lib/services/errors";
import { getAuthSettings, getServiceContext } from "@/lib/server";

export type VerifyState = { error: string | null };

/** Runs when the student presses the button, not when the link is opened, so mail scanners cannot use up the link. */
export async function verifyAction(_prev: VerifyState, formData: FormData): Promise<VerifyState> {
  const token = String(formData.get("token") ?? "");
  const next = safeNextPath(formData.get("next"));
  try {
    const ctx = await getServiceContext();
    const session = await consumeSignInLink(ctx, getAuthSettings(), token);
    await setSessionCookie(session.sessionToken, session.expiresAt);
    const device = await trustDevice(ctx, session.user.id);
    await setDeviceCookie(device.deviceToken, device.expiresAt);
  } catch (error) {
    if (error instanceof ServiceError) return { error: error.message };
    logError("Sign-in", error);
    return { error: "Something went wrong. Please try again." };
  }
  redirect(next ?? "/dashboard");
}

export async function signOutAction(): Promise<void> {
  await signOut(await getServiceContext(), await readSessionToken());
  await clearSessionCookie();
  redirect("/");
}
