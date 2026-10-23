"use server";

import { redirect } from "next/navigation";
import { setSessionCookie } from "@/lib/auth";
import { logError } from "@/lib/log";
import { safeNextPath } from "@/lib/next-path";
import { getClientIp } from "@/lib/request-ip";
import { requestSignInLink } from "@/lib/services/auth";
import { ServiceError } from "@/lib/services/errors";
import { mockAdminEnabled, signInMockAdmin } from "@/lib/services/mock-admin";
import { getAuthSettings, getEmailSender, getServiceContext } from "@/lib/server";

export type LoginState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string; email: string };

export async function requestLinkAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const next = safeNextPath(formData.get("next"));
  try {
    const result = await requestSignInLink(
      await getServiceContext(),
      getEmailSender(),
      getAuthSettings(),
      email,
      await getClientIp(),
      next,
    );
    return { status: "sent", email: result.email };
  } catch (error) {
    // Returned so the form can show what was typed. React resets forms after an action.
    if (error instanceof ServiceError) return { status: "error", message: error.message, email };
    logError("Sign-in link request", error);
    return { status: "error", message: "Something went wrong. Please try again.", email };
  }
}

export type MockAdminState = { error: string | null };

/** Local development only: signs in as admin@pcu.edu.ph with a fixed password. Refuses everywhere else. */
export async function mockAdminSignInAction(_prev: MockAdminState, formData: FormData): Promise<MockAdminState> {
  if (!mockAdminEnabled(process.env)) return { error: "The mock admin only works in local development." };
  try {
    const session = await signInMockAdmin(await getServiceContext(), {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    await setSessionCookie(session.sessionToken, session.expiresAt);
  } catch (error) {
    if (error instanceof ServiceError) return { error: error.message };
    logError("Mock admin sign-in", error);
    return { error: "Something went wrong. Please try again." };
  }
  redirect("/admin");
}
