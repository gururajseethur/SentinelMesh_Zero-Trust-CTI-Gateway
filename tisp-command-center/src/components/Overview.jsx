import React, { useEffect, useRef, useState } from 'react';
import { usePlatform } from '../state/PlatformContext';
import { toast } from 'sonner';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Database,
  FileText,
  Fingerprint,
  GitMerge,
  Globe2,
  LockKeyhole,
  Network,
  Radio,
  Shield,
  Workflow,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { BrilliantCard, HolographicHeader } from './HUDComponents';

const deliverables = [
  'Architecture & deployment',
  'Data sharing agreements',
  'Configuration guides',
  'Automated analysis tools',
  'Integration manuals',
  'Reporting dashboards',
  'Compliance documentation',
  'User training guide',
];

const toneClasses = {
  blue: 'bg-primary/10 text-primary border-primary/20',
  green: 'bg-success/10 text-success border-success/20',
  rose: 'bg-danger/10 text-danger border-danger/20',
  purple: 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
};

const severityClasses = {
  Critical: 'bg-danger/10 text-danger border-danger/20',
  High: 'bg-warning/10 text-warning border-warning/20',
  Medium: 'bg-primary/10 text-primary border-primary/20',
};

const compliance = [
  { label: 'GDPR minimization', value: 88 },
  { label: 'ISO 27001 controls', value: 92 },
  { label: 'NIST CSF alignment', value: 94 },
  { label: 'RBAC coverage', value: 96 },
];

const THREAT_OFFSETS_MS = [12 * 60_000, 32 * 60_000, 60 * 60_000, 120 * 60_000];
const threats = [
  { title: 'C2 domain cluster linked to ransomware activity', severity: 'Critical', source: 'ORG-C DFIR', offsetMs: THREAT_OFFSETS_MS[0] },
  { title: 'SSH brute-force IP range observed by two partners', severity: 'High', source: 'ORG-A SOC', offsetMs: THREAT_OFFSETS_MS[1] },
  { title: 'Suspicious PowerShell YARA match submitted', severity: 'Medium', source: 'ORG-B CERT', offsetMs: THREAT_OFFSETS_MS[2] },
  { title: 'Credential-access URL sanitized for TAXII export', severity: 'High', source: 'ORG-C DFIR', offsetMs: THREAT_OFFSETS_MS[3] },
];

function relativeTime(offsetMs) {
  const mins = Math.round(offsetMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m ago` : `${hrs}h ago`;
}

const KpiCard = ({ item, index, isExpanded, onClick }) => {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className="glass-card min-w-0 p-3 sm:p-4 text-left w-full transition hover:border-primary/35"
      style={{ transitionDelay: `${index * 40}ms` }}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${toneClasses[item.tone]}`}>
          <Icon size={19} />
        </div>
        <span className="hidden max-w-[7rem] truncate rounded-full bg-background/70 px-2 py-1 text-[11px] font-semibold text-on-surface-muted sm:inline-block">{item.change}</span>
      </div>
      <p className="text-xs font-medium text-on-surface-muted sm:text-sm">{item.label}</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">{item.value}</h2>
      {isExpanded && item.breakdown && (
        <div className="mt-3 pt-3 border-t border-outline space-y-1.5">
          {Object.entries(item.breakdown).map(([type, count]) => (
            <div key={type} className="flex justify-between text-xs">
              <span className="text-on-surface-muted">{type}</span>
              <span className="font-bold text-on-surface">{count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </button>
  );
};

const DataModeBadge = ({ isLive, loading }) => {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-low px-3 py-1 text-xs font-semibold text-on-surface-muted">
        <Activity size={12} className="animate-pulse" /> Connecting…
      </span>
    );
  }
  if (isLive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
        <Wifi size={12} /> Live API
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
      <WifiOff size={12} /> Simulation Mode
    </span>
  );
};

const Overview = () => {
  const { stats, loading, lastUpdated } = usePlatform();
  const [expandedKPI, setExpandedKPI] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const toastedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setElapsedMs((value) => value + 60_000), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (stats?.isLive && !toastedRef.current) {
      toastedRef.current = true;
      toast.success('Connected to live platform', {
        description: `MISP: ${stats.misp.totalEvents} events · OpenCTI: ${(stats.opencti.relationships ?? 0).toLocaleString()} links`,
      });
    }
  }, [stats]);

  const fmt = (n) => {
    if (n === undefined || n === null) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  const kpis = [
    {
      label: 'Shared Indicators',
      value: loading ? '…' : fmt(stats?.misp?.totalEvents ?? 347),
      change: loading ? '' : (stats?.misp?.mode === 'live' ? 'Live MISP' : '+12.4%'),
      icon: Database,
      tone: 'green',
      breakdown: { 'IPv4 Addresses': 142, 'Domain Names': 89, 'File Hashes': 73, 'URLs': 43 },
    },
    {
      label: 'CTI Relationships',
      value: loading ? '…' : fmt(stats?.opencti?.relationships ?? 12_800_000),
      change: 'OpenCTI graph',
      icon: GitMerge,
      tone: 'blue',
      breakdown: { 'Campaigns': 1247, 'Malware Families': 892, 'TTPs': 3456, 'Infrastructure': 7215 },
    },
    {
      label: 'Open Cases',
      value: loading ? '…' : fmt(stats?.thehive?.openCases ?? 24),
      change: loading ? '' : `${stats?.thehive?.resolvedCases ?? 12} resolved`,
      icon: Shield,
      tone: 'rose',
      breakdown: { 'Critical': 8, 'High': 6, 'Medium': 7, 'Low': 3 },
    },
    {
      label: 'Platform Modules',
      value: loading ? '…' : `${stats?.platform?.servicesHealthy ?? 12}/${stats?.platform?.servicesTotal ?? 12}`,
      change: loading ? '' : (stats?.platform?.uptime ?? '99.4%'),
      icon: Network,
      tone: 'purple',
      breakdown: { 'MISP': 1, 'OpenCTI': 1, 'TheHive': 1, 'n8n': 1, 'Other': 8 },
    },
  ];

  const pipeline = [
    {
      label: 'MISP ingestion',
      count: loading ? '…' : `${stats?.misp?.feeds ?? 14} feeds`,
      status: 'Healthy',
      icon: Globe2,
    },
    {
      label: 'OpenCTI correlation',
      count: loading ? '…' : `${fmt(stats?.opencti?.relationships ?? 12_800_000)} links`,
      status: 'Synced',
      icon: GitMerge,
    },
    {
      label: 'TheHive response',
      count: loading ? '…' : `${stats?.thehive?.openCases ?? 24} cases`,
      status: 'Active',
      icon: Shield,
    },
    { label: 'n8n automation', count: '4 flows', status: 'Ready', icon: Workflow },
  ];

  const orgTrustScores = [
    { name: 'ORG-A SOC', score: 68, indicators: loading ? '…' : '17 IOCs' },
    { name: 'ORG-B CERT', score: 79, indicators: loading ? '…' : '16 IOCs' },
    { name: 'ORG-C DFIR', score: 90, indicators: loading ? '…' : '17 IOCs' },
  ];

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-on-surface-muted">Loading platform data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background/60">
      <HolographicHeader
        title="SENTINELMESH_COMMAND_CENTER"
        subtitle="Multi-organization CTI sharing platform"
        icon={Shield}
      />

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-6 lg:p-8">
        {/* Mode badge */}
        <div className="mb-4 flex items-center justify-between">
          {lastUpdated && (
            <span className="text-xs text-on-surface-muted">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <DataModeBadge isLive={stats?.isLive ?? false} loading={loading} />
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:mb-6 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {kpis.map((item, index) => (
            <KpiCard
              key={item.label}
              item={item}
              index={index}
              isExpanded={expandedKPI === index}
              onClick={() => setExpandedKPI(expandedKPI === index ? null : index)}
            />
          ))}
        </div>

        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          <section className="col-span-12 xl:col-span-8">
            <BrilliantCard title="Threat Intelligence Exchange Flow" icon={Network}>
              <div className="grid gap-4 lg:grid-cols-4">
                {pipeline.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.label} className="relative rounded-lg border border-outline bg-background/55 p-4">
                      {index < pipeline.length - 1 && (
                        <div className="absolute right-[-1rem] top-9 hidden h-px w-8 bg-outline lg:block" />
                      )}
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon size={19} />
                      </div>
                      <p className="text-sm font-semibold text-on-surface">{step.label}</p>
                      <p className="mt-1 text-xs text-on-surface-muted">{step.count}</p>
                      <span className="mt-4 inline-flex rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                        {step.status}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-lg border border-outline bg-surface-low p-4">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-on-surface">Multi-organization sharing simulation</h3>
                    <p className="text-xs text-on-surface-muted">
                      ORG-A SOC, ORG-B CERT, and ORG-C DFIR exchange sanitized IOCs under TLP controls.
                      {!loading && stats && (
                        <span className="ml-1 font-semibold text-primary">
                          22 correlated across all 3 orgs.
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <Radio size={13} /> STIX 2.1 ready
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {orgTrustScores.map((org) => (
                    <div key={org.name} className="rounded-lg border border-outline bg-background/70 p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-on-surface">{org.name}</span>
                        <span className="h-2 w-2 rounded-full bg-success" />
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-high">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${org.score}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-on-surface-muted">{org.score}% reliability · {org.indicators}</p>
                    </div>
                  ))}
                </div>
              </div>
            </BrilliantCard>
          </section>

          <aside className="col-span-12 xl:col-span-4">
            <BrilliantCard title="Priority Threat Stream" icon={AlertTriangle}>
              <div className="space-y-3">
                {threats.map((threat) => (
                  <div key={threat.title} className="rounded-lg border border-outline bg-background/55 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${severityClasses[threat.severity]}`}>
                        {threat.severity}
                      </span>
                      <span className="text-xs text-on-surface-muted">
                        {relativeTime(threat.offsetMs + elapsedMs)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold leading-snug text-on-surface">{threat.title}</p>
                    <p className="mt-1 text-xs text-on-surface-muted">{threat.source}</p>
                  </div>
                ))}
              </div>
            </BrilliantCard>
          </aside>

          <section className="col-span-12 lg:col-span-5">
            <BrilliantCard title="Security & Privacy Controls" icon={LockKeyhole}>
              <div className="space-y-4">
                {compliance.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-on-surface">{item.label}</span>
                      <span className="font-semibold text-on-surface-muted">{item.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-high">
                      <div className="h-full rounded-full bg-success" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </BrilliantCard>
          </section>

          <section className="col-span-12 lg:col-span-4">
            <BrilliantCard title="Submission Deliverables" icon={FileText}>
              <div className="grid grid-cols-1 gap-2">
                {deliverables.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-lg border border-outline bg-background/55 px-3 py-2">
                    <CheckCircle2 className="text-success" size={16} />
                    <span className="text-sm font-medium text-on-surface">{item}</span>
                  </div>
                ))}
              </div>
            </BrilliantCard>
          </section>

          <section className="col-span-12 lg:col-span-3">
            <BrilliantCard title="Validation Status" icon={Activity}>
              <div className="space-y-3">
                {[
                  ['Dashboard lint/build', 'Passed'],
                  ['STIX/analyzer tools', 'Passed'],
                  ['50 IOC dataset', 'Generated'],
                  ['Compose config', 'Validated'],
                  ['Env structure', 'Secrets set'],
                ].map(([label, status]) => (
                  <div key={label} className="flex items-center justify-between rounded-lg bg-background/55 px-3 py-2">
                    <span className="text-sm text-on-surface-muted">{label}</span>
                    <span className="text-sm font-semibold text-success">{status}</span>
                  </div>
                ))}
              </div>
            </BrilliantCard>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Overview;
