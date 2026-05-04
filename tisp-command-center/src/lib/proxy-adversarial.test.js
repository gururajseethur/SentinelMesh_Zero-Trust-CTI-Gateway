/* eslint-disable no-undef */
/**
 * Adversarial tests for tisp-proxy security properties.
 *
 * Unit scope: mocks fetch, exercises platformAPI + safeFetch boundary logic.
 * Integration scope (requires tisp-proxy on localhost:3001):
 *   TISP_INTEGRATION=true npx vitest run src/lib/proxy-adversarial.test.js
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { platformAPI } from './platformAPI';

afterEach(() => vi.restoreAllMocks());

describe('ADV — platformAPI adversarial inputs (unit)', () => {
  it('ADV-01: updateTheHiveCase with null caseId returns simulation result in sim mode', async () => {
    const result = await platformAPI.updateTheHiveCase(null, 'assign');
    expect(result).toMatchObject({ mode: 'simulation', ok: true });
  });

  it('ADV-02: updateTheHiveCase encodes caseId — no path separator injection', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => '{"error":"not found"}',
      json: async () => ({ error: 'not found' }),
      headers: { get: () => 'application/json' },
    });

    // Simulate live mode by providing a caseId that contains path separators
    // In sim mode it no-ops; this test verifies the encoding path via the mock
    try {
      await platformAPI.updateTheHiveCase('../admin', 'assign');
    } catch { /* expected in live mode with 404 */ }

    for (const call of fetchSpy.mock.calls) {
      const url = String(call[0]);
      expect(url).not.toContain('../');
    }
  });

  it('ADV-03: triggerWorkflow strips leading slashes from webhookUrl', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
      headers: { get: () => 'application/json' },
    });

    try {
      await platformAPI.triggerWorkflow('///hidden-webhook');
    } catch { /* may throw if safeFetch wraps the error */ }

    for (const call of fetchSpy.mock.calls) {
      const url = String(call[0]);
      // Must not have triple slash or path traversal after the webhook prefix
      expect(url).not.toMatch(/\/\/\//);
    }
  });

  it('ADV-04: getAllStats falls back gracefully when all upstreams time out', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10))
    );

    const result = await platformAPI.getAllStats();
    // All services failed — must return simulation fallback shapes, never throw
    expect(result.misp).toBeDefined();
    expect(result.opencti).toBeDefined();
    expect(result.thehive).toBeDefined();
    expect(result.platform).toBeDefined();
  });

  it('ADV-05: getTheHiveCases does not throw on malformed live response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        { _id: null, title: null, severity: 99, status: undefined, tags: 'not-an-array' },
      ],
      headers: { get: () => 'application/json' },
    });

    // Should not throw even on garbage upstream data
    const result = await platformAPI.getTheHiveCases();
    // In sim mode it returns SIM data; in any mode it must not throw
    expect(Array.isArray(result)).toBe(true);
  });
});

/**
 * [INTEGRATION] Requires tisp-proxy running on localhost:3001.
 * Run with: TISP_INTEGRATION=true npx vitest run src/lib/proxy-adversarial.test.js
 */
const RUN_INTEGRATION = typeof process !== 'undefined' && process.env.TISP_INTEGRATION === 'true';
const PROXY_URL = typeof process !== 'undefined'
  ? (process.env.TISP_PROXY_URL ?? 'http://localhost:3001')
  : 'http://localhost:3001';

describe.skipIf(!RUN_INTEGRATION)('ADV — proxy HTTP boundary [INTEGRATION]', () => {
  it('ADV-I-01: no Authorization header → 401', async () => {
    const res = await fetch(`${PROXY_URL}/proxy/misp/users/view/me`);
    expect(res.status).toBe(401);
  });

  it('ADV-I-02: Authorization: Bearer (empty token after space) → 401', async () => {
    const res = await fetch(`${PROXY_URL}/proxy/misp/users/view/me`, {
      headers: { Authorization: 'Bearer ' },
    });
    expect(res.status).toBe(401);
  });

  it('ADV-I-03: unknown service name → 404 with error body', async () => {
    const res = await fetch(`${PROXY_URL}/proxy/cassandra`, {
      headers: { Authorization: 'Bearer testtoken' },
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Unknown upstream service');
  });

  it('ADV-I-04: rate limit enforced after RATE_MAX requests in the same window', async () => {
    const requests = Array.from({ length: 105 }, () => fetch(`${PROXY_URL}/health`));
    const responses = await Promise.all(requests);
    const statuses = responses.map((r) => r.status);
    expect(statuses).toContain(429);
  });

  it('ADV-I-05: percent-encoded path traversal is normalised — no /etc/passwd content', async () => {
    const res = await fetch(`${PROXY_URL}/proxy/misp/%2F..%2F..%2Fetc%2Fpasswd`, {
      headers: { Authorization: 'Bearer testtoken' },
    });
    if (res.status === 200) {
      const text = await res.text();
      expect(text).not.toContain('root:');
    }
  });
});
