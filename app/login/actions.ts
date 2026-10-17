"use server";

import { requestSignInLink } from "@/lib/services/auth";
import { ServiceError } from "@/lib/services/errors";
import { getAuthSettings, getEmailSender, getServiceContext } from "@/lib/server";

export type LoginState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string; email: string };

export async function requestLinkAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  try {
    const result = await requestSignInLink(
      await getServiceContext(),
      getEmailSender(),
      getAuthSettings(),
      email,
    );
    return { status: "sent", email: result.email };
  } catch (error) {
    // Returned so the form can show what was typed. React resets forms after an action.
    if (error instanceof ServiceError) return { status: "error", message: error.message, email };
    console.error("Sign-in link request failed", error);
    return { status: "error", message: "Something went wrong. Please try again.", email };
  }
}
