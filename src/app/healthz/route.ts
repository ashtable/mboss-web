/**
 * What the container healthcheck and the platform
 * poll. It answers from the process itself and
 * deliberately touches nothing downstream: a web
 * container that is up should report up even while
 * the private API is restarting.
 */
export function GET(): Response {
  return Response.json({ ok: true });
}
