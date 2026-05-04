import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileCheck,
  GitBranch,
  KeyRound,
  Lock,
  Network,
  Server,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { BrilliantCard, HolographicHeader } from './HUDComponents';
import { tone } from '../lib/uiTokens';
import { usePlatform } from '../state/PlatformContext';

const PROFILE_OPTIONS = {
  lab: {
    label: 'Lab simulation',
    description: 'Multi-organization demo profile for local validation and internship submission.',
    endpoint: 'http://127.0.0.1:5173',
    mode: 'Isolated Docker network',
    encryption: 'TLS-ready reverse proxy, AES-256 compatible storage plan',
  },
  production: {
    label: 'Production rollout',
    description: 'Hardened profile for real deployment after secrets, TLS certificates, and MFA are enabled.',
    endpoint: 'https://cti.example.org',
    mode: 'Reverse proxy only, no direct service exposure',
    encryption: 'Real certificates, generated secrets, encrypted backups',
  },
};

const readinessCards = [
  { label: 'Organizations', value: '3 simulated', icon: Users, color: 'primary' },
  { label: 'Security profile', value: 'MFA + RBAC', icon: ShieldCheck, color: 'accent-green' },
  { label: 'Intel standards', value: 'STIX/TAXII', icon: Network, color: 'accent-blue' },
  { label: 'Evidence pack', value: 'PDF ready', icon: FileCheck, color: 'accent-purple' },
];

const governanceItems = [
  'Data sharing agreement templates are documented',
  'TLP handling and anonymization workflow are configured',
  'RBAC roles separate admin, analyst, responder, and observer access',
  'Production profile removes direct public service ports',
];

const evidenceRows = [
  { name: 'Submission report', status: 'Generated', detail: 'HTML and PDF evidence report' },
  { name: 'Dashboard screenshots', status: 'Captured', detail: 'Desktop and mobile browser views' },
  { name: 'Compose validation', status: 'Passed', detail: 'Lab and production configuration checks' },
  { name: 'Analysis tools', status: 'Tested', detail: 'IOC normalization, anonymization, STIX bundle output' },
];

// Maps each integration to the stats key that confirms it is working.
// `alwaysOn` = not a runtime service, always available if the code is present.
const integrationControls = [
  { label: 'MISP ingestion', description: 'IOC collection and tagging pipeline', icon: Database, statsKey: 'misp' },
  { label: 'OpenCTI correlation', description: 'Threat entities and relationship analysis', icon: Network, statsKey: 'opencti' },
  { label: 'TheHive case sync', description: 'Incident coordination and responder handoff', icon: ShieldCheck, statsKey: 'thehive' },
  { label: 'STIX/TAXII export', description: 'Industry-standard sharing package', icon: GitBranch, alwaysOn: true },
  { label: 'Anonymization', description: 'Sensitive identity masking before sharing', icon: Lock, alwaysOn: true },
  { label: 'SIEM forwarding', description: 'Optional SOC integration channel', icon: Server, notConfigured: true },
];

const StatusPill = ({ children, color = 'accent-green' }) => {
  const colorClasses = tone(color);
  return (
    <span className={`inline-flex items-center rounded-lg border ${colorClasses.border20} ${colorClasses.bg10} px-2.5 py-1 text-xs font-semibold ${colorClasses.text}`}>
      {children}
    </span>
  );
};

function ServiceStatusBadge({ control, stats, error }) {
  if (control.notConfigured) {
    return (
      <span className="rounded-lg border border-outline bg-white/5 px-2.5 py-1 text-xs font-semibold text-on-surface-muted">
        Not configured
      </span>
    );
  }
  if (control.alwaysOn) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-success/25 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
        <CheckCircle2 size={12} /> Implemented
      </span>
    );
  }
  // Service-backed controls: check if stats data is present (means the service responded)
  const serviceStats = stats?.[control.statsKey];
  const isUp = !error && serviceStats !== undefined && serviceStats !== null;
  return isUp ? (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-success/25 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
      <CheckCircle2 size={12} /> Active
    </span>
  ) : (
    <span className="rounded-lg border border-outline bg-white/5 px-2.5 py-1 text-xs font-semibold text-on-surface-muted">
      Offline
    </span>
  );
}

const ProjectSettings = () => {
  const [profileKey, setProfileKey] = useState('lab');
  const { stats, error } = usePlatform();
  const activeProfile = PROFILE_OPTIONS[profileKey];

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden bg-slate-950/40">
      <HolographicHeader
        title="PROJECT_SETTINGS"
        subtitle="Deployment profile, governance controls, and submission readiness"
        icon={Settings}
      />

      <div className="custom-scrollbar relative z-10 grid flex-1 grid-cols-12 gap-4 overflow-y-auto p-4 md:p-6 xl:gap-6 xl:p-8">
        <div className="col-span-12 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {readinessCards.map((card) => {
            const colorClasses = tone(card.color);
            return (
              <div key={card.label} className="glass-panel flex min-w-0 items-center gap-4 p-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${colorClasses.bg10} ${colorClasses.text}`}>
                  <card.icon size={21} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-on-surface-muted">{card.label}</p>
                  <p className="truncate text-lg font-bold text-on-surface">{card.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="col-span-12 xl:col-span-7">
          <BrilliantCard title="Deployment Profile" icon={Server} className="h-full">
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-outline bg-background/50 p-1">
                {Object.entries(PROFILE_OPTIONS).map(([key, option]) => {
                  const active = profileKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setProfileKey(key)}
                      className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                        active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-on-surface-muted hover:bg-white/5 hover:text-on-surface'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-lg border border-outline bg-background/45 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">{activeProfile.label}</h3>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-on-surface-muted">{activeProfile.description}</p>
                  </div>
                  <StatusPill color={profileKey === 'lab' ? 'accent-green' : 'accent-blue'}>
                    {profileKey === 'lab' ? 'Current' : 'Planned'}
                  </StatusPill>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
                  {[
                    ['Access endpoint', activeProfile.endpoint],
                    ['Network mode', activeProfile.mode],
                    ['Encryption posture', activeProfile.encryption],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-outline bg-surface/45 p-4">
                      <p className="text-xs font-semibold text-on-surface-muted">{label}</p>
                      <p className="mt-2 text-sm font-semibold leading-5 text-on-surface">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Integration status — read-only, driven by live health data */}
              <div>
                <p className="mb-3 text-xs font-semibold text-on-surface-muted">Integration status</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {integrationControls.map((control) => (
                    <div
                      key={control.label}
                      className="flex min-w-0 items-center justify-between gap-4 rounded-lg border border-outline bg-background/45 p-4"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-on-surface-muted">
                          <control.icon size={18} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-on-surface">{control.label}</span>
                          <span className="mt-1 block text-xs leading-5 text-on-surface-muted">{control.description}</span>
                        </span>
                      </span>
                      <ServiceStatusBadge control={control} stats={stats} error={error} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </BrilliantCard>
        </div>

        <div className="col-span-12 xl:col-span-5 space-y-4">
          <BrilliantCard title="Governance Checklist" icon={KeyRound}>
            <div className="space-y-3">
              {governanceItems.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-lg border border-outline bg-background/45 p-3">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-success" size={18} />
                  <p className="text-sm leading-6 text-on-surface-muted">{item}</p>
                </div>
              ))}
            </div>
          </BrilliantCard>

          <BrilliantCard title="Submission Evidence" icon={FileCheck}>
            <div className="space-y-3">
              {evidenceRows.map((row) => (
                <div key={row.name} className="flex flex-col gap-3 rounded-lg border border-outline bg-background/45 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-on-surface">{row.name}</p>
                    <p className="mt-1 text-xs leading-5 text-on-surface-muted">{row.detail}</p>
                  </div>
                  <StatusPill>{row.status}</StatusPill>
                </div>
              ))}
            </div>
          </BrilliantCard>

          <div className="rounded-lg border border-warning/25 bg-warning/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 shrink-0 text-warning" size={20} />
              <div>
                <p className="text-sm font-bold text-on-surface">Production handoff note</p>
                <p className="mt-1 text-sm leading-6 text-on-surface-muted">
                  Replace all placeholder secrets, install real TLS certificates, enable MFA in the live services, and run the production smoke test before using this outside the lab.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSettings;
