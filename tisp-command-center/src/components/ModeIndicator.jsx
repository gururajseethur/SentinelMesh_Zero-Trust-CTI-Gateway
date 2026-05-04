import React from 'react';
import { Activity, AlertCircle, Database } from 'lucide-react';
import { platformAPI } from '../lib/platformAPI';
import { usePlatform } from '../state/PlatformContext';

export default function ModeIndicator() {
  const isLive = platformAPI.isLiveMode();
  const { stats } = usePlatform();

  const health = stats
    ? { misp: stats.misp?.mode === 'live', opencti: stats.opencti?.mode === 'live', thehive: stats.thehive?.mode === 'live' }
    : null;

  const allUp = health && health.misp && health.opencti && health.thehive;
  const someDown = health && !allUp && (health.misp || health.opencti || health.thehive);

  const badgeStyle =
    isLive && allUp
      ? 'border-green-500/30 bg-green-500/10 text-green-400'
      : isLive
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
      : 'border-amber-500/30 bg-amber-500/10 text-amber-400';

  return (
    <div className="fixed bottom-16 right-4 z-50 space-y-2">
      <div className={`rounded-lg border px-3 py-2 backdrop-blur-sm ${badgeStyle}`}>
        <div className="flex items-center gap-2">
          {isLive && allUp ? (
            <Activity size={14} className="animate-pulse" />
          ) : isLive && someDown ? (
            <AlertCircle size={14} />
          ) : (
            <Database size={14} />
          )}
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            {isLive && allUp
              ? 'Live Mode'
              : isLive && someDown
              ? 'Partial Connection'
              : isLive
              ? 'Connecting…'
              : 'Simulation Mode (UI Demo)'}
          </span>
        </div>
        {!isLive && (
          <p className="mt-0.5 text-[10px] text-amber-300/60">
            Real auth available via Keycloak
          </p>
        )}
      </div>

      {isLive && health && (
        <div className="rounded-lg border border-cyan-500/20 bg-slate-900/90 p-3 text-xs space-y-1.5 backdrop-blur-sm">
          {[
            ['MISP', health.misp],
            ['OpenCTI', health.opencti],
            ['TheHive', health.thehive],
          ].map(([name, up]) => (
            <div key={name} className="flex items-center justify-between gap-6">
              <span className="text-slate-400">{name}</span>
              <span className={up ? 'text-green-400' : 'text-red-400'}>
                {up ? '● Online' : '● Offline'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
