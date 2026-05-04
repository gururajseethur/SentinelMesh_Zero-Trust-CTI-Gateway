import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { PlatformProvider, usePlatform } from './PlatformContext.jsx';

const { mockStats } = vi.hoisted(() => ({
  mockStats: {
    misp: { totalEvents: 347, mode: 'simulation' },
    opencti: { relationships: 12_800_000, mode: 'simulation' },
    thehive: { openCases: 24, mode: 'simulation' },
    platform: { servicesHealthy: 12, mode: 'simulation' },
    isLive: false,
  },
}));

vi.mock('../lib/platformAPI', () => ({
  platformAPI: {
    getAllStats: vi.fn().mockResolvedValue(mockStats),
    getMISPEvents: vi.fn().mockResolvedValue([]),
    getTheHiveCases: vi.fn().mockResolvedValue([]),
    getOpenCTIEntities: vi.fn().mockResolvedValue([]),
    getAutomationWorkflows: vi.fn().mockResolvedValue([]),
    pollInterval: 30_000,
  },
}));

const Status = () => {
  const { loading } = usePlatform();
  return <span data-testid="loading">{loading ? 'true' : 'false'}</span>;
};

describe('PlatformProvider', () => {
  test('renders children and transitions loading to false', async () => {
    render(
      <PlatformProvider>
        <div data-testid="child" />
        <Status />
      </PlatformProvider>
    );

    expect(screen.getByTestId('child')).toBeTruthy();
    expect(screen.getByTestId('loading').textContent).toBe('true');
    expect(await screen.findByText('false')).toBeTruthy();
  });
});
