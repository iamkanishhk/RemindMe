import { createPublicKey, verify } from 'node:crypto';

export interface WebhookHeaders {
  'telnyx-signature-ed25519'?: string;
  'telnyx-timestamp'?: string;
}

function getHeader(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const v = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(v) ? v[0] : v;
}

export function verifyTelnyxSignature(
  rawBody: string,
  headers: Record<string, string | string[] | undefined>,
  publicKeyBase64: string,
  maxAgeSeconds = 300
): boolean {
  const signature = getHeader(headers, 'telnyx-signature-ed25519');
  const timestamp = getHeader(headers, 'telnyx-timestamp');
  if (!signature || !timestamp) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > maxAgeSeconds) return false;

  let signatureBuf: Buffer;
  try {
    signatureBuf = Buffer.from(signature, 'base64');
    if (signatureBuf.length !== 64) return false;
  } catch {
    return false;
  }

  let publicKey: Buffer;
  try {
    publicKey = Buffer.from(publicKeyBase64, 'base64');
    if (publicKey.length !== 32) return false;
  } catch {
    return false;
  }

  // Telnyx publishes the raw 32-byte ed25519 public key; wrap it into SPKI.
  const spki = Buffer.concat([
    Buffer.from('302a300506032b6570032100', 'hex'),
    publicKey
  ]);

  const signedData = Buffer.from(`${timestamp}|${rawBody}`, 'utf8');

  try {
    const keyObject = createPublicKey({ key: spki, format: 'der', type: 'spki' });
    return verify(null, signedData, keyObject, signatureBuf);
  } catch {
    return false;
  }
}