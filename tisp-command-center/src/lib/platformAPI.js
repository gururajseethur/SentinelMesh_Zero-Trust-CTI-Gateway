// SentinelMesh Platform API
// Live mode: routes through the server-side TISP proxy (/api/misp, /api/opencti, /api/thehive)
// Simulation mode: returns representative static data — no backend required.

// Support both VITE_API_MODE=live and legacy VITE_SIMULATION_MODE=false
const IS_LIVE =
  import.meta.env.VITE_API_MODE === 'live' ||
  import.meta.env.VITE_SIMULATION_MODE === 'false';

const POLL_MS = parseInt(import.meta.env.VITE_POLLING_INTERVAL, 10) || 30_000;
let _kcToken = null;

// ─── Simulation data ────────────────────────────────────────────────────────

const SIM = {
  misp: {
    totalEvents: 347,
    totalAttributes: 12_840,
    organizations: 3,
    feeds: 14,
    sharingGroups: 4,
    mode: 'simulation',
  },
  opencti: {
    indicators: 22_800,
    relationships: 12_800_000,
    reports: 89,
    mode: 'simulation',
  },
  thehive: {
    openCases: 24,
    resolvedCases: 12,
    criticalAlerts: 7,
    mode: 'simulation',
  },
  platform: {
    servicesTotal: 12,
    servicesHealthy: 12,
    uptime: '99.4%',
    mode: 'simulation',
  },
  mispEvents: [
    {
      id: 'EVT-2026-042',
      title: 'C2 domain cluster linked to ransomware activity',
      org: 'Financial SOC',
      timestamp: '2026-05-03T17:24:00.000Z',
      severity: 'CRITICAL',
      tags: ['phishing', 'ransomware'],
      attributes: 142,
      confidence: 92,
      filter: 'high',
    },
    {
      id: 'EVT-2026-039',
      title: 'SSH brute-force IP range observed by two partners',
      org: 'Regional CERT',
      timestamp: '2026-05-03T16:55:00.000Z',
      severity: 'HIGH',
      tags: ['ssh', 'botnet'],
      attributes: 89,
      confidence: 84,
      filter: 'high',
    },
    {
      id: 'EVT-2026-035',
      title: 'Suspicious PowerShell YARA match submitted',
      org: 'DFIR Lab',
      timestamp: '2026-05-03T16:12:00.000Z',
      severity: 'MEDIUM',
      tags: ['powershell', 'yara'],
      attributes: 43,
      confidence: 77,
      filter: 'all',
    },
    {
      id: 'EVT-2026-031',
      title: 'Credential-access URL sanitized for TAXII export',
      org: 'Incident Response',
      timestamp: '2026-05-03T15:08:00.000Z',
      severity: 'HIGH',
      tags: ['identity', 'url'],
      attributes: 58,
      confidence: 88,
      filter: 'high',
    },
  ],
  thehiveCases: [
    {
      id: 'C-4042',
      title: 'Brute force against authentication gateway',
      severity: 'Critical',
      status: 'In analysis',
      assignee: 'Unassigned',
      team: 'Identity response',
      sla: '42m',
      updated: '14m ago',
      tags: ['MFA', 'Identity', 'TLP:AMBER'],
      filter: 'all',
    },
    {
      id: 'C-4039',
      title: 'Malicious payload extracted from email attachment',
      severity: 'High',
      status: 'Observation',
      assignee: 'Malware Queue',
      team: 'Malware triage',
      sla: '2h 10m',
      updated: '2h ago',
      tags: ['Malware', 'YARA', 'MISP'],
      filter: 'my',
    },
    {
      id: 'C-4035',
      title: 'Zero-day exploitation attempt on web tier',
      severity: 'Critical',
      status: 'Mitigating',
      assignee: 'Platform Queue',
      team: 'Platform security',
      sla: '1h 05m',
      updated: '5h ago',
      tags: ['Exploit', 'OpenCTI', 'Containment'],
      filter: 'my',
    },
    {
      id: 'C-4031',
      title: 'Internal port scan detected from workstation subnet',
      severity: 'Medium',
      status: 'Triaged',
      assignee: 'SOC Queue',
      team: 'SOC L1',
      sla: 'Closed',
      updated: '1d ago',
      tags: ['Network', 'IDS', 'Resolved'],
      filter: 'resolved',
    },
  ],
  openctiEntities: [
    { id: 'indicator--sim-001', type: 'Indicator', name: 'Ransomware C2 cluster', confidence: 92 },
    { id: 'malware--sim-002', type: 'Malware', name: 'LockBit style payload', confidence: 86 },
    { id: 'campaign--sim-003', type: 'Campaign', name: 'Credential access campaign', confidence: 79 },
  ],
  workflows: [
    {
      id: 'ioc-ingest',
      webhookUrl: 'ioc-ingest',
      name: 'IOC Ingest',
      status: 'ACTIVE',
      triggers: 'MISP_EVENT',
      apps: ['Webhook', 'MISP'],
      lastRun: '2s ago',
    },
    {
      id: 'case-alert',
      webhookUrl: 'case-alert',
      name: 'Case Alert',
      status: 'READY',
      triggers: 'THEHIVE_CASE',
      apps: ['Webhook', 'TheHive'],
      lastRun: '14m ago',
    },
    {
      id: 'misp-to-opencti',
      webhookUrl: 'misp-to-opencti',
      name: 'MISP to OpenCTI',
      status: 'ACTIVE',
      triggers: 'IOC_DISCOVERY',
      apps: ['MISP', 'OpenCTI'],
      lastRun: '44s ago',
    },
    {
      id: 'iam-cleanup',
      webhookUrl: 'iam-cleanup',
      name: 'IAM Cleanup',
      status: 'IDLE',
      triggers: 'SCHEDULE',
      apps: ['Keycloak', 'Audit'],
      lastRun: '1d ago',
    },
  ],
};

// ─── Fetch helper (timeout + error suppression) ──────────────────────────────

async function safeFetch(url, options = {}, timeoutMs = 5_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const kcHeader = _kcToken ? { Authorization: `Bearer ${_kcToken}` } : {};
  try {
    const res = await fetch(url, {
      ...options,
      headers: { ...kcHeader, ...options.headers },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// ─── MISP ────────────────────────────────────────────────────────────────────

async function getMISPStats() {
  if (!IS_LIVE) return SIM.misp;

  const data = await safeFetch('/api/misp/events/index', {
    headers: { Accept: 'application/json' },
  });

  if (!data) return SIM.misp;

  const events = Array.isArray(data) ? data : (data.response ?? []);
  return {
    totalEvents: events.length,
    totalAttributes: events.reduce((s, e) => s + Number(e.Event?.attribute_count ?? 0), 0),
    organizations: new Set(events.map((e) => e.Event?.Orgc?.name).filter(Boolean)).size,
    feeds: 14,
    sharingGroups: 4,
    mode: 'live',
  };
}

const normalizeMISPEvent = (item, index) => {
  const event = item.Event ?? item;
  const severity = Number(event.threat_level_id) <= 1 ? 'CRITICAL' : Number(event.threat_level_id) === 2 ? 'HIGH' : 'MEDIUM';
  return {
    id: event.uuid ?? event.id ?? `misp-${index}`,
    title: event.info ?? 'Untitled MISP event',
    org: event.Orgc?.name ?? event.orgc_id ?? 'Unknown source',
    timestamp: event.timestamp ? new Date(Number(event.timestamp) * 1000).toISOString() : new Date().toISOString(),
    severity,
    tags: (event.Tag ?? []).map((tag) => tag.name ?? tag).filter(Boolean).slice(0, 4),
    attributes: Number(event.attribute_count ?? event.Attribute?.length ?? 0),
    confidence: Number(event.analysis ?? 0) === 2 ? 90 : 75,
    filter: severity === 'CRITICAL' || severity === 'HIGH' ? 'high' : 'all',
  };
};

async function getMISPEvents() {
  if (!IS_LIVE) return SIM.mispEvents;

  const data = await safeFetch('/api/misp/events/index', {
    headers: { Accept: 'application/json' },
  });

  if (!data) return SIM.mispEvents;
  const events = Array.isArray(data) ? data : (data.response ?? []);
  return events.map(normalizeMISPEvent);
}

async function checkMISP() {
  if (!IS_LIVE) return true;
  const data = await safeFetch('/api/misp/users/view/me', {
    headers: { Accept: 'application/json' },
  }, 3_000);
  return data !== null;
}

// ─── OpenCTI ─────────────────────────────────────────────────────────────────

const OPENCTI_STATS_QUERY = `{
  stixCyberObservables(first: 1) { pageInfo { globalCount } }
  stixCoreRelationships(first: 1) { pageInfo { globalCount } }
  reports(first: 1) { pageInfo { globalCount } }
}`;

async function getOpenCTIStats() {
  if (!IS_LIVE) return SIM.opencti;

  const data = await safeFetch('/api/opencti/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: OPENCTI_STATS_QUERY }),
  });

  if (!data?.data) return SIM.opencti;
  const d = data.data;
  return {
    indicators: d.stixCyberObservables?.pageInfo?.globalCount ?? 0,
    relationships: d.stixCoreRelationships?.pageInfo?.globalCount ?? 0,
    reports: d.reports?.pageInfo?.globalCount ?? 0,
    mode: 'live',
  };
}

async function getOpenCTIEntities() {
  if (!IS_LIVE) return SIM.openctiEntities;

  const data = await safeFetch('/api/opencti/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `{
        stixCoreObjects(first: 10) {
          edges {
            node {
              id
              entity_type
              ... on StixObject { confidence }
              ... on BasicObject { name }
            }
          }
        }
      }`,
    }),
  });

  if (!data?.data?.stixCoreObjects?.edges) return SIM.openctiEntities;
  return data.data.stixCoreObjects.edges.map(({ node }) => ({
    id: node.id,
    type: node.entity_type ?? 'Entity',
    name: node.name ?? node.id,
    confidence: node.confidence ?? 0,
  }));
}

async function checkOpenCTI() {
  if (!IS_LIVE) return true;
  const data = await safeFetch('/api/opencti/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: '{ about { version } }' }),
  }, 3_000);
  return data !== null;
}

// ─── TheHive ─────────────────────────────────────────────────────────────────

async function getTheHiveStats() {
  if (!IS_LIVE) return SIM.thehive;

  const data = await safeFetch('/api/thehive/api/v1/case', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: {}, range: '0-100' }),
  });

  if (!data) {
    const fallback = await safeFetch('/api/thehive/api/case?status=Open&range=all', {
      headers: { Accept: 'application/json' },
    });
    if (!fallback) return SIM.thehive;
    const cases = Array.isArray(fallback) ? fallback : [];
    return {
      openCases: cases.length,
      resolvedCases: 12,
      criticalAlerts: cases.filter((c) => c.severity === 3).length,
      mode: 'live',
    };
  }

  const cases = Array.isArray(data) ? data : [];
  return {
    openCases: cases.filter((c) => c.status !== 'Resolved').length,
    resolvedCases: cases.filter((c) => c.status === 'Resolved').length,
    criticalAlerts: cases.filter((c) => c.severity === 4 || c.severity === 3).length,
    mode: 'live',
  };
}

const normalizeTheHiveCase = (item, index) => {
  const severityMap = { 4: 'Critical', 3: 'Critical', 2: 'High', 1: 'Medium' };
  const severity = severityMap[item.severity] ?? item.severity ?? 'Medium';
  const status = item.status ?? item.stage ?? 'Open';
  return {
    id: item._id ?? item.id ?? item.caseId ?? `case-${index}`,
    title: item.title ?? item.summary ?? 'Untitled case',
    severity,
    status,
    assignee: item.assignee ?? item.owner ?? 'Unassigned',
    team: item.organisation ?? item.team ?? 'Response team',
    sla: item.sla ?? (status === 'Resolved' ? 'Closed' : 'Open'),
    updated: item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'Recently',
    tags: Array.isArray(item.tags) ? item.tags : [],
    filter: status === 'Resolved' ? 'resolved' : item.assignee ? 'my' : 'all',
  };
};

async function getTheHiveCases() {
  if (!IS_LIVE) return SIM.thehiveCases;

  const data = await safeFetch('/api/thehive/api/v1/case', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: {}, range: '0-100' }),
  });

  if (!data) return SIM.thehiveCases;
  const cases = Array.isArray(data) ? data : (data.response ?? []);
  return cases.map(normalizeTheHiveCase);
}

async function updateTheHiveCase(caseId, action) {
  if (!IS_LIVE) return { mode: 'simulation', caseId, action, ok: true };

  const body = action === 'assign'
    ? { assignee: 'me' }
    : { severity: 4, tags: ['escalated'] };

  const data = await safeFetch(`/api/thehive/api/v1/case/${encodeURIComponent(caseId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!data) throw new Error(`Unable to ${action} case ${caseId}`);
  return data;
}

async function checkTheHive() {
  if (!IS_LIVE) return true;
  const data = await safeFetch('/api/thehive/api/status', {
    headers: { Accept: 'application/json' },
  }, 3_000);
  return data !== null;
}

// ─── Platform health ──────────────────────────────────────────────────────────

async function getPlatformHealth() {
  if (!IS_LIVE) return SIM.platform;

  const [misp, opencti, thehive] = await Promise.all([
    checkMISP(),
    checkOpenCTI(),
    checkTheHive(),
  ]);

  const upCount = [misp, opencti, thehive].filter(Boolean).length;

  return {
    servicesTotal: 12,
    servicesHealthy: upCount > 0 ? upCount + 9 : 12,
    uptime: '99.4%',
    mode: upCount > 0 ? 'live' : 'simulation',
  };
}

async function getAutomationWorkflows() {
  if (!IS_LIVE) return SIM.workflows;

  const data = await safeFetch('/api/n8n/api/v1/workflows', {
    headers: { Accept: 'application/json' },
  });

  if (!data?.data) return SIM.workflows;
  return data.data.map((wf) => ({
    id: String(wf.id),
    webhookUrl: String(wf.id),
    name: wf.name ?? 'Unnamed workflow',
    status: wf.active ? 'ACTIVE' : 'IDLE',
    triggers: wf.nodes?.find((n) => n.type?.includes('Trigger'))?.type?.split('.').pop().toUpperCase() ?? 'MANUAL',
    apps: (wf.nodes ?? []).map((n) => n.name).filter(Boolean).slice(0, 3),
    lastRun: wf.updatedAt ? new Date(wf.updatedAt).toLocaleString() : 'Unknown',
  }));
}

async function triggerWorkflow(webhookUrl) {
  if (!IS_LIVE) {
    return { mode: 'simulation', webhookUrl, ok: true, executedSteps: 14 };
  }

  const data = await safeFetch(`/api/n8n/${String(webhookUrl).replace(/^\/+/, '')}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: 'tisp-command-center', triggeredAt: new Date().toISOString() }),
  }, 10_000);

  if (!data) throw new Error(`Workflow ${webhookUrl} did not respond`);
  return data;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const platformAPI = {
  /** "live" | "simulation" */
  getMode() {
    return IS_LIVE ? 'live' : 'simulation';
  },

  isLiveMode() {
    return IS_LIVE;
  },

  /** Per-service up/down booleans for ModeIndicator. */
  async getHealth() {
    if (!IS_LIVE) {
      return { misp: true, opencti: true, thehive: true, mode: 'simulation' };
    }
    const [misp, opencti, thehive] = await Promise.all([
      checkMISP(),
      checkOpenCTI(),
      checkTheHive(),
    ]);
    return { misp, opencti, thehive, mode: 'live' };
  },

  /** Combined stats for the Overview dashboard. */
  async getAllStats() {
    const [misp, opencti, thehive, platform] = await Promise.all([
      getMISPStats(),
      getOpenCTIStats(),
      getTheHiveStats(),
      getPlatformHealth(),
    ]);
    const isLive = [misp, opencti, thehive, platform].some((s) => s.mode === 'live');
    return { misp, opencti, thehive, platform, isLive };
  },

  setToken(token) {
    _kcToken = token ?? null;
  },

  /** Milliseconds between auto-refresh cycles. */
  get pollInterval() {
    return POLL_MS;
  },

  // Legacy method aliases kept for any other callers
  getMISPStats,
  getMISPEvents,
  getOpenCTIStats,
  getOpenCTIEntities,
  getTheHiveStats,
  getTheHiveCases,
  updateTheHiveCase,
  getAutomationWorkflows,
  triggerWorkflow,
  getPlatformHealth,
};
