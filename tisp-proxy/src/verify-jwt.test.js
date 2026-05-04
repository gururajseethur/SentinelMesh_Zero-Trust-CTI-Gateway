import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'node:http';
import { generateKeyPairSync, createPublicKey } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createVerifier } from './verify-jwt.js';

// ─── Key material (generated once for the full suite) ────────────────────────
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const KID = 'tisp-test-key-1';
const PORT = 19876;
const ISSUER = `http://127.0.0.1:${PORT}/realms/tisp`;
const AUDIENCE = 'tisp-dashboard';

// ─── JWKS served from the public key ─────────────────────────────────────────
const jwkPublic = {
  ...createPublicKey(publicKey).export({ format: 'jwk' }),
  kid: KID,
  use: 'sig',
  alg: 'RS256',
};
const JWKS_BODY = JSON.stringify({ keys: [jwkPublic] });
const JWKS_PATH = '/realms/tisp/protocol/openid-connect/certs';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function signValid(overrides = {}) {
  return jwt.sign(
    { sub: 'u1', preferred_username: 'analyst01', ...overrides },
    privateKey,
    { algorithm: 'RS256', expiresIn: '1h', issuer: ISSUER, audience: AUDIENCE, keyid: KID },
  );
}

let jwksServer;
let verifyToken;

beforeAll(async () => {
  jwksServer = createServer((req, res) => {
    if (req.url === JWKS_PATH) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JWKS_BODY);
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  await new Promise((resolve) => jwksServer.listen(PORT, '127.0.0.1', resolve));

  verifyToken = createVerifier({
    jwksUri: `http://127.0.0.1:${PORT}${JWKS_PATH}`,
    issuer: ISSUER,
    audience: AUDIENCE,
  });
});

afterAll(async () => {
  await new Promise((resolve) => jwksServer.close(resolve));
});

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('verify-jwt — cryptographic enforcement', () => {
  it('SEC-01: valid RS256 JWT passes verification', async () => {
    const token = signValid();
    const payload = await verifyToken(token);
    expect(payload.sub).toBe('u1');
    expect(payload.preferred_username).toBe('analyst01');
  });

  it('SEC-02: expired token → 401', async () => {
    // exp set to 1 hour in the past via manual claim
    const token = jwt.sign(
      { sub: 'u1', exp: Math.floor(Date.now() / 1000) - 3600 },
      privateKey,
      { algorithm: 'RS256', issuer: ISSUER, audience: AUDIENCE, keyid: KID },
    );
    await expect(verifyToken(token)).rejects.toMatchObject({ status: 401 });
  });

  it('SEC-03: wrong issuer → 401', async () => {
    const token = jwt.sign(
      { sub: 'u1' },
      privateKey,
      {
        algorithm: 'RS256',
        expiresIn: '1h',
        issuer: 'https://evil.example.com/realms/attacker',
        audience: AUDIENCE,
        keyid: KID,
      },
    );
    await expect(verifyToken(token)).rejects.toMatchObject({ status: 401 });
  });

  it('SEC-04: tampered signature → 401', async () => {
    const token = signValid();
    const parts = token.split('.');
    const sig = parts[2];
    // Corrupt position 5 — inside the second base64url 4-char group where all 6 bits
    // are significant. The last character sits on a padding boundary and may decode
    // to the same bytes; a mid-signature position is unambiguously different bytes.
    parts[2] = sig.slice(0, 5) + (sig[5] === 'A' ? 'B' : 'A') + sig.slice(6);
    await expect(verifyToken(parts.join('.'))).rejects.toMatchObject({ status: 401 });
  });

  it('SEC-05: empty/null/undefined token → 401', async () => {
    await expect(verifyToken('')).rejects.toMatchObject({ status: 401 });
    await expect(verifyToken(null)).rejects.toMatchObject({ status: 401 });
    await expect(verifyToken(undefined)).rejects.toMatchObject({ status: 401 });
  });

  it('SEC-06: HS256 token (no kid in header) → 401', async () => {
    // HS256 tokens typically carry no kid — our verifier rejects on missing kid
    // before attempting JWKS lookup, so a symmetric-signed forgery can never pass.
    const token = jwt.sign(
      { sub: 'u1' },
      'supersecret',
      { algorithm: 'HS256', expiresIn: '1h', issuer: ISSUER, audience: AUDIENCE },
    );
    await expect(verifyToken(token)).rejects.toMatchObject({ status: 401 });
  });

  it('SEC-07: structurally invalid string → 401', async () => {
    await expect(verifyToken('not.a.jwt')).rejects.toMatchObject({ status: 401 });
    await expect(verifyToken('Bearer abc123')).rejects.toMatchObject({ status: 401 });
  });
});
