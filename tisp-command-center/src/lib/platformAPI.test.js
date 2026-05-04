import { afterEach, describe, expect, test, vi } from 'vitest';

const loadAPI = async (mode = 'simulation') => {
  vi.resetModules();
  vi.stubEnv('VITE_API_MODE', mode);
  return await import('./platformAPI.js');
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('platformAPI simulation mode', () => {
  test('returns MISP simulation stats', async () => {
    const { platformAPI } = await loadAPI();
    await expect(platformAPI.getMISPStats()).resolves.toMatchObject({
      totalEvents: 347,
      mode: 'simulation',
    });
  });

  test('returns OpenCTI simulation stats', async () => {
    const { platformAPI } = await loadAPI();
    await expect(platformAPI.getOpenCTIStats()).resolves.toMatchObject({
      relationships: 12_800_000,
      mode: 'simulation',
    });
  });

  test('returns TheHive simulation stats', async () => {
    const { platformAPI } = await loadAPI();
    await expect(platformAPI.getTheHiveStats()).resolves.toMatchObject({
      openCases: 24,
      mode: 'simulation',
    });
  });

  test('combines stats as non-live', async () => {
    const { platformAPI } = await loadAPI();
    await expect(platformAPI.getAllStats()).resolves.toMatchObject({
      isLive: false,
    });
  });

  test('returns simulation cases and workflow trigger results', async () => {
    const { platformAPI } = await loadAPI();
    await expect(platformAPI.getTheHiveCases()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'C-4042' })])
    );
    await expect(platformAPI.triggerWorkflow('ioc-ingest')).resolves.toMatchObject({
      mode: 'simulation',
      ok: true,
    });
  });
});

describe('platformAPI live helpers', () => {
  test('setToken adds default bearer authorization when a service header is absent', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { platformAPI } = await loadAPI('live');
    platformAPI.setToken('kc-token');
    await platformAPI.triggerWorkflow('ioc-ingest');

    expect(fetchMock).toHaveBeenCalledWith('/api/n8n/ioc-ingest', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer kc-token' }),
    }));
  });

  test('getTheHiveCases falls back to simulation data when live fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    }));

    const { platformAPI } = await loadAPI('live');
    await expect(platformAPI.getTheHiveCases()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'C-4042' })])
    );
  });
});
