import React from 'react';
import {
  Activity,
  Bell,
  Bot,
  Database,
  FileSearch,
  Fingerprint,
  Globe2,
  KeyRound,
  LockKeyhole,
  Network,
  RadioTower,
  Server,
  Share2,
  Shield,
  Workflow,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HolographicHeader } from './HUDComponents';

const layers = [
  {
    title: 'Sources',
    caption: 'Partner organizations and sensors',
    route: '/misp',
    nodes: [
      { label: 'ORG-A SOC', detail: 'Financial SOC indicators', icon: Shield, tone: 'blue' },
      { label: 'ORG-B CERT', detail: 'Validation and advisory input', icon: Bell, tone: 'green' },
      { label: 'ORG-C DFIR', detail: 'Incident observables and YARA', icon: FileSearch, tone: 'purple' },
    ],
  },
  {
    title: 'Ingestion & Governance',
    caption: 'Controlled submission and trust policy',
    route: '/misp',
    nodes: [
      { label: 'MISP', detail: 'Events, IOCs, sharing groups', icon: Globe2, tone: 'blue' },
      { label: 'Keycloak', detail: 'MFA, SSO, RBAC roles', icon: Fingerprint, tone: 'rose' },
      { label: 'Data agreements', detail: 'TLP, privacy, retention', icon: LockKeyhole, tone: 'green' },
    ],
  },
  {
    title: 'Correlation & Analysis',
    caption: 'Normalization, enrichment, and patterns',
    route: '/opencti',
    nodes: [
      { label: 'OpenCTI', detail: 'STIX graph and relationships', icon: Share2, tone: 'purple' },
      { label: 'CTI Tools', detail: 'STIX export and pattern detection', icon: Bot, tone: 'blue' },
      { label: 'n8n', detail: 'Automation and routing workflows', icon: Workflow, tone: 'green' },
    ],
  },
  {
    title: 'Response & Reporting',
    caption: 'Actionable operations and evidence',
    route: '/thehive',
    nodes: [
      { label: 'TheHive', detail: 'Cases, observables, coordination', icon: Shield, tone: 'rose' },
      { label: 'Dashboard', detail: 'Trends, severity, reliability', icon: Activity, tone: 'blue' },
      { label: 'SIEM/SOAR', detail: 'Export hooks and playbooks', icon: RadioTower, tone: 'green' },
    ],
  },
  {
    title: 'Persistence',
    caption: 'Internal state and protected stores',
    route: '/architecture',
    nodes: [
      { label: 'PostgreSQL / MySQL', detail: 'Identity and MISP data', icon: Database, tone: 'purple' },
      { label: 'Elasticsearch', detail: 'Search and graph indexing', icon: Server, tone: 'blue' },
      { label: 'MinIO / RabbitMQ / Redis', detail: 'Objects, queues, caching', icon: KeyRound, tone: 'green' },
    ],
  },
];

const trustControls = [
  'TLS reverse proxy terminates all external access',
  'Only Nginx publishes production ports 80/443',
  'MFA and RBAC govern every organization role',
  'STIX/TAXII-ready exports use TLP markings and anonymization',
];

const toneClass = {
  blue: 'border-primary/30 bg-primary/10 text-primary',
  purple: 'border-accent-purple/30 bg-accent-purple/10 text-accent-purple',
  green: 'border-success/30 bg-success/10 text-success',
  rose: 'border-danger/30 bg-danger/10 text-danger',
};

const NodeCard = ({ node, route, onClick }) => {
  const Icon = node.icon;

  return (
    <div
      className={`min-h-[96px] rounded-lg border border-outline bg-background/70 p-3 transition-colors${route ? ' cursor-pointer hover:border-primary/50 hover:shadow-primary/20' : ''}`}
      onClick={route ? onClick : undefined}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${toneClass[node.tone]}`}>
          <Icon size={18} />
        </div>
        <h3 className="min-w-0 text-sm font-semibold leading-snug text-on-surface">{node.label}</h3>
      </div>
      <p className="text-xs leading-relaxed text-on-surface-muted">{node.detail}</p>
    </div>
  );
};

const FlowConnector = ({ label }) => (
  <>
    <div className="hidden min-w-0 items-center px-1 lg:flex">
      <div className="relative h-px w-full bg-outline">
        <span className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-r-2 border-t-2 border-primary" />
        <span className="absolute left-1/2 top-3 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-outline bg-surface-low px-2 py-0.5 text-[10px] font-semibold text-on-surface-muted xl:block">
          {label}
        </span>
      </div>
    </div>
    <div className="flex justify-center lg:hidden">
      <div className="flex flex-col items-center gap-1 py-1">
        <span className="h-6 w-px bg-outline" />
        <span className="text-[11px] font-semibold text-on-surface-muted">{label}</span>
        <span className="h-6 w-px bg-outline" />
      </div>
    </div>
  </>
);

const Architecture = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background/60">
      <HolographicHeader
        title="SYSTEM_TOPOLOGY"
        subtitle="Connected CTI platform architecture"
        icon={Network}
      />

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-6 lg:p-8">
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            ['Platform zones', '5', 'Sources to response and persistence'],
            ['Trust boundaries', '4', 'Identity, governance, encryption, anonymization'],
            ['Validated images', '13', 'Manifest checks included in evidence'],
          ].map(([label, value, detail]) => (
            <div key={label} className="rounded-lg border border-outline bg-surface/70 p-4">
              <p className="text-xs font-semibold text-on-surface-muted">{label}</p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <span className="text-3xl font-bold text-on-surface">{value}</span>
                <span className="max-w-[13rem] text-right text-xs leading-relaxed text-on-surface-muted">{detail}</span>
              </div>
            </div>
          ))}
        </div>

        <section className="rounded-lg border border-outline bg-surface/70 p-4 sm:p-5">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-on-surface">Threat Intelligence Sharing Data Flow</h2>
              <p className="mt-1 text-sm text-on-surface-muted">
                Each column is a platform layer. Connectors show the primary path from intake through governance, analysis, response, and storage.
              </p>
            </div>
            <span className="w-fit rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              No direct app ports in production
            </span>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(168px,1fr)_44px_minmax(168px,1fr)_44px_minmax(168px,1fr)_44px_minmax(168px,1fr)_44px_minmax(168px,1fr)] lg:items-stretch">
            {layers.map((layer, index) => (
              <React.Fragment key={layer.title}>
                <div className="flex min-w-0 flex-col rounded-lg border border-outline bg-background/35 p-3">
                  <div className="mb-3 border-b border-outline pb-3">
                    <p className="text-xs font-semibold uppercase text-primary">{layer.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-on-surface-muted">{layer.caption}</p>
                  </div>
                  <div className="grid flex-1 gap-3">
                    {layer.nodes.map((node) => (
                      <NodeCard key={node.label} node={node} route={layer.route} onClick={() => navigate(layer.route)} />
                    ))}
                  </div>
                </div>
                {index < layers.length - 1 && (
                  <FlowConnector label={index === 0 ? 'submit' : index === 1 ? 'normalize' : index === 2 ? 'escalate' : 'store'} />
                )}
              </React.Fragment>
            ))}
          </div>
        </section>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-lg border border-outline bg-surface/70 p-4">
            <h2 className="text-sm font-semibold text-on-surface">Production Trust Model</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {trustControls.map((control) => (
                <div key={control} className="flex items-start gap-3 rounded-lg border border-outline bg-background/55 p-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-success" />
                  <p className="text-sm leading-relaxed text-on-surface-muted">{control}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-outline bg-surface/70 p-4">
            <h2 className="text-sm font-semibold text-on-surface">Deployment Boundary</h2>
            <div className="mt-4 space-y-3 text-sm text-on-surface-muted">
              <p>
                External users only reach the reverse proxy. MISP, OpenCTI, TheHive, Keycloak, and n8n stay on internal Docker networks.
              </p>
              <div className="rounded-lg border border-outline bg-background/55 p-3">
                <p className="text-xs font-semibold uppercase text-on-surface-muted">Public entry</p>
                <p className="mt-1 text-lg font-bold text-on-surface">Nginx TLS proxy</p>
              </div>
              <div className="rounded-lg border border-outline bg-background/55 p-3">
                <p className="text-xs font-semibold uppercase text-on-surface-muted">Internal services</p>
                <p className="mt-1 text-lg font-bold text-on-surface">frontend-net / backend-net / ir-net / identity-net</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Architecture;
