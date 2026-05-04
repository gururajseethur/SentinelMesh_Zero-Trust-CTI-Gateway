import express from 'express';
import { createVerifier } from './verify-jwt.js';

// ─── Startup validation — hard fail if JWT cannot be enforced ─────────────────
// There is no fallback mode. JWT verification is mandatory. If these vars are
// missing, the proxy refuses to start rather than silently weakening auth.
const KEYCLOAK_URL = process.env.KEYCLOAK_URL;
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM;
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID;

if (!KEYCLOAK_URL || !KEYCLOAK_REALM || !KEYCLOAK_CLIENT_ID) {
  console.error('FATAL: KEYCLOAK_URL, KEYCLOAK_REALM, and KEYCLOAK_CLIENT_ID must all be set.');
  console.error('The proxy enforces mandatory RS256 JWT verification. There is no insecure fallback.');
  process.exit(1);
}

const jwksUri = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`;
const issuer = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`;
const verifyJWT = createVerifier({ jwksUri, issuer, audience: KEYCLOAK_CLIENT_ID });

console.log(`JWT verification: RS256/JWKS — ${jwksUri}`);

// ─── Service credential table (server-side only, never sent to browser) ───────
const targets = {
  misp: {
    baseUrl: process.env.MISP_URL ?? 'https://misp:443',
    authorization: process.env.MISP_API_KEY ?? '',
  },
  opencti: {
    baseUrl: process.env.OPENCTI_URL ?? 'http://opencti:4000',
    authorization: process.env.OPENCTI_TOKEN ? `Bearer ${process.env.OPENCTI_TOKEN}` : '',
  },
  thehive: {
    baseUrl: process.env.THEHIVE_URL ?? 'http://thehive:9000',
    authorization: process.env.THEHIVE_API_KEY ? `Bearer ${process.env.THEHIVE_API_KEY}` : '',
  },
};

const app = express();
const port = Number(process.env.TISP_PROXY_PORT ?? 3001);

app.use(express.json({ limit: '10mb' }));

// ─── Request logging ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 400 ? 'WARN' : 'INFO';
    console.log(`${new Date().toISOString()} [${level}] ${req.method} ${req.path} → ${res.statusCode} (${ms}ms)`);
  });
  next();
});

// ─── Rate limiter (100 req / 15 min per IP) ───────────────────────────────────
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 100;
const rateCounts = new Map();

app.use((req, res, next) => {
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  const now = Date.now();
  const entry = rateCounts.get(ip) ?? { count: 0, windowStart: now };

  if (now - entry.windowStart > RATE_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count += 1;
  rateCounts.set(ip, entry);

  if (entry.count > RATE_MAX) {
    res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
    return;
  }
  next();
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, jwtVerification: 'RS256' });
});

app.get('/status', (_req, res) => {
  res.json({
    service: 'SentinelMesh API Gateway',
    version: '1.0.0',
    jwtVerification: 'RS256/JWKS',
    jwksUri: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`,
    upstreams: {
      misp: process.env.MISP_API_KEY ? 'configured' : 'not configured',
      opencti: process.env.OPENCTI_TOKEN ? 'configured' : 'not configured',
      thehive: process.env.THEHIVE_API_KEY ? 'configured' : 'not configured',
    },
    rateLimit: `${RATE_MAX} req / ${RATE_WINDOW_MS / 60000} min / IP`,
  });
});

app.use('/proxy/:service', async (req, res) => {
  const bearer = req.get('authorization') ?? '';
  const token = bearer.startsWith('Bearer ') ? bearer.slice(7).trim() : '';

  if (!token) {
    res.status(401).json({ error: 'Missing or empty bearer token' });
    return;
  }

  try {
    await verifyJWT(token);
  } catch (err) {
    res.status(err.status ?? 401).json({ error: err.message ?? 'Invalid token' });
    return;
  }

  const target = targets[req.params.service];
  if (!target) {
    res.status(404).json({ error: 'Unknown upstream service' });
    return;
  }

  const upstreamPath = req.originalUrl.replace(`/proxy/${req.params.service}`, '') || '/';
  const upstreamUrl = new URL(upstreamPath, target.baseUrl);
  const headers = {
    accept: req.get('accept') ?? 'application/json',
    authorization: target.authorization,
    'content-type': req.get('content-type') ?? 'application/json',
  };

  try {
    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body ?? {}),
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.type(upstream.headers.get('content-type') ?? 'application/json');
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`TISP proxy listening on ${port}`);
});
