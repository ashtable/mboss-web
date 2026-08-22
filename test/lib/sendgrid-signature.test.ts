import { createSign, generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { verifySendGridSignature } from '@/lib/sendgrid-signature';

/**
 * The keypair is generated here, so the suite needs
 * no SendGrid account and holds no committed secret.
 *
 * What this proves is the byte order and the tamper
 * cases. What it cannot prove is the wire format of
 * a key SendGrid itself issues — DER against a raw
 * r|s encoding is exactly the thing that looks right
 * against a fixture and fails against the service.
 * That one needs a real delivery.
 */
const { publicKey, privateKey } = generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
});

const publicKeyDer = publicKey
  .export({ type: 'spki', format: 'der' })
  .toString('base64');

function sign(timestamp: string, rawBody: string, key = privateKey): string {
  const signer = createSign('SHA256');
  signer.update(timestamp + rawBody);
  signer.end();
  return signer.sign(key, 'base64');
}

const TIMESTAMP = '1787000000';
const BODY = '[{"email":"pat@stmarks.org","event":"bounce","timestamp":1}]';

describe('verifySendGridSignature', () => {
  it('accepts a correctly signed payload', () => {
    expect(
      verifySendGridSignature({
        publicKeyDer,
        rawBody: BODY,
        signature: sign(TIMESTAMP, BODY),
        timestamp: TIMESTAMP,
      }),
    ).toBe(true);
  });

  it('rejects a payload with one byte changed', () => {
    expect(
      verifySendGridSignature({
        publicKeyDer,
        rawBody: BODY.replace('pat', 'pau'),
        signature: sign(TIMESTAMP, BODY),
        timestamp: TIMESTAMP,
      }),
    ).toBe(false);
  });

  it('rejects a changed timestamp', () => {
    // Which proves the timestamp really is inside the
    // signed bytes, in front of the body and with
    // nothing between them.
    expect(
      verifySendGridSignature({
        publicKeyDer,
        rawBody: BODY,
        signature: sign(TIMESTAMP, BODY),
        timestamp: '1787000001',
      }),
    ).toBe(false);
  });

  it('rejects a signature from another key', () => {
    const other = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    expect(
      verifySendGridSignature({
        publicKeyDer,
        rawBody: BODY,
        signature: sign(TIMESTAMP, BODY, other.privateKey),
        timestamp: TIMESTAMP,
      }),
    ).toBe(false);
  });

  it('returns false on a malformed signature rather than throwing', () => {
    // A handler that throws on garbage answers 500,
    // and the provider retries the same garbage
    // forever.
    expect(
      verifySendGridSignature({
        publicKeyDer,
        rawBody: BODY,
        signature: 'not-base64-at-all!!',
        timestamp: TIMESTAMP,
      }),
    ).toBe(false);
  });

  it('returns false on a malformed public key rather than throwing', () => {
    expect(
      verifySendGridSignature({
        publicKeyDer: 'nonsense',
        rawBody: BODY,
        signature: sign(TIMESTAMP, BODY),
        timestamp: TIMESTAMP,
      }),
    ).toBe(false);
  });
});
