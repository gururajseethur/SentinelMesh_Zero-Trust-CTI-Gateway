import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Users, ShieldCheck, Key, Fingerprint, Clock, ShieldAlert, UserCheck } from 'lucide-react';
import {
  HolographicHeader,
  BrilliantCard
} from './HUDComponents';
import { tone } from '../lib/uiTokens';
import { platformAPI } from '../lib/platformAPI';

const SESSION_TABS = [
  { id: 'logs', label: 'LIVE_LOGS' },
  { id: 'sessions', label: 'SESSIONS' },
  { id: 'anomalies', label: 'ANOMALIES' },
];

const userSessions = [
  { user: 'Admin_ROOT', ip: '1.42.1.8', action: 'API_KEY_ROTATED', time: '12:44:02', status: 'SUCCESS', role: 'System Administrator', mfa: true, permissions: ['READ_ALL', 'WRITE_ALL', 'DELETE_ALL', 'ADMIN_PANEL'] },
  { user: 'Worker_ALPHA', ip: '172.16.0.4', action: 'NODE_AUTH', time: '12:43:55', status: 'SUCCESS', role: 'Automation Worker', mfa: true, permissions: ['READ_LOGS', 'WRITE_QUEUE', 'EXEC_WORKFLOW'] },
  { user: 'Guest_991', ip: '103.4.1.20', action: 'LOGIN_FAILURE', time: '12:43:40', status: 'DENIED', role: 'External Guest', mfa: false, permissions: [] },
  { user: 'Sys_Watcher', ip: 'LOCAL', action: 'LOG_PURGE', time: '12:43:12', status: 'SUCCESS', role: 'System Service', mfa: true, permissions: ['READ_LOGS', 'PURGE_LOGS'] },
  { user: 'Admin_SEC', ip: '1.42.1.9', action: 'POLICY_UPDATE', time: '12:42:58', status: 'SUCCESS', role: 'Security Admin', mfa: true, permissions: ['READ_ALL', 'WRITE_POLICY', 'AUDIT_LOGS'] },
  { user: 'Anom_User', ip: '92.11.20.1', action: 'DIR_TRAVERSAL', time: '12:42:30', status: 'BLOCKED', role: 'Unknown', mfa: false, permissions: [] },
  { user: 'Worker_BETA', ip: '172.16.0.5', action: 'NODE_AUTH', time: '12:42:01', status: 'SUCCESS', role: 'Automation Worker', mfa: true, permissions: ['READ_LOGS', 'WRITE_QUEUE', 'EXEC_WORKFLOW'] },
];

const riskItems = [
  {
    id: 'PRIV_ESC',
    label: 'Privilege Escalation',
    count: 0,
    status: 'NOMINAL',
    colorClass: 'text-accent-green',
    details: 'No privilege escalation paths detected. All role assignments follow least-privilege principle.',
  },
  {
    id: 'IMPERSONATION',
    label: 'Impersonation Risks',
    count: 2,
    status: 'TRIAGE',
    colorClass: 'text-accent-rose',
    details: 'WORKER_ALPHA and ANOM_USER show suspicious MFA_TRAVERSAL and DIR_TRAVERSAL patterns. Recommend immediate session termination and credential reset.',
  },
  {
    id: 'KEY_ROTATION',
    label: 'Key Rotation Needed',
    count: 14,
    status: 'PENDING',
    colorClass: 'text-primary',
    details: '14 API keys older than 90 days detected. Automated rotation scheduled. Manual verification required for production keys.',
  },
];

const IdentityNode = () => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [expandedRisk, setExpandedRisk] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeSessTab, setActiveSessTab] = useState('logs');

  const visibleSessions = useMemo(() => {
    if (activeSessTab === 'sessions') return userSessions.filter((s) => s.status === 'SUCCESS');
    if (activeSessTab === 'anomalies') return userSessions.filter((s) => s.status === 'DENIED' || s.status === 'BLOCKED');
    return userSessions;
  }, [activeSessTab]);

  const anomalyCount = userSessions.filter((s) => s.status === 'DENIED' || s.status === 'BLOCKED').length;

  const runAuditSuite = async () => {
    setIsAuditing(true);
    toast.info('Running IAM audit — checking upstream service health...');
    try {
      const health = await platformAPI.getHealth();
      const services = ['misp', 'opencti', 'thehive'];
      const upCount = services.filter((s) => health[s]?.status === 'ok').length;
      const summary = services.map((s) => `${s.toUpperCase()}: ${health[s]?.status ?? 'unknown'}`).join(' · ');
      toast.success(`Audit complete: ${upCount}/${services.length} upstream services reachable`, {
        description: summary,
        duration: 6000,
      });
    } catch (err) {
      toast.error('Audit failed', { description: err.message });
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950/40 relative overflow-hidden h-screen font-main">
      <HolographicHeader
        title="IDENTITY_MESH"
        subtitle="IAM Lifecycle Management — Zero Trust Authentication Matrix"
        icon={Fingerprint}
      />

      <div className="flex-1 p-4 md:p-8 xl:p-12 grid grid-cols-12 gap-6 xl:gap-10 overflow-y-auto custom-scrollbar relative z-10">

        {/* Security posture sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-10">
           <BrilliantCard title="Security Posture" icon={ShieldCheck}>
              <div className="space-y-10 pt-6">
                 <div className="text-center relative">
                    <div className="absolute inset-0 bg-accent-green/5 blur-3xl rounded-full" />
                    <h5 className="text-6xl font-black text-white italic tracking-normal tabular-nums drop-shadow-2xl">99.8<span className="text-2xl text-accent-green">%</span></h5>
                    <p className="text-[11px] font-black text-on-surface/30 uppercase tracking-[0.4em] mt-3">Auth_Integrity_Score</p>
                 </div>

                 <div className="space-y-6">
                    {[
                      { label: 'Active Sessions', value: '4,204', icon: Users, color: 'primary' },
                      { label: 'Provisioned Keys', value: '1,288', icon: Key, color: 'accent-purple' },
                      { label: 'MFA Engaged', value: '100.0%', icon: ShieldCheck, color: 'accent-green' }
                    ].map((stat) => {
                      const colorClasses = tone(stat.color);
                      return (
                      <div key={stat.label} className="flex items-center justify-between p-5 glass-card rounded-2xl border border-white/5">
                         <div className="flex items-center gap-4">
                            <div className={`p-2.5 ${colorClasses.bg10} rounded-xl ${colorClasses.text}`}>
                               <stat.icon size={18} />
                            </div>
                            <span className="text-[11px] font-black text-white/60 uppercase tracking-widest">{stat.label}</span>
                         </div>
                         <span className="text-lg font-black text-white tabular-nums">{stat.value}</span>
                      </div>
                      );
                    })}
                 </div>
              </div>
           </BrilliantCard>

           <BrilliantCard title="Risk Scoring" icon={ShieldAlert}>
              <div className="space-y-4 pt-4">
                 {riskItems.map((risk) => (
                   <div key={risk.id} className="space-y-2">
                     <button
                       onClick={() => setExpandedRisk(expandedRisk === risk.id ? null : risk.id)}
                       className="w-full flex items-center justify-between p-4 glass-card rounded-2xl border border-white/5 hover:border-primary/30 transition-all"
                     >
                       <div className="text-left">
                         <p className="text-[11px] font-black text-white uppercase tracking-wider">{risk.label}</p>
                         <p className="text-[9px] font-bold text-on-surface/20 uppercase tracking-[0.2em]">{risk.status}</p>
                       </div>
                       <div className={`text-xl font-black ${risk.colorClass} tabular-nums`}>{risk.count}</div>
                     </button>
                     {expandedRisk === risk.id && (
                       <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5">
                         <p className="text-[11px] text-on-surface/60 leading-5">{risk.details}</p>
                       </div>
                     )}
                   </div>
                 ))}
                 <div className="h-[1px] bg-white/5" />
                 <button
                    onClick={runAuditSuite}
                    disabled={isAuditing}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white font-semibold rounded-2xl transition-all uppercase tracking-[0.3em] text-[10px]"
                 >
                    {isAuditing ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                        Checking services...
                      </span>
                    ) : (
                      'Run IAM Audit'
                    )}
                 </button>
              </div>
           </BrilliantCard>
        </div>

        {/* Access log */}
        <div className="col-span-12 lg:col-span-8 space-y-10">
           <BrilliantCard title="Global Access Stream" icon={Clock}>
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4 bg-white/5 p-1 rounded-2xl border border-white/5">
                    {SESSION_TABS.map((tab) => {
                      const active = activeSessTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => { setActiveSessTab(tab.id); setSelectedSession(null); }}
                          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            active ? 'bg-white/10 text-white' : 'text-on-surface/30 hover:text-white'
                          }`}
                        >
                          {tab.label}
                          {tab.id === 'anomalies' && anomalyCount > 0 && (
                            <span className="ml-2 rounded-full bg-accent-rose/20 px-1.5 py-0.5 text-[9px] text-accent-rose">
                              {anomalyCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                 </div>
                 <span className="text-[9px] font-bold text-on-surface/20 uppercase tracking-[0.4em]">
                   {visibleSessions.length} entries
                 </span>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[700px] custom-scrollbar pr-4">
                 {visibleSessions.length === 0 ? (
                   <p className="py-12 text-center text-sm text-on-surface-muted">
                     {activeSessTab === 'anomalies' ? 'No anomalies detected.' : 'No entries.'}
                   </p>
                 ) : visibleSessions.map((session, i) => (
                    <div key={i} className="space-y-2">
                      <motion.button
                        onClick={() => setSelectedSession(selectedSession === i ? null : i)}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="group w-full flex flex-col md:flex-row md:items-center justify-between p-6 glass-card rounded-[2.5rem] border border-white/5 hover:border-primary/30 transition-all gap-6 shadow-xl"
                      >
                         <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${session.status === 'SUCCESS' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-rose/10 text-accent-rose'}`}>
                               {session.status === 'SUCCESS' ? <UserCheck size={28} /> : <ShieldAlert size={28} />}
                            </div>
                            <div className="text-left">
                               <h6 className="text-[14px] font-black text-white italic uppercase tracking-normal group-hover:text-primary transition-colors">{session.user}</h6>
                               <div className="flex items-center gap-4 mt-2">
                                  <span className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest">{session.ip === 'LOCAL' ? 'SYSTEM_INTERNAL' : session.ip}</span>
                                  <div className="w-1 h-1 bg-white/10 rounded-full" />
                                  <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest italic">{session.action}</span>
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-8">
                            <div className="text-right">
                               <p className="text-[9px] font-black text-on-surface/20 uppercase tracking-widest mb-1">Status</p>
                               <span className={`text-[10px] font-black uppercase tracking-widest ${session.status === 'SUCCESS' ? 'text-accent-green' : 'text-accent-rose'}`}>{session.status}</span>
                            </div>
                            <div className="w-[1px] h-10 bg-white/5" />
                            <div className="text-right">
                               <p className="text-[9px] font-black text-on-surface/20 uppercase tracking-widest mb-1">Time</p>
                               <span className="text-[10px] font-mono font-bold text-white/40">{session.time}</span>
                            </div>
                         </div>
                      </motion.button>
                      {selectedSession === i && (
                        <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[9px] font-black text-on-surface/20 uppercase tracking-widest mb-1">Role</p>
                              <p className="text-[11px] font-bold text-white">{session.role}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-on-surface/20 uppercase tracking-widest mb-1">MFA</p>
                              <p className={`text-[11px] font-bold ${session.mfa ? 'text-accent-green' : 'text-accent-rose'}`}>
                                {session.mfa ? 'Enabled' : 'Disabled'}
                              </p>
                            </div>
                          </div>
                          {session.permissions.length > 0 && (
                            <div>
                              <p className="text-[9px] font-black text-on-surface/20 uppercase tracking-widest mb-2">Permissions</p>
                              <div className="flex flex-wrap gap-1">
                                {session.permissions.map(perm => (
                                  <span key={perm} className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded-lg border border-primary/20 font-bold">
                                    {perm}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                 ))}
              </div>
           </BrilliantCard>
        </div>
      </div>
    </div>
  );
};

export default IdentityNode;
