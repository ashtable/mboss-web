/**
 * A complete, valid environment. `readEnv` fails
 * loud and total, so every test that reaches
 * `serverEnv()` needs all of it — seed this in a
 * `beforeAll` and override the one variable the test
 * is actually about.
 */
export const TENANT_ID = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';

export const COMPLETE_ENV = {
  API_BASE_URL: 'http://api:3001',
  WEB_SERVICE_TOKEN: 'dev-web-service-token',
  AUTH_URL: 'http://localhost:3000/api/auth',
  AUTH_SECRET: 'dev-auth-secret',
  AUTH_MICROSOFT_ENTRA_ID_ID: 'dev-client-id',
  AUTH_MICROSOFT_ENTRA_ID_SECRET: 'dev-client-secret',
  AUTH_MICROSOFT_ENTRA_ID_ISSUER: `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
  SENDGRID_WEBHOOK_PUBLIC_KEY: 'dev-webhook-public-key',
  INTERNAL_API_TOKEN: 'dev-internal-api-token',
};

export function seedEnv(overrides: Record<string, string> = {}): void {
  Object.assign(process.env, COMPLETE_ENV, overrides);
}
