import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Activity,
  Bug,
  Database,
  FileText,
  GitBranch,
  Globe2,
  Network,
  RadioTower,
  SearchCheck,
  Server,
  Share2,
  ShieldCheck,
  Target,
  Workflow,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { HolographicHeader, BrilliantCard } from './HUDComponents';
import { tone } from '../lib/uiTokens';

const metrics = [
  { label: 'Entities', value: '4,281', icon: Target, color: 'primary', spark: [42, 58, 52, 73, 88, 81] },
  { label: 'Relationships', value: '12.8M', icon: Network, color: 'accent-green', spark: [62, 68, 80, 77, 92, 96] },
  { label: 'Sources', value: '84', icon: Database, color: 'accent-blue', spark: [22, 31, 36, 49, 55, 61] },
  { label: 'Cases Linked', value: '24', icon: ShieldCheck, color: 'accent-purple', spark: [18, 26, 44, 41, 53, 70] },
];

const flowNodes = [
  {
    id: 'report',
    x: 17,
    y: 26,
    label: 'Report',
    type: 'Source report',
    title: 'ORG-C DFIR report',
    detail: 'VPN abuse, credential replay, and suspicious PowerShell activity validated from a partner incident report.',
    meta: 'Confidence 0.92',
    icon: FileText,
    color: 'accent-blue',
  },
  {
    id: 'identity',
    x: 83,
    y: 25,
    label: 'Target',
    type: 'Threat object',
    title: 'Credential access',
    detail: 'Identity-focused threat object mapped to exposed roles, replayed sessions, and privileged account risk.',
    meta: 'TLP:AMBER',
    icon: Target,
    color: 'accent-rose',
  },
  {
    id: 'campaign',
    x: 50,
    y: 34,
    label: 'Campaign',
    type: 'Core entity',
    title: 'Credential intrusion cluster',
    detail: 'OpenCTI correlation point joining source reports, malware, infrastructure, indicators, and response cases.',
    meta: 'STIX core',
    icon: Network,
    color: 'primary',
    large: true,
  },
  {
    id: 'malware',
    x: 27,
    y: 55,
    label: 'Malware',
    type: 'Malware family',
    title: 'Loader hash family',
    detail: 'Twelve related samples, two YARA hits, and repeatable callback timing across submissions.',
    meta: '12 samples',
    icon: Bug,
    color: 'accent-purple',
  },
  {
    id: 'ttp',
    x: 74,
    y: 55,
    label: 'TTP',
    type: 'ATT&CK technique',
    title: 'T1059 PowerShell',
    detail: 'Technique mapping for staged execution and early persistence validation.',
    meta: 'MITRE mapped',
    icon: GitBranch,
    color: 'primary',
  },
  {
    id: 'infra',
    x: 19,
    y: 78,
    label: 'Infra',
    type: 'Infrastructure',
    title: 'C2 domain mesh',
    detail: 'Six domains, two ASNs, and certificate reuse grouped into a shared infrastructure object.',
    meta: '6 domains',
    icon: Server,
    color: 'accent-green',
  },
  {
    id: 'indicator',
    x: 54,
    y: 78,
    label: 'IOC',
    type: 'Indicator',
    title: '185.199.110.0/24',
    detail: 'Anonymized indicator set ready for TAXII export after TLP and privacy checks.',
    meta: 'STIX export',
    icon: RadioTower,
    color: 'accent-blue',
  },
  {
    id: 'case',
    x: 84,
    y: 78,
    label: 'Case',
    type: 'Response case',
    title: 'TheHive C-4042',
    detail: 'Containment playbook with OpenCTI context attached for coordinated response.',
    meta: 'SLA active',
    icon: ShieldCheck,
    color: 'accent-green',
  },
];

const svgPointForNode = (id) => {
  const node = flowNodes.find((item) => item.id === id);
  return { x: node.x * 12, y: node.y * 6.2 };
};

const flowLinks = [
  { from: 'report', to: 'campaign', controls: [[325, 130], [470, 148]], stroke: '#0284c7', duration: 6.2, delay: 0 },
  { from: 'identity', to: 'campaign', controls: [[880, 125], [732, 146]], stroke: '#e11d48', duration: 6.6, delay: 0.35 },
  { from: 'campaign', to: 'malware', controls: [[520, 274], [420, 322]], stroke: '#7c3aed', duration: 7, delay: 0.8 },
  { from: 'campaign', to: 'ttp', controls: [[690, 274], [800, 322]], stroke: '#1d4ed8', duration: 7.4, delay: 1.05 },
  { from: 'malware', to: 'infra', controls: [[300, 398], [255, 440]], stroke: '#059669', duration: 6.3, delay: 1.45 },
  { from: 'infra', to: 'indicator', controls: [[355, 520], [510, 520]], stroke: '#0284c7', duration: 6.8, delay: 1.8 },
  { from: 'indicator', to: 'case', controls: [[760, 520], [895, 520]], stroke: '#059669', duration: 7.1, delay: 2.2 },
  { from: 'campaign', to: 'indicator', controls: [[612, 330], [622, 404]], stroke: '#1d4ed8', duration: 6.5, delay: 2.55 },
];

const flowPaths = flowLinks.map((link) => {
  const start = svgPointForNode(link.from);
  const end = svgPointForNode(link.to);
  const [[x1, y1], [x2, y2]] = link.controls;
  return {
    ...link,
    d: `M${start.x} ${start.y} C${x1} ${y1} ${x2} ${y2} ${end.x} ${end.y}`,
  };
});

const signalSeries = [
  { time: '08:00', observed: 18, correlated: 7 },
  { time: '10:00', observed: 29, correlated: 13 },
  { time: '12:00', observed: 44, correlated: 24 },
  { time: '14:00', observed: 38, correlated: 27 },
  { time: '16:00', observed: 62, correlated: 41 },
  { time: '18:00', observed: 71, correlated: 55 },
];

const relationshipBars = [
  { type: 'Malware', count: 38 },
  { type: 'Infra', count: 52 },
  { type: 'TTP', count: 29 },
  { type: 'Reports', count: 64 },
  { type: 'Cases', count: 24 },
];

const sourceRows = [
  { name: 'ORG-C DFIR', grade: 'A', detail: 'Validated internal incident report', color: 'accent-green' },
  { name: 'MISP feed', grade: 'B+', detail: 'Community sightings, 6 hour lag', color: 'accent-blue' },
  { name: 'OSINT monitor', grade: 'B', detail: 'Domain and ASN enrichment', color: 'primary' },
];

const flowStats = [
  { label: 'Live STIX edges', value: '8,412', color: 'primary' },
  { label: 'TAXII exports', value: '316/hr', color: 'accent-green' },
  { label: 'Policy blocks', value: '19', color: 'accent-rose' },
  { label: 'Mean confidence', value: '0.84', color: 'accent-blue' },
];

const MetricCard = ({ metric }) => {
  const colorClasses = tone(metric.color);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel hud-scanline flex min-w-0 items-center justify-between gap-4 p-4"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${colorClasses.bg10} ${colorClasses.text}`}>
          <metric.icon size={21} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-on-surface-muted">{metric.label}</p>
          <p className="truncate text-xl font-bold text-on-surface">{metric.value}</p>
        </div>
      </div>
      <div className="hidden h-10 w-24 items-end gap-1 sm:flex">
        {metric.spark.map((value, index) => (
          <span
            key={`${metric.label}-${index}`}
            className={`w-2 rounded-t ${colorClasses.bg}`}
            style={{ height: `${Math.max(value / 2.4, 10)}px`, opacity: 0.35 + index * 0.09 }}
          />
        ))}
      </div>
    </motion.div>
  );
};

const FlowNode = ({ node, activeNode, setActiveNode, onSelect }) => {
  const colorClasses = tone(node.color);
  const Icon = node.icon;
  const isActive = activeNode === node.id;
  const isMuted = activeNode && !isActive;
  const popoverPosition = node.x > 72 ? 'left' : node.y > 66 ? 'top' : 'right';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 18 }}
      className={`opencti-graph-node ${node.large ? 'opencti-graph-node--large' : ''} ${isActive ? 'is-active' : ''} ${isMuted ? 'is-muted' : ''}`}
      data-flow-node={node.id}
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
      onMouseEnter={() => setActiveNode(node.id)}
      onMouseLeave={() => setActiveNode(null)}
      onFocus={() => setActiveNode(node.id)}
      onBlur={() => setActiveNode(null)}
    >
      <button
        type="button"
        className={`opencti-orb ${colorClasses.border20}`}
        aria-label={`${node.title} ${node.meta}`}
        onClick={() => { onSelect(node); toast.info(`Viewing: ${node.label}`); }}
      >
        <span className={`opencti-orb__glow ${colorClasses.bg}`} />
        <span className={`opencti-orb__icon ${colorClasses.bg10} ${colorClasses.text}`}>
          <Icon size={node.large ? 24 : 20} />
        </span>
        <span className="opencti-orb__label">{node.label}</span>
      </button>
      <div className={`opencti-popover opencti-popover--${popoverPosition}`}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className={`text-[10px] font-black uppercase ${colorClasses.text}`}>{node.type}</span>
          <span className="rounded-md bg-surface-low px-2 py-1 text-[10px] font-bold text-on-surface-muted">{node.meta}</span>
        </div>
        <h4 className="text-sm font-black leading-5 text-on-surface">{node.title}</h4>
        <p className="mt-2 text-xs leading-5 text-on-surface-muted">{node.detail}</p>
      </div>
    </motion.div>
  );
};

const OpenCTIDataFlowScene = () => {
  const [activeNode, setActiveNode] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);

  return (
    <>
      <div className="opencti-stage opencti-stage--wireframe mt-4">
        <div className="opencti-stage__grid" />
        <div className="opencti-stage__orbit opencti-stage__orbit--one" />
        <div className="opencti-stage__orbit opencti-stage__orbit--two" />

        <svg className="opencti-flow-map" viewBox="0 0 1200 620" role="img" aria-label="Animated OpenCTI node and wire graph">
          <defs>
            <filter id="openctiGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="openctiBackbone" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {flowPaths.map((path, index) => {
            const isActive = activeNode && (path.from === activeNode || path.to === activeNode);
            const isMuted = activeNode && !isActive;

            return (
              <g key={`${path.from}-${path.to}`} className={isMuted ? 'is-muted' : ''}>
                <path
                  id={`flow-path-${index}`}
                  className={`opencti-wire ${isActive ? 'opencti-wire--active' : ''}`}
                  d={path.d}
                  stroke={path.stroke}
                  style={{ animationDuration: `${path.duration}s`, animationDelay: `${path.delay}s` }}
                />
                <circle className={`opencti-packet ${isActive ? 'opencti-packet--active' : ''}`} r={isActive ? 7 : 5} fill={path.stroke} filter="url(#openctiGlow)">
                  <animateMotion dur={`${path.duration}s`} begin={`${path.delay}s`} repeatCount="indefinite" path={path.d} />
                </circle>
              </g>
            );
          })}
          {flowNodes.map((node) => {
            const point = svgPointForNode(node.id);

            return (
              <g key={`socket-${node.id}`} className="opencti-wire-socket">
                <circle cx={point.x} cy={point.y} r={node.large ? 52 : 42} />
                <circle cx={point.x} cy={point.y} r={node.large ? 18 : 14} />
              </g>
            );
          })}
        </svg>

        <div className="opencti-core" style={{ left: '50%', top: '34%' }}>
          <span />
          <span />
          <span />
        </div>

        {flowNodes.map((node) => (
          <FlowNode key={node.id} node={node} activeNode={activeNode} setActiveNode={setActiveNode} onSelect={setSelectedEntity} />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {flowStats.map((stat) => {
          const colorClasses = tone(stat.color);

          return (
            <div key={stat.label} className="rounded-lg border border-outline bg-white/80 p-3">
              <p className="text-[10px] font-bold uppercase text-on-surface-muted">{stat.label}</p>
              <p className={`mt-1 text-base font-black ${colorClasses.text}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {selectedEntity && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-8"
          onClick={() => setSelectedEntity(null)}
        >
          <div
            className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6 max-w-2xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${tone(selectedEntity.color).text}`}>{selectedEntity.type}</p>
                <h3 className="text-xl font-black text-on-surface">{selectedEntity.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEntity(null)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="text-slate-400 hover:text-cyan-400" size={22} />
              </button>
            </div>
            <p className="text-sm leading-6 text-on-surface-muted mb-4">{selectedEntity.detail}</p>
            <div className="flex items-center gap-3">
              <span className={`rounded-md px-3 py-1 text-[11px] font-bold ${tone(selectedEntity.color).bg10} ${tone(selectedEntity.color).text}`}>
                {selectedEntity.label}
              </span>
              <span className="rounded-md bg-surface-low px-3 py-1 text-[11px] font-bold text-on-surface-muted">
                {selectedEntity.meta}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const OpenCTINode = () => {
  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden bg-slate-950/40">
      <HolographicHeader
        title="OPEN_CTI_NEXUS"
        subtitle="OpenCTI node graph for STIX correlation, source reliability, and response handoff"
        icon={Share2}
      />

      <div className="custom-scrollbar relative z-10 grid flex-1 grid-cols-12 gap-4 overflow-y-auto p-4 md:p-6 xl:gap-6 xl:p-8">
        <div className="col-span-12">
          <BrilliantCard title="Threat Relationship Graph" icon={Network} className="hud-scanline">
            <div className="flex flex-col gap-3 rounded-lg border border-outline bg-white/70 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-black text-on-surface">Credential access topology</h3>
                <p className="mt-1 text-sm leading-6 text-on-surface-muted">Compact OpenCTI entities connected by animated STIX relationship wires.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                <SearchCheck size={16} /> STIX 2.1 mapped
              </span>
            </div>
            <OpenCTIDataFlowScene />
          </BrilliantCard>
        </div>

        <div className="col-span-12 grid grid-cols-1 gap-4 xl:grid-cols-4">
          <BrilliantCard title="Signal Velocity" icon={Globe2}>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={signalSeries} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="observedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.34} />
                      <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="correlatedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(15,23,42,0.08)" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ border: '1px solid rgba(15,23,42,0.12)', borderRadius: 8, color: '#0f172a' }}
                    labelStyle={{ color: '#0f172a', fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="observed" stroke="#1d4ed8" strokeWidth={2.4} fill="url(#observedGradient)" />
                  <Area type="monotone" dataKey="correlated" stroke="#059669" strokeWidth={2.4} fill="url(#correlatedGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </BrilliantCard>

          <BrilliantCard title="Relationship Mix" icon={Workflow}>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={relationshipBars} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(15,23,42,0.08)" vertical={false} />
                  <XAxis dataKey="type" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ border: '1px solid rgba(15,23,42,0.12)', borderRadius: 8, color: '#0f172a' }}
                    labelStyle={{ color: '#0f172a', fontWeight: 700 }}
                  />
                  <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </BrilliantCard>

          <BrilliantCard title="Source Reliability" icon={Database}>
            <div className="space-y-3">
              {sourceRows.map((source) => {
                const colorClasses = tone(source.color);

                return (
                  <div key={source.name} className="rounded-lg border border-outline bg-white/70 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-bold text-on-surface">{source.name}</p>
                      <span className={`rounded-lg border ${colorClasses.border20} ${colorClasses.bg10} px-2 py-1 text-xs font-bold ${colorClasses.text}`}>
                        {source.grade}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-on-surface-muted">{source.detail}</p>
                  </div>
                );
              })}
            </div>
          </BrilliantCard>

          <BrilliantCard title="Correlation Controls" icon={Activity}>
            <div className="grid grid-cols-2 gap-3">
              {['MISP ingest', 'TAXII export', 'YARA match', 'Case sync'].map((control, index) => (
                <div key={control} className="rounded-lg border border-outline bg-white/70 p-3">
                  <p className="text-[11px] font-bold text-on-surface-muted">{control}</p>
                  <p className="mt-1 text-sm font-black text-on-surface">{index === 1 ? '316/hr' : 'Live'}</p>
                </div>
              ))}
            </div>
          </BrilliantCard>
        </div>

        <div className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OpenCTINode;
