import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg border border-outline bg-surface">
        <AlertTriangle className="text-warning" size={28} />
      </div>
      <h2 className="mb-2 text-6xl font-black tabular-nums text-on-surface">404</h2>
      <p className="mb-6 text-sm text-on-surface-muted">
        This node is not registered in the SentinelMesh workspace.
      </p>
      <Link
        to="/"
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
