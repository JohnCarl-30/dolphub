import { z } from "zod";

const optional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

const envSchema = z
  .object({
    NODE_ENV: z.string().optional(),
    /** Enables isolated local browser-test infrastructure. Never set in a deployment. */
    E2E_TEST: z.enum(["1"]).optional(),
    /** Neon connection string, or pglite:<folder> for local development. */
    DATABASE_URL: z
      .string()
      .min(1)
      .refine(
        (v) => /^postgres(ql)?:\/\//.test(v) || v.startsWith("pglite:"),
        "must be a postgres:// URL or pglite:<folder>",
      ),
    /** Public origin used in emailed links. */
    APP_URL: z
      .url()
      .default("http://localhost:3000")
      .transform((u) => u.replace(/\/+$/, "")),
    /** Comma-separated, exact domain match, for example "pcu.edu.ph". */
    PCU_EMAIL_DOMAINS: z
      .string()
      .min(1)
      .transform((s) =>
        s
          .split(",")
          .map((d) => d.trim().toLowerCase())
          .filter(Boolean),
      ),
    RESEND_API_KEY: optional,
    EMAIL_FROM: z.string().trim().min(3).default("PCU Community <login@dolphub.tech>"),
    DAILY_EMAIL_CAP: z.coerce.number().int().positive().default(90),
    /** Sign-in links one network may request per hour. */
    SIGNIN_LINKS_PER_NETWORK_PER_HOUR: z.coerce.number().int().positive().default(30),
    /** Key for hashing requester networks. Falls back to one derived from DATABASE_URL. */
    RATE_LIMIT_SECRET: optional.pipe(z.string().min(16, "use at least 16 characters").optional()),
    /** Google OAuth client for "Continue with Google". Optional: email links work without it. */
    GOOGLE_CLIENT_ID: optional,
    GOOGLE_CLIENT_SECRET: optional,
    R2_ACCOUNT_ID: optional,
    R2_ACCESS_KEY_ID: optional,
    R2_SECRET_ACCESS_KEY: optional,
    R2_BUCKET: optional,
    R2_PUBLIC_BASE_URL: optional.pipe(z.url().optional()).transform((u) => u?.replace(/\/+$/, "")),
  })
  .superRefine((env, ctx) => {
    const r2 = [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET",
      "R2_PUBLIC_BASE_URL",
    ] as const;
    const setCount = r2.filter((k) => env[k]).length;
    if (setCount > 0 && setCount < r2.length) {
      for (const k of r2) if (!env[k]) ctx.addIssue({ code: "custom", path: [k], message: "set all R2 variables or none" });
    }
    if (!env.GOOGLE_CLIENT_ID !== !env.GOOGLE_CLIENT_SECRET) {
      for (const k of ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] as const)
        if (!env[k]) ctx.addIssue({ code: "custom", path: [k], message: "set both Google variables or neither" });
    }
    if (env.NODE_ENV === "production" && env.E2E_TEST !== "1") {
      if (!env.RESEND_API_KEY) ctx.addIssue({ code: "custom", path: ["RESEND_API_KEY"], message: "required in production" });
      if (setCount === 0) for (const k of r2) ctx.addIssue({ code: "custom", path: [k], message: "required in production" });
      if (env.DATABASE_URL.startsWith("pglite:")) ctx.addIssue({ code: "custom", path: ["DATABASE_URL"], message: "pglite is for development only" });
      if (!env.APP_URL.startsWith("https://")) ctx.addIssue({ code: "custom", path: ["APP_URL"], message: "must be https in production" });
    }
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
