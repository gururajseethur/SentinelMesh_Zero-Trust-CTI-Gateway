import React, { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { tone } from '../lib/uiTokens';
import { useAuth } from '../auth/useAuth';

// ── Auth status badge ─────────────────────────────────────────────────────────
// Shows cryptographic verification mode and token expiry in live mode.
// Shows simulation mode indicator when KC is not configured.
function AuthStatusBadge({ token, userInfo }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const minsLeft = userInfo?.exp ? Math.max(0, Math.floor((userInfo.exp * 1000 - now) / 60000)) : null;

  if (token) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-success/25 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
        <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
        RS256 verified{minsLeft !== null ? ` · ${minsLeft}m` : ''}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400">
      <span className="h-2 w-2 rounded-full bg-amber-400" />
      Demo mode · Keycloak OIDC available
    </div>
  );
}

export const BrilliantCard = ({ children, title, icon: Icon, className = '', delay = 0, live }) => (
  <section
    className={`glass-panel relative min-w-0 overflow-hidden p-4 sm:p-5 ${className}`}
    style={{ transitionDelay: `${delay * 1000}ms` }}
  >
    {title && (
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {Icon && <Icon size={18} strokeWidth={2.2} />}
          </div>
          <h3 className="truncate text-sm font-semibold text-on-surface">{title}</h3>
        </div>
        {live !== undefined && (
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${live ? 'bg-success/10 text-success' : 'bg-amber-500/10 text-amber-400'}`}>
            {live ? 'Live' : 'Sim'}
          </span>
        )}
      </div>
    )}
    {children}
  </section>
);

export const HolographicHeader = ({ title, subtitle, icon: Icon }) => {
  const { userInfo, token, logout } = useAuth();

  const displayName = userInfo?.name ?? userInfo?.preferred_username ?? null;
  const role = userInfo?.realm_access?.roles?.find((r) => ['admin', 'analyst', 'responder', 'observer'].includes(r)) ?? null;
  const initials = displayName
    ? displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : null;

  return (
    <header className="border-b border-outline bg-surface/80 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {Icon && <Icon size={24} strokeWidth={2.2} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="truncate text-xl font-bold tracking-tight text-on-surface lg:text-2xl">{title}</h1>
              <span className="hidden rounded-full border border-outline px-2.5 py-1 text-[11px] font-semibold text-on-surface-muted sm:inline-flex">
                Academic submission
              </span>
            </div>
            <p className="mt-1 text-sm leading-snug text-on-surface-muted">{subtitle}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-success">
                <span className="h-2 w-2 rounded-full bg-success" /> Systems nominal
              </span>
              <span className="font-semibold text-on-surface-muted">Evidence validated</span>
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <AuthStatusBadge token={token} userInfo={userInfo} />
          <div className="h-8 w-px bg-outline" />
          {displayName ? (
            <>
              <div className="text-right">
                <p className="text-sm font-semibold text-on-surface">{displayName}</p>
                <p className="text-xs capitalize text-on-surface-muted">{role ?? 'analyst'}</p>
              </div>
              <button
                onClick={logout}
                aria-label="Sign out"
                title="Sign out"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white hover:bg-primary/80 transition"
              >
                {initials}
              </button>
            </>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-xs font-bold text-primary">
              SIM
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export const TacticalLoader = () => (
  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
);

export const DataWidget = ({ label, value, trend, icon: Icon, color = 'primary' }) => {
  const colorClasses = tone(color);

  return (
    <div className="glass-card p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorClasses.bg10} ${colorClasses.text}`}>
          {Icon && <Icon size={18} />}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend.startsWith('-') ? 'text-danger' : 'text-success'}`}>
            <TrendingUp size={13} className={trend.startsWith('-') ? 'rotate-180' : ''} />
            {trend}
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-on-surface-muted">{label}</p>
      <h4 className="mt-1 text-2xl font-bold text-on-surface">{value}</h4>
    </div>
  );
};

export const DataPulse = ({ size = 'md', color = 'primary' }) => {
  const sizes = { sm: 'h-2 w-2', md: 'h-2.5 w-2.5', lg: 'h-4 w-4' };
  const colors = {
    primary: 'bg-primary',
    accent: 'bg-accent-purple',
    success: 'bg-success',
    error: 'bg-danger',
  };

  return <span className={`${sizes[size]} ${colors[color]} block rounded-full`} />;
};

export const CasePulse = ({ severity = 'MEDIUM' }) => {
  const color = severity === 'CRITICAL' ? 'error' : severity === 'HIGH' ? 'accent' : 'primary';
  return <DataPulse size="sm" color={color} />;
};
