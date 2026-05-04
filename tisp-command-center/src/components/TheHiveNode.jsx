import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Activity,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  Search,
  Shield,
  ShieldAlert,
  Target,
  Users,
} from 'lucide-react';
import { HolographicHeader, BrilliantCard, DataPulse } from './HUDComponents';
import { tone } from '../lib/uiTokens';
import { platformAPI } from '../lib/platformAPI';
import { usePlatform } from '../state/PlatformContext';

const filterTabs = [
  { id: 'all', label: 'All active' },
  { id: 'my', label: 'My cases' },
  { id: 'resolved', label: 'Resolved' },
];

const responders = [
  { name: 'Malware Queue', role: 'Malware triage', status: 'Available' },
  { name: 'SOC Queue', role: 'SOC L1', status: 'Monitoring' },
  { name: 'Platform Queue', role: 'External response', status: 'On case' },
];

const severityStyles = {
  Critical: {
    border: 'border-accent-rose/35',
    bg: 'bg-accent-rose/10',
    text: 'text-accent-rose',
    bar: 'bg-accent-rose',
  },
  High: {
    border: 'border-warning/35',
    bg: 'bg-warning/10',
    text: 'text-warning',
    bar: 'bg-warning',
  },
  Medium: {
    border: 'border-primary/35',
    bg: 'bg-primary/10',
    text: 'text-primary',
    bar: 'bg-primary',
  },
};

const initials = (name) =>
  name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

const SeverityBadge = ({ severity }) => {
  const styles = severityStyles[severity] ?? severityStyles.Medium;
  return (
    <span className={`inline-flex items-center rounded-lg border ${styles.border} ${styles.bg} px-2.5 py-1 text-xs font-bold ${styles.text}`}>
      {severity}
    </span>
  );
};

const CaseRow = ({ item, onAssign, onEscalate, isPending }) => {
  const styles = severityStyles[item.severity] ?? severityStyles.Medium;

  return (
    <article className="relative overflow-hidden rounded-lg border border-outline bg-background/50 p-4 transition hover:border-primary/35 hover:bg-surface/70">
      <div className={`absolute inset-y-0 left-0 w-1 ${styles.bar}`} />
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 space-y-3 pl-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-on-surface-muted">{item.id}</span>
            <SeverityBadge severity={item.severity} />
            <span className="rounded-lg border border-outline bg-surface/70 px-2.5 py-1 text-xs font-semibold text-on-surface-muted">
              {item.status}
            </span>
          </div>
          <h3 className="text-base font-bold leading-6 text-on-surface">{item.title}</h3>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-white/5 px-2 py-1 text-[11px] font-semibold text-on-surface-muted">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={(e) => { e.stopPropagation(); onAssign(item.id, item.title); }}
              disabled={isPending}
              className="flex-1 py-1.5 rounded-lg bg-primary/10 border border-primary/25 text-xs font-semibold text-primary hover:bg-primary/20 disabled:opacity-50 transition"
            >
              Assign to me
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEscalate(item.id); }}
              disabled={isPending}
              className="flex-1 py-1.5 rounded-lg bg-warning/10 border border-warning/25 text-xs font-semibold text-warning hover:bg-warning/20 disabled:opacity-50 transition"
            >
              Escalate
            </button>
          </div>
        </div>

        <div className="grid min-w-[260px] grid-cols-2 gap-3 rounded-lg border border-outline bg-surface/45 p-3">
          <div>
            <p className="text-[11px] font-semibold text-on-surface-muted">Responder</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {initials(item.assignee)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-on-surface">{item.assignee}</p>
                <p className="truncate text-[11px] text-on-surface-muted">{item.team}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold text-on-surface-muted">SLA</p>
            <p className={`mt-2 text-lg font-bold tabular-nums ${item.sla === 'Closed' ? 'text-success' : styles.text}`}>{item.sla}</p>
            <p className="text-[11px] text-on-surface-muted">{item.updated}</p>
          </div>
        </div>
      </div>
    </article>
  );
};

const TheHiveNode = () => {
  const { stats, thehiveCases, refresh } = usePlatform();
  const [activeFilter, setActiveFilter] = useState('all');
  const [pendingCaseId, setPendingCaseId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const caseStats = useMemo(() => [
    { label: 'Active cases', value: stats?.thehive?.openCases ?? thehiveCases.filter((item) => item.filter !== 'resolved').length, icon: Activity, color: 'primary' },
    { label: 'Critical open', value: thehiveCases.filter((item) => item.severity === 'Critical' && item.filter !== 'resolved').length, icon: ShieldAlert, color: 'accent-rose' },
    { label: 'Resolved today', value: stats?.thehive?.resolvedCases ?? thehiveCases.filter((item) => item.filter === 'resolved').length, icon: CheckCircle2, color: 'accent-green' },
    { label: 'Median SLA', value: '38m', icon: Clock3, color: 'accent-blue' },
  ], [stats?.thehive?.openCases, stats?.thehive?.resolvedCases, thehiveCases]);

  const filteredCases = useMemo(() => {
    const byTab = activeFilter === 'all'
      ? thehiveCases.filter((item) => item.filter !== 'resolved')
      : thehiveCases.filter((item) => item.filter === activeFilter);
    if (!searchQuery.trim()) return byTab;
    const q = searchQuery.toLowerCase();
    return byTab.filter((c) =>
      c.title?.toLowerCase().includes(q) ||
      c.id?.toLowerCase().includes(q) ||
      c.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [activeFilter, thehiveCases, searchQuery]);

  const handleAssignCase = async (caseId, caseTitle) => {
    setPendingCaseId(caseId);
    try {
      await platformAPI.updateTheHiveCase(caseId, 'assign');
      await refresh();
      toast.success('Case assigned to you', { description: `${caseId}: ${caseTitle}` });
    } catch (err) {
      toast.error('Case assignment failed', { description: err.message });
    } finally {
      setPendingCaseId(null);
    }
  };

  const handleEscalateCase = async (caseId) => {
    setPendingCaseId(caseId);
    try {
      await platformAPI.updateTheHiveCase(caseId, 'escalate');
      await refresh();
      toast.warning('Case escalated to senior analyst', { description: `${caseId} flagged for management review` });
    } catch (err) {
      toast.error('Case escalation failed', { description: err.message });
    } finally {
      setPendingCaseId(null);
    }
  };

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden bg-slate-950/40">
      <HolographicHeader
        title="THE_HIVE_OPERATIONS"
        subtitle="Incident response case queue and collaboration center"
        icon={Shield}
      />

      <div className="custom-scrollbar relative z-10 grid flex-1 grid-cols-12 gap-4 overflow-y-auto p-4 md:p-6 xl:gap-6 xl:p-8">
        <div className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {caseStats.map((stat) => {
            const colorClasses = tone(stat.color);
            return (
              <div key={stat.label} className="glass-panel flex min-w-0 items-center gap-4 p-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${colorClasses.bg10} ${colorClasses.text}`}>
                  <stat.icon size={21} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-on-surface-muted">{stat.label}</p>
                  <p className="truncate text-xl font-bold text-on-surface">{String(stat.value)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="col-span-12 space-y-4 xl:col-span-3">
          <BrilliantCard title="Operational Load" icon={Activity}>
            <div className="space-y-4">
              {[
                ['Critical', 8, 'accent-rose'],
                ['High', 6, 'accent-blue'],
                ['Medium', 4, 'primary'],
                ['Low', 2, 'accent-green'],
              ].map(([label, value, color]) => {
                const colorClasses = tone(color);
                return (
                  <div key={label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-on-surface">{label}</span>
                      <span className={`font-bold tabular-nums ${colorClasses.text}`}>{value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full border border-outline bg-background">
                      <div className={`h-full rounded-full ${colorClasses.bg}`} style={{ width: `${Number(value) * 10}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </BrilliantCard>

          <BrilliantCard title="Response Team" icon={Users}>
            <div className="space-y-3">
              {responders.map((responder) => (
                <div key={responder.name} className="flex items-center justify-between gap-3 rounded-lg border border-outline bg-background/45 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <DataPulse size="sm" color={responder.status === 'Available' ? 'success' : 'primary'} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-on-surface">{responder.name}</p>
                      <p className="truncate text-xs text-on-surface-muted">{responder.role}</p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-white/5 px-2 py-1 text-[11px] font-semibold text-on-surface-muted">{responder.status}</span>
                </div>
              ))}
            </div>
          </BrilliantCard>
        </div>

        <div className="col-span-12 xl:col-span-9">
          <BrilliantCard title="Case Queue" icon={Target}>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex rounded-lg border border-outline bg-background/50 p-1">
                {filterTabs.map((tab) => {
                  const active = activeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFilter(tab.id)}
                      className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                        active ? 'bg-primary text-white' : 'text-on-surface-muted hover:bg-white/5 hover:text-on-surface'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-outline bg-background/50 px-3 py-2 text-on-surface-muted focus-within:border-primary/50 transition">
                <Search size={16} className="shrink-0" />
                <input
                  type="text"
                  placeholder="Search cases"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-44 bg-transparent text-sm text-on-surface placeholder:text-on-surface-muted outline-none"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredCases.length > 0 ? filteredCases.map((item) => (
                <CaseRow key={item.id} item={item} onAssign={handleAssignCase} onEscalate={handleEscalateCase} isPending={pendingCaseId === item.id} />
              )) : (
                <p className="py-8 text-center text-sm text-on-surface-muted">No cases match the current filter.</p>
              )}
            </div>

            <div className="mt-4 rounded-lg border border-outline bg-background/45 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <MessageSquareText className="mt-1 shrink-0 text-primary" size={18} />
                  <div>
                    <p className="text-sm font-bold text-on-surface">Collaboration channel linked</p>
                    <p className="mt-1 text-sm leading-6 text-on-surface-muted">
                      Case comments, observables, MISP events, and OpenCTI context are synchronized for the response team.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 rounded-lg border border-success/25 bg-success/10 px-3 py-2 text-sm font-semibold text-success">
                  <CheckCircle2 size={16} /> Ready
                </span>
              </div>
            </div>
          </BrilliantCard>
        </div>
      </div>
    </div>
  );
};

export default TheHiveNode;
