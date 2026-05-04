import React, { useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Zap, Play, Activity, Database, Server, GitMerge, ArrowRight, Settings } from 'lucide-react';
import {
  HolographicHeader,
  BrilliantCard,
  DataPulse
} from './HUDComponents';
import { deterministicSeries, tone } from '../lib/uiTokens';
import { platformAPI } from '../lib/platformAPI';
import { usePlatform } from '../state/PlatformContext';

const WORKER_UTILIZATION_DATA = deterministicSeries('automation-worker-utilization', 12, 30, 100);
const INFRASTRUCTURE_NODES = [
  { label: 'n8n_CORE_PROD', status: 'Optimal', load: 14, color: 'accent-green' },
  { label: 'REDIS_CACHE_01', status: 'Flushing', load: 42, color: 'primary' },
  { label: 'QUEUE_WORKER_04', status: 'Idle', load: 2, color: 'muted' },
];

const WorkflowCard = ({ id, name, status, triggers, apps, lastRun, i, onTrigger, isTriggering }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: i * 0.1 }}
    className="group glass-card p-8 rounded-[3rem] border border-white/5 hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden shadow-2xl"
  >
    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-150 transition-all">
       <GitMerge size={120} />
    </div>

    <div className="flex justify-between items-center mb-8 relative z-10">
       <div className="flex items-center gap-4">
          <DataPulse size="sm" color={status === 'ACTIVE' ? 'success' : 'primary'} />
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">{status}</span>
       </div>
       <div className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
          <Settings size={16} className="text-on-surface/40" />
       </div>
    </div>

    <h4 className="text-xl font-black text-white italic tracking-normal uppercase mb-4 group-hover:text-primary transition-colors">{name}</h4>

    <div className="flex items-center gap-4 mb-8">
       {apps.map((app, idx) => (
          <React.Fragment key={idx}>
             <div className="px-5 py-2 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black text-on-surface/60 uppercase tracking-widest group-hover:border-primary/20">
                {app}
             </div>
             {idx < apps.length - 1 && <ArrowRight size={14} className="text-on-surface/20" />}
          </React.Fragment>
       ))}
    </div>

    <div className="flex items-center justify-between pt-8 border-t border-white/5">
       <div className="flex flex-col">
          <span className="text-[9px] font-black text-on-surface/20 uppercase tracking-widest mb-1">Trigger_Event</span>
          <p className="text-[11px] font-bold text-white/60 tracking-wider">ON_{triggers}</p>
       </div>
       <div className="text-right">
          <p className="text-[9px] font-black text-on-surface/20 uppercase tracking-widest mb-1">Last run</p>
          <p className="text-[11px] font-bold text-on-surface/30 uppercase">{lastRun}</p>
       </div>
    </div>

    <button
      onClick={(e) => { e.stopPropagation(); onTrigger(id, name); }}
      disabled={isTriggering}
      className="mt-6 w-full py-3 bg-accent-green/10 border border-accent-green/25 rounded-2xl text-accent-green hover:bg-accent-green/20 disabled:opacity-50 text-[10px] font-black uppercase tracking-[0.3em] transition-all"
    >
      {isTriggering ? (
        <span className="flex items-center justify-center gap-2">
          <span className="animate-spin h-4 w-4 border-2 border-accent-green border-t-transparent rounded-full inline-block" />
          Executing...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <Play size={14} /> Trigger Now
        </span>
      )}
    </button>
  </motion.div>
);

const AutomationNode = () => {
  const { workflows } = usePlatform();
  const [triggeringWorkflow, setTriggeringWorkflow] = useState(null);

  const triggerWorkflow = async (workflowId, workflowName, webhookUrl) => {
    setTriggeringWorkflow(workflowId);
    toast.info(`Triggering: ${workflowName}`);
    try {
      const result = await platformAPI.triggerWorkflow(webhookUrl);
      toast.success('Workflow executed', {
        description: `${workflowName} completed ${result.executedSteps ?? 'the configured'} steps`,
      });
    } catch (err) {
      toast.error('Workflow failed', { description: err.message });
    } finally {
      setTriggeringWorkflow(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950/40 relative overflow-hidden h-screen font-main">
      <HolographicHeader
        title="AUTOMATION_CONTROL"
        subtitle="n8n Workflow Engine — active response pipelines"
        icon={Zap}
      />

      <div className="flex-1 p-4 md:p-8 xl:p-12 grid grid-cols-12 gap-6 xl:gap-10 overflow-y-auto custom-scrollbar relative z-10">

        {/* Metrics sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-10">
           <BrilliantCard title="Logic Telemetry" icon={Activity}>
              <div className="space-y-10 pt-6">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-8 glass-panel rounded-[2.5rem] border border-white/5 text-center group hover:border-primary/50 transition-all">
                       <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.3em] mb-2">Ex_Efficiency</p>
                       <h5 className="text-4xl font-black text-white italic tabular-nums group-hover:text-primary transition-colors">98.2%</h5>
                    </div>
                    <div className="p-8 glass-panel rounded-[2.5rem] border border-white/5 text-center group hover:border-accent-purple/50 transition-all">
                       <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.3em] mb-2">Worker_Nodes</p>
                       <h5 className="text-4xl font-black text-white italic tabular-nums group-hover:text-accent-purple transition-colors">12/12</h5>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.4em] mb-2 px-2">Worker_Utilization</p>
                    <div className="h-40 flex items-end gap-2 bg-white/5 rounded-3xl p-6 border border-white/5">
                       {WORKER_UTILIZATION_DATA.map((height, i) => (
                          <motion.div
                             key={i}
                             initial={{ height: 0 }}
                             animate={{ height: `${height}%` }}
                             className="flex-1 bg-primary/20 rounded-lg hover:bg-primary transition-all shadow-[0_0_10px_rgba(14,165,233,0.3)]"
                          />
                       ))}
                    </div>
                 </div>

                 <div className="space-y-4 pt-4">
                   <div className="flex items-center gap-4 p-5 glass-card rounded-2xl border border-white/5">
                      <div className="p-3 bg-primary/10 rounded-xl text-primary">
                         <Database size={20} />
                      </div>
                      <div className="flex-1">
                         <p className="text-[11px] font-black text-white uppercase tracking-wider">Log Persistence</p>
                         <p className="text-[9px] font-bold text-on-surface/30 uppercase">42.2 GB Stored</p>
                      </div>
                      <div className="w-1.5 h-1.5 bg-accent-green rounded-full shadow-[0_0_8px_rgba(34,197,94,1)] animate-pulse" />
                   </div>
                 </div>
              </div>
           </BrilliantCard>

           <BrilliantCard title="Infrastructure" icon={Server}>
              <div className="space-y-6 pt-4">
                 {INFRASTRUCTURE_NODES.map(node => {
                   const colorClasses = tone(node.color);
                   return (
                   <div key={node.label} className="space-y-2">
                      <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                         <span className="text-white/60">{node.label}</span>
                         <span className={colorClasses.text}>{node.status}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                         <div className={`h-full ${colorClasses.bg} shadow-lg`} style={{ width: `${node.load}%` }} />
                      </div>
                   </div>
                   );
                 })}
              </div>
           </BrilliantCard>
        </div>

        {/* Workflow catalog */}
        <div className="col-span-12 lg:col-span-8 space-y-10">
           <div className="flex items-center gap-4 mb-4">
              <span className="px-4 py-2 bg-success/10 border border-success/25 rounded-xl text-[10px] font-black text-success uppercase tracking-[0.3em]">
                Active Workflows
              </span>
              <span className="text-[11px] font-semibold text-on-surface-muted">
                {workflows.length} pipeline{workflows.length !== 1 ? 's' : ''} loaded
              </span>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xl:gap-10">
              {workflows.map((workflow, index) => (
                <WorkflowCard
                  key={workflow.id}
                  {...workflow}
                  i={index + 1}
                  onTrigger={(id, name) => triggerWorkflow(id, name, workflow.webhookUrl)}
                  isTriggering={triggeringWorkflow === workflow.id}
                />
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationNode;
