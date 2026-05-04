import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  BookOpen,
  Fingerprint,
  Globe2,
  LogOut,
  Network,
  Settings,
  Share2,
  Shield,
  Workflow,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { path: '/', label: 'Executive Dashboard', icon: BarChart3 },
      { path: '/blueprint', label: 'Technology Blueprint', icon: BookOpen },
      { path: '/architecture', label: 'Architecture Map', icon: Network },
    ],
  },
  {
    label: 'CTI Operations',
    items: [
      { path: '/misp', label: 'MISP Ingestion', icon: Globe2 },
      { path: '/opencti', label: 'OpenCTI Graph', icon: Share2 },
      { path: '/thehive', label: 'TheHive Cases', icon: Shield },
    ],
  },
  {
    label: 'Controls',
    items: [
      { path: '/identity', label: 'Identity & RBAC', icon: Fingerprint },
      { path: '/automation', label: 'Automation', icon: Workflow },
    ],
  },
];

const SidebarItem = ({ icon: Icon, label, to, active }) => (
  <Link
    to={to}
    title={label}
    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
      active
        ? 'bg-primary text-white shadow-lg shadow-primary/20'
        : 'text-on-surface-muted hover:bg-white/5 hover:text-on-surface'
    }`}
  >
    <Icon size={18} strokeWidth={active ? 2.3 : 1.8} className="shrink-0" />
    <span className="hidden truncate font-semibold md:inline">{label}</span>
  </Link>
);

const Sidebar = () => {
  const location = useLocation();
  const { userInfo, logout } = useAuth();

  const displayName = userInfo?.name ?? userInfo?.preferred_username ?? null;
  const role = userInfo?.realm_access?.roles?.find((r) =>
    ['admin', 'analyst', 'responder', 'observer'].includes(r)
  ) ?? null;
  const initials = displayName
    ? displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : null;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path;
  };

  return (
    <aside className="flex h-full w-16 shrink-0 flex-col border-r border-outline bg-surface-low/95 px-2 py-4 md:w-72 md:px-4">
      <div className="mb-5 flex items-center gap-3 px-1 md:px-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <Shield size={22} />
        </div>
        <div className="hidden min-w-0 md:block">
          <h1 className="truncate text-base font-bold tracking-tight text-on-surface">SentinelMesh</h1>
          <p className="text-xs font-medium text-on-surface-muted">Threat Intelligence Platform</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <section key={group.label} className="space-y-2">
            <p className="hidden px-2 text-[11px] font-semibold uppercase tracking-wide text-on-surface-muted md:block">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <SidebarItem
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  to={item.path}
                  active={isActive(item.path)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-outline bg-background/60 p-2 md:p-3">
        <div className="flex items-center justify-center gap-2 md:justify-start">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
            <Activity size={16} />
          </span>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-on-surface">Lab Ready</p>
            <p className="text-[11px] text-on-surface-muted">Build, tools, config pass</p>
          </div>
        </div>
      </div>

      <Link
        to="/settings"
        title="Project settings"
        className={`mt-2 flex items-center justify-center gap-2 rounded-lg px-2 py-2 transition md:justify-start ${
          isActive('/settings')
            ? 'bg-primary text-white shadow-lg shadow-primary/20'
            : 'text-on-surface-muted hover:bg-white/5 hover:text-on-surface'
        }`}
      >
        <Settings size={17} />
        <span className="hidden text-sm font-semibold md:inline">Project settings</span>
      </Link>

      {/* User identity footer */}
      <div className="mt-2 rounded-lg border border-outline bg-background/60 p-2 md:p-3">
        <div className="flex items-center justify-center gap-2 md:justify-start">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
            {initials ?? 'SIM'}
          </div>
          <div className="hidden min-w-0 flex-1 md:block">
            <p className="truncate text-xs font-semibold text-on-surface">
              {displayName ?? 'Simulation Mode'}
            </p>
            <p className="text-[11px] capitalize text-on-surface-muted">{role ?? 'analyst'}</p>
          </div>
          {logout && (
            <button
              onClick={logout}
              aria-label="Sign out"
              title="Sign out"
              className="hidden shrink-0 rounded-md p-1 text-on-surface-muted transition hover:text-danger md:flex"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
