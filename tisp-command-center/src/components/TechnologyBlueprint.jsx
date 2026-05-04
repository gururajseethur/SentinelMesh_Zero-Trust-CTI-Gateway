import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  Cpu,
  Database,
  FileText,
  GitBranch,
  Globe2,
  Layers3,
  LockKeyhole,
  Network,
  Rocket,
  Server,
  ShieldCheck,
  Terminal,
  Workflow,
  ClipboardList,
} from 'lucide-react';
import { BrilliantCard, HolographicHeader } from './HUDComponents';
import { tone } from '../lib/uiTokens';

const stackLayers = [
  {
    name: 'Command Center',
    purpose: 'A SOC-style interface for monitoring metrics, presenting evidence, and demonstrating the platform.',
    technologies: ['React 19', 'Vite', 'Tailwind CSS 4', 'Framer Motion', 'Lucide', 'Recharts'],
    icon: Cpu,
    color: 'primary',
  },
  {
    name: 'Threat Intelligence',
    purpose: 'Open-source CTI tools for IOC ingestion, threat correlation, sharing, and incident case response.',
    technologies: ['MISP', 'OpenCTI', 'TheHive', 'STIX 2.1', 'TAXII-ready exports'],
    icon: Network,
    color: 'accent-blue',
  },
  {
    name: 'Security Controls',
    purpose: 'Governance, trust, role boundaries, identity, and privacy controls for safe multi-org sharing.',
    technologies: ['Keycloak 24', 'RBAC', 'MFA', 'TLS reverse proxy', 'AES-256 storage plan', 'Anonymization'],
    icon: ShieldCheck,
    color: 'accent-green',
  },
  {
    name: 'Infrastructure',
    purpose: 'Containerized services and supporting data systems for a realistic lab and production deployment path.',
    technologies: ['Docker Compose', 'Nginx', 'PostgreSQL', 'Redis', 'Elasticsearch', 'RabbitMQ', 'MinIO'],
    icon: Server,
    color: 'accent-purple',
  },
];

const outcomeCards = [
  { label: 'Secure sharing', detail: 'Policies, TLP handling, trust scoring, and RBAC control who can see and contribute intelligence.', icon: LockKeyhole },
  { label: 'Automated analysis', detail: 'Node.js tools normalize IOCs, anonymize sensitive values, generate STIX 2.1 bundles, and detect patterns.', icon: Workflow },
  { label: 'Interoperability', detail: 'STIX/TAXII exchange and SOC integration pathways for SIEM, SOAR, IDS, and incident response platforms.', icon: GitBranch },
  { label: 'Submission evidence', detail: 'One command regenerates lint/build logs, compose validation, browser smoke results, screenshots, and PDF evidence.', icon: FileText },
];

// Direct mapping from each Spinnaker Analytics project task to implementation artifacts.
const taskAlignment = [
  {
    task: 'Platform Selection & Architecture Design',
    number: '01',
    implementation: 'MISP + OpenCTI + TheHive stack in tisp-infra/docker-compose.yml. Multi-layer architecture with modular ingestion, correlation, response, and visualization components.',
    artifact: 'tisp-infra/docker-compose.yml · docs/TECHNOLOGY_BLUEPRINT.md',
  },
  {
    task: 'Data Sharing Agreements & Governance',
    number: '02',
    implementation: 'Data sharing agreement templates and TLP classification guidance documented. Trust model implemented as Keycloak RBAC with four roles: admin, analyst, responder, observer.',
    artifact: 'submission/deliverables/ · src/auth/ProtectedRoute.jsx',
  },
  {
    task: 'Data Collection & Automated Analysis',
    number: '03',
    implementation: 'IOC normalizer, pattern detector, and anonymization pipeline implemented as dependency-free Node.js modules. Processes indicators from multiple simulated orgs.',
    artifact: 'tisp-tools/src/normalize-iocs.mjs · stix-bundler.mjs · pattern-detector.mjs',
  },
  {
    task: 'Standards Compliance & Interoperability',
    number: '04',
    implementation: 'STIX 2.1 bundle generation with SCO/SDO distinction. TAXII-compatible export format. Integration pathways modelled for SIEM, SOAR, and IDS in the Architecture Map.',
    artifact: 'tisp-tools/src/stix-bundler.mjs · tisp-tools/out/stix-bundle.json',
  },
  {
    task: 'Security & Privacy Controls',
    number: '05',
    implementation: 'RS256 JWT verification via JWKS (no symmetric fallback). TLS at Nginx edge. Data anonymization before sharing. API keys isolated server-side in the proxy vault.',
    artifact: 'tisp-proxy/src/verify-jwt.js · tisp-tools/src/anonymize.mjs · tisp-infra/nginx/',
  },
  {
    task: 'Authentication & Authorization',
    number: '06',
    implementation: 'Keycloak 24 with OIDC/PKCE S256. MFA-capable authentication flows. RBAC enforced at route level — Identity & RBAC page requires admin role to access.',
    artifact: 'src/auth/AuthProvider.jsx · src/auth/ProtectedRoute.jsx · tisp-infra/docker-compose.yml',
  },
  {
    task: 'Integration & Collaboration Tools',
    number: '07',
    implementation: 'TheHive case management with assign/escalate actions wired to the live API. n8n automation engine for triggered response workflows. Collaboration channel status linked to case queue.',
    artifact: 'src/components/TheHiveNode.jsx · src/components/AutomationNode.jsx',
  },
  {
    task: 'Monitoring & Reporting',
    number: '08',
    implementation: 'Executive Dashboard with Recharts KPI metrics. Grafana monitoring stack. IAM audit function queries live upstream service health. Access log stream on the Identity page.',
    artifact: 'src/components/Overview.jsx · src/components/IdentityNode.jsx · tisp-infra/docker-compose.yml',
  },
  {
    task: 'Compliance & Regulatory Alignment',
    number: '09',
    implementation: 'GDPR data minimization via anonymization tools. ISO 27001 A.9 access control via Keycloak. NIST CSF Protect/Detect via audit logs and Grafana. Full compliance matrix documented.',
    artifact: 'docs/PROJECT_COMPLETION_MATRIX.md · submission/deliverables/',
  },
];

const installFlow = [
  { step: '1', title: 'Run the launcher', detail: 'Start-SentinelMesh.bat on Windows, or ./install.sh on Linux/macOS.' },
  { step: '2', title: 'Bootstrap dependencies', detail: 'Checks Node.js/npm, installs dashboard packages, creates lab env secrets, builds the UI.' },
  { step: '3', title: 'Validate outputs', detail: 'CTI tools generate STIX bundles and threat reports; lint/build path is verified.' },
  { step: '4', title: 'Open the dashboard', detail: 'The command center starts at http://127.0.0.1:5173 for demo and grading.' },
];

const configRows = [
  ['Local demo', 'install.ps1 / install.sh', 'Dashboard, CTI tool outputs, generated lab .env'],
  ['Submission test', 'scripts/test-submission.ps1', 'Logs, screenshots, browser smoke, PDF report'],
  ['Docker lab', 'tisp-infra/.env + docker compose', 'MISP, OpenCTI, TheHive, Keycloak, n8n stack'],
  ['Production overlay', 'tisp-infra/.env.prod + Nginx TLS', 'Reverse proxy, secret validation, backup/smoke-test runbooks'],
];

const demoScript = [
  'Open the Executive Dashboard — show overall platform readiness and KPIs.',
  'Open Technology Blueprint — explain the stack and project task alignment.',
  'Open Architecture Map — trace the data flow from source orgs to the proxy vault.',
  'Open MISP, OpenCTI, and TheHive — demonstrate ingestion, correlation, and incident response.',
  'Open Project Settings — show lab vs production posture and integration status.',
];

const CommandBlock = ({ children }) => (
  <pre className="overflow-x-auto rounded-lg border border-outline bg-background p-4 font-mono text-xs leading-6 text-on-surface">
    {children}
  </pre>
);

const TechnologyBlueprint = () => {
  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden bg-slate-950/40">
      <HolographicHeader
        title="TECHNOLOGY_BLUEPRINT"
        subtitle="Stack architecture, project task alignment, and installation guide"
        icon={Rocket}
      />

      <div className="custom-scrollbar relative z-10 grid flex-1 grid-cols-12 gap-4 overflow-y-auto p-4 md:p-6 xl:gap-6 xl:p-8">

        {/* What this delivers */}
        <div className="col-span-12 xl:col-span-8">
          <BrilliantCard title="What This Project Delivers" icon={BookOpen}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {outcomeCards.map((item) => (
                <div key={item.label} className="rounded-lg border border-outline bg-background/45 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icon size={19} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-on-surface">{item.label}</h3>
                      <p className="mt-2 text-sm leading-6 text-on-surface-muted">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </BrilliantCard>
        </div>

        {/* One-click start */}
        <div className="col-span-12 xl:col-span-4">
          <BrilliantCard title="One-Click Start" icon={Terminal}>
            <div className="space-y-4">
              <CommandBlock>{'.\\Start-SentinelMesh.bat\n# or\n.\\install.ps1'}</CommandBlock>
              <p className="text-sm leading-6 text-on-surface-muted">
                The default launcher prepares the demo, starts the local dashboard, and opens the app in the browser. Docker lab startup is optional.
              </p>
              <div className="rounded-lg border border-success/25 bg-success/10 p-3 text-sm font-semibold text-success">
                One command for demo — explicit flags for Docker actions.
              </div>
            </div>
          </BrilliantCard>
        </div>

        {/* Project task alignment — the key section for graders */}
        <div className="col-span-12">
          <BrilliantCard title="Project Task Alignment" icon={ClipboardList}>
            <p className="mb-5 text-sm text-on-surface-muted">
              Each of the 9 Spinnaker Analytics project tasks maps directly to a specific implementation artifact in this repository.
            </p>
            <div className="space-y-3">
              {taskAlignment.map((item) => (
                <div key={item.number} className="rounded-lg border border-outline bg-background/45 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-6">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
                      {item.number}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <h3 className="text-sm font-bold text-on-surface">{item.task}</h3>
                      <p className="text-sm leading-6 text-on-surface-muted">{item.implementation}</p>
                      <p className="font-mono text-xs text-primary/80">{item.artifact}</p>
                    </div>
                    <CheckCircle2 className="hidden shrink-0 text-success md:block" size={18} />
                  </div>
                </div>
              ))}
            </div>
          </BrilliantCard>
        </div>

        {/* Technology stack */}
        <div className="col-span-12">
          <BrilliantCard title="Technology Stack" icon={Layers3}>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
              {stackLayers.map((layer) => {
                const colorClasses = tone(layer.color);
                return (
                  <div key={layer.name} className={`rounded-lg border ${colorClasses.border20} ${colorClasses.bg5} p-4`}>
                    <div className="mb-4 flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClasses.bg10} ${colorClasses.text}`}>
                        <layer.icon size={19} />
                      </div>
                      <h3 className="text-base font-bold text-on-surface">{layer.name}</h3>
                    </div>
                    <p className="min-h-20 text-sm leading-6 text-on-surface-muted">{layer.purpose}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {layer.technologies.map((tech) => (
                        <span key={tech} className="rounded-md border border-outline bg-background/60 px-2 py-1 text-[11px] font-semibold text-on-surface-muted">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </BrilliantCard>
        </div>

        {/* Install flow */}
        <div className="col-span-12 xl:col-span-7">
          <BrilliantCard title="Installation Flow" icon={Rocket}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {installFlow.map((item) => (
                <div key={item.step} className="rounded-lg border border-outline bg-background/45 p-4">
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-on-surface">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-on-surface-muted">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </BrilliantCard>
        </div>

        {/* Demo commands */}
        <div className="col-span-12 xl:col-span-5">
          <BrilliantCard title="Demo Commands" icon={Terminal}>
            <CommandBlock>{'.\\install.ps1\n.\\install.ps1 -Mode Validate\n.\\install.ps1 -Mode Lab\n.\\install.ps1 -Mode Lab -StartLabStack'}</CommandBlock>
            <p className="mt-3 text-sm leading-6 text-on-surface-muted">
              The Docker stack is not started unless the user passes <code className="rounded bg-white/5 px-1.5 py-0.5">-StartLabStack</code>.
            </p>
          </BrilliantCard>
        </div>

        {/* Config levels */}
        <div className="col-span-12 xl:col-span-7">
          <BrilliantCard title="Configuration Levels" icon={Database}>
            <div className="space-y-3">
              {configRows.map(([level, command, output]) => (
                <div key={level} className="grid grid-cols-1 gap-3 rounded-lg border border-outline bg-background/45 p-4 md:grid-cols-[0.8fr_1fr_1.4fr]">
                  <p className="text-sm font-bold text-on-surface">{level}</p>
                  <p className="font-mono text-xs text-primary">{command}</p>
                  <p className="text-sm leading-5 text-on-surface-muted">{output}</p>
                </div>
              ))}
            </div>
          </BrilliantCard>
        </div>

        {/* Grading demo path */}
        <div className="col-span-12 xl:col-span-5">
          <BrilliantCard title="Grading Demo Path" icon={Globe2}>
            <div className="space-y-3">
              {demoScript.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-lg border border-outline bg-background/45 p-3">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-success" size={18} />
                  <p className="text-sm leading-6 text-on-surface-muted">{item}</p>
                </div>
              ))}
            </div>
          </BrilliantCard>
        </div>
      </div>
    </div>
  );
};

export default TechnologyBlueprint;
