import React from 'react';
import { AlertTriangle } from 'lucide-react';

const LAB_MODE = import.meta.env.VITE_LAB_MODE === 'true';

export default function LabWarningBanner() {
  if (!LAB_MODE) return null;

  return (
    <div
      role="alert"
      className="flex shrink-0 items-center gap-3 border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-400"
    >
      <AlertTriangle size={13} className="shrink-0" aria-hidden="true" />
      <span className="font-bold uppercase tracking-wide">Lab Build</span>
      <span className="text-amber-400/80">
        Lab build — JWT signature verification requires Keycloak to be configured.
        <span className="hidden sm:inline">
          {' '}Isolated lab network only. Set <code className="font-mono">KEYCLOAK_URL</code>,{' '}
          <code className="font-mono">KEYCLOAK_REALM</code>, and{' '}
          <code className="font-mono">KEYCLOAK_CLIENT_ID</code> to enable RS256 enforcement.
        </span>
      </span>
    </div>
  );
}
