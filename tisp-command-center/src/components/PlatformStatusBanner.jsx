import React, { useState } from 'react';
import { X, WifiOff } from 'lucide-react';
import { platformAPI } from '../lib/platformAPI';
import { usePlatform } from '../state/PlatformContext';

export default function PlatformStatusBanner() {
  const isLive = platformAPI.isLiveMode();
  const { stats } = usePlatform();

  const health = stats
    ? { misp: stats.misp?.mode === 'live', opencti: stats.opencti?.mode === 'live', thehive: stats.thehive?.mode === 'live' }
    : null;
  const healthKey = health ? `${health.misp}:${health.opencti}:${health.thehive}` : 'unknown';
  const [dismissedHealthKey, setDismissedHealthKey] = useState(null);
  const dismissed = dismissedHealthKey === healthKey;

  if (!isLive || dismissed || !health) return null;
  if (health.misp || health.opencti || health.thehive) return null;

  const offline = [
    !health.misp && 'MISP',
    !health.opencti && 'OpenCTI',
    !health.thehive && 'TheHive',
  ].filter(Boolean);

  return (
    <div className="flex items-center justify-between gap-4 border-b border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
      <div className="flex items-center gap-3">
        <WifiOff size={15} className="shrink-0" />
        <span className="font-semibold">Platform Offline</span>
        <span className="hidden text-danger/70 sm:inline">
          — {offline.join(', ')} unreachable. Dashboard showing simulation data.
        </span>
        <span className="text-danger/50 sm:hidden">Simulation data shown.</span>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <span className="hidden rounded bg-danger/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wide sm:inline">
          Set VITE_API_MODE=simulation to suppress
        </span>
        <button
          onClick={() => setDismissedHealthKey(healthKey)}
          className="rounded p-1 hover:bg-danger/20 transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
