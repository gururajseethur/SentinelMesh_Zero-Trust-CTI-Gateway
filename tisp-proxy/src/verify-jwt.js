import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';

/**
 * Creates an RS256 JWT verifier backed by a JWKS endpoint.
 *
 * @param {{ jwksUri: string, issuer: string, audience: string }} opts
 * @returns {(token: string) => Promise<object>} — resolves with the decoded payload or throws { status: 401, message }
 */
export function createVerifier({ jwksUri, issuer, audience }) {
  const client = jwksClient({
    jwksUri,
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 10 * 60 * 1000, // 10 min — Keycloak rotates rarely
    timeout: 5000,
  });

  return async function verifyToken(token) {
    if (!token) {
      throw { status: 401, message: 'Missing bearer token' };
    }

    // Decode header to extract kid — full verification happens below.
    let decoded;
    try {
      decoded = jwt.decode(token, { complete: true });
    } catch {
      decoded = null;
    }

    if (!decoded?.header?.kid) {
      throw { status: 401, message: 'Malformed JWT: missing kid header' };
    }

    let signingKey;
    try {
      const key = await client.getSigningKey(decoded.header.kid);
      signingKey = key.getPublicKey();
    } catch (err) {
      throw { status: 401, message: `Unable to retrieve signing key: ${err.message}` };
    }

    try {
      return jwt.verify(token, signingKey, {
        algorithms: ['RS256'], // symmetric (HS256) explicitly excluded
        issuer,
        audience,
      });
    } catch (err) {
      throw { status: 401, message: err.message };
    }
  };
}
