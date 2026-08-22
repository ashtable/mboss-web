import { createVerify } from 'node:crypto';

/**
 * The SendGrid Event Webhook signs the timestamp
 * header concatenated directly in front of the raw
 * request body — no separator — with ECDSA over
 * P-256 and SHA-256. The dashboard hands out the
 * public key as base64 DER SPKI, which is exactly
 * what `node:crypto` accepts, so there is no need
 * for the provider's helper and the third-party
 * ECDSA implementation it brings with it.
 *
 * The bytes must be the ones that arrived. Parsing
 * to JSON and re-serialising before verifying
 * changes key order and whitespace and quietly
 * breaks the check, which is why the handler reads
 * the body as text first.
 *
 * Anything malformed answers false rather than
 * throwing: a handler that throws on garbage
 * answers 500, and the provider retries the same
 * garbage forever.
 */
export function verifySendGridSignature(input: {
  publicKeyDer: string;
  rawBody: string;
  signature: string;
  timestamp: string;
}): boolean {
  try {
    const verifier = createVerify('SHA256');
    verifier.update(input.timestamp + input.rawBody);
    verifier.end();
    return verifier.verify(
      {
        key: input.publicKeyDer,
        format: 'der',
        type: 'spki',
        encoding: 'base64',
      },
      input.signature,
      'base64',
    );
  } catch {
    return false;
  }
}
