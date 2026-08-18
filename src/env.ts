import { z } from 'zod';

/**
 * A URL paths are concatenated onto. A trailing
 * slash would double up in
 * `${API_BASE_URL}/v1/waitlist/signups`, producing
 * a request that looks right in the source and is
 * wrong on the wire.
 */
const baseUrlSchema = z
  .string()
  .min(1)
  .transform((value) => value.replace(/\/+$/, ''));

/**
 * The admin sign-in has to be pinned to one Entra
 * tenant. Entra does not verify the email claim
 * across tenants, so a `common` or `organizations`
 * issuer plus a domain check would admit accounts
 * an attacker controls — and the misconfiguration
 * would look exactly like a working deploy. A
 * tenant GUID in the path is what makes the check
 * real, so nothing else parses.
 */
const issuerSchema = z
  .url()
  .refine(
    (value) =>
      /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(
        new URL(value).pathname.split('/').filter(Boolean)[0] ?? '',
      ),
    'must name one tenant GUID, never common or organizations',
  );

const EnvSchema = z.object({
  API_BASE_URL: baseUrlSchema,
  WEB_SERVICE_TOKEN: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: baseUrlSchema.default('https://mboss.dev'),

  AUTH_SECRET: z.string().min(1),
  AUTH_MICROSOFT_ENTRA_ID_ID: z.string().min(1),
  AUTH_MICROSOFT_ENTRA_ID_SECRET: z.string().min(1),
  AUTH_MICROSOFT_ENTRA_ID_ISSUER: issuerSchema,
  ADMIN_ALLOWED_DOMAIN: z.string().min(1).default('autoretryai.com'),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Throws with every missing or malformed variable
 * named at once. A deploy that is short two
 * variables should learn both on the first boot
 * rather than one per restart.
 */
export function readEnv(source: Record<string, string | undefined>): Env {
  const result = EnvSchema.safeParse(source);
  if (result.success) return result.data;

  const problems = result.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`invalid environment: ${problems}`);
}

let cached: Env | undefined;

/**
 * The parsed environment, read on first use rather
 * than at import time: `next build` runs with none
 * of these set, and a module-scope read would turn
 * a missing secret into a failed build instead of a
 * failed request.
 */
export function serverEnv(): Env {
  cached ??= readEnv(process.env);
  return cached;
}
