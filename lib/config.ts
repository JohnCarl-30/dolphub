import { z } from "zod";

const list = z
  .string()
  .min(1)
  .transform((s) =>
    s
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean),
  );

const envSchema = z.object({
  DATABASE_URL: z.url(),
  /** Comma-separated, for example "pcu.edu.ph". Exact domain match only. */
  PCU_EMAIL_DOMAINS: list,
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),
  R2_PUBLIC_BASE_URL: z.url().transform((u) => u.replace(/\/+$/, "")),
});

export type Config = z.infer<typeof envSchema>;

/** Reads and checks environment variables. Errors name the variables, never their values. */
export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((i) => i.path.join(".")))];
    throw new Error(`Missing or invalid environment variables: ${names.join(", ")}`);
  }
  return result.data;
}
