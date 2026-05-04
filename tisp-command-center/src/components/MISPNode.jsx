import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Target, Activity, Share2, Search, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';
import { 
  HolographicHeader,
  BrilliantCard
} from './HUDComponents';
import { deterministicSeries, tone } from '../lib/uiTokens';
import { usePlatform } from '../state/PlatformContext';

const VELOCITY_SERIES = deterministicSeries('misp-velocity-spectrum', 24, 20, 100);
const filters = [
  { id: 'all', label: 'All_Events' },
  { id: 'high', label: 'High_Severity' },
];

function timeAgo(timestamp) {
  const diffMs = Math.max(0, Date.now() - new Date(timestamp).getTime());
  const mins = Math.round(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h ago`;
}

const MISPNode = () => {
  const { stats, mispEvents } = usePlatform();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return mispEvents.filter((item) => {
      const matchesFilter = activeFilter === 'all' || item.filter === activeFilter || ['CRITICAL', 'HIGH'].includes(item.severity);
      const matchesQuery =
        !normalizedQuery ||
        [item.title, item.org, item.severity, ...(item.tags ?? [])].some((value) => String(value).toLowerCase().includes(normalizedQuery));
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, mispEvents, query]);

  const totalAttributes = stats?.misp?.totalAttributes ?? mispEvents.reduce((sum, item) => sum + Number(item.attributes ?? 0), 0);
  const avgConfidence = mispEvents.length
    ? Math.round(mispEvents.reduce((sum, item) => sum + Number(item.confidence ?? 0), 0) / mispEvents.length)
    : 0;

  return (
    <div className="flex-1 flex flex-col bg-slate-950/40 relative overflow-hidden h-screen">
      <HolographicHeader 
        title="MISP_INTEL_MATRIX" 
        subtitle="Federated Threat Intelligence | Malware Information Sharing"
        icon={Globe}
      />
      
      <div className="flex-1 p-4 md:p-8 xl:p-12 grid grid-cols-12 gap-6 xl:gap-10 overflow-y-auto custom-scrollbar relative z-10">
        <div className="col-span-12 lg:col-span-4 space-y-10">
           <BrilliantCard title="Intel Telemetry" icon={Activity}>
              <div className="space-y-10 py-2">
                 <div className="flex justify-between items-end">
                    <div>
                       <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest mb-1">Total Indicators</p>
                       <p className="text-5xl font-black text-white italic tracking-normal tabular-nums">{(stats?.misp?.totalEvents ?? mispEvents.length).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-accent-green uppercase">+1.2%</p>
                       <p className="text-[9px] font-bold text-on-surface/20">REAL_TIME_INC</p>
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest">Velocity Spectrum</p>
                    <div className="h-28 flex items-end gap-1.5 px-1 bg-white/5 rounded-2xl p-4">
                       {VELOCITY_SERIES.map((height, i) => (
                          <motion.div 
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            className="flex-1 bg-primary/20 rounded-t-md hover:bg-primary transition-all cursor-crosshair shadow-[0_0_10px_rgba(14,165,233,0.3)] hover:shadow-primary"
                          />
                       ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 glass-card rounded-[2rem] border border-white/5">
                       <p className="text-[10px] font-black text-on-surface/30 uppercase mb-2">Attributes</p>
                       <p className="text-2xl font-black text-white italic">{totalAttributes.toLocaleString()}</p>
                    </div>
                    <div className="p-6 glass-card rounded-[2rem] border border-white/5">
                       <p className="text-[10px] font-black text-on-surface/30 uppercase mb-2">Confidence</p>
                       <p className="text-2xl font-black text-white italic">{avgConfidence}%</p>
                    </div>
                 </div>
              </div>
           </BrilliantCard>

           <BrilliantCard title="Intelligence Feeds" icon={Target}>
              <div className="space-y-3 mt-4">
                 {[
                   { name: 'FS-ISAC Global', count: '1.2K', trend: '+12%', color: 'primary' },
                   { name: 'MITRE ATT&CK', count: '412', trend: '+5%', color: 'accent-purple' },
                   { name: 'CISA_AUTOMATED', count: '14.2K', trend: '+88%', color: 'accent-green' }
                 ].map((f) => {
                   const colorClasses = tone(f.color);

                   return (
                    <div key={f.name} className="flex items-center justify-between p-5 glass-card rounded-2xl group cursor-pointer hover:border-primary/40 transition-all">
                       <div className="flex items-center gap-4">
                          <div className={`p-2 ${colorClasses.bg10} rounded-xl ${colorClasses.text}`}>
                             <Share2 size={16} />
                          </div>
                          <div>
                             <p className="text-[11px] font-black text-white uppercase tracking-wider">{f.name}</p>
                             <p className="text-[9px] font-bold text-on-surface/30 uppercase">{f.count} Active IOCs</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <span className={`text-[9px] font-black ${colorClasses.text}`}>{f.trend}</span>
                       </div>
                    </div>
                   );
                 })}
              </div>
           </BrilliantCard>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-10">
           <BrilliantCard title="Active Intelligence Stream" icon={Clock}>
              <div className="flex items-center justify-between mb-8">
                 <div className="flex gap-4">
                    {filters.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setActiveFilter(filter.id)}
                        className={`px-6 py-2.5 border text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                          activeFilter === filter.id
                            ? 'bg-accent-rose/5 border-accent-rose/20 text-accent-rose'
                            : 'bg-white/5 border-white/10 text-on-surface/60 hover:bg-white/10'
                        }`}
                      >
                         {filter.label}
                      </button>
                    ))}
                 </div>
                 <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                    <Search size={14} className="text-on-surface/30" />
                    <input
                      type="text"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search Indicators..."
                      className="bg-transparent border-none outline-none text-[10px] font-bold text-white w-48 italic"
                    />
                 </div>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[600px] custom-scrollbar pr-4">
                 {filteredEvents.map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 * i }}
                      className="group flex flex-col md:flex-row md:items-center justify-between p-6 glass-card rounded-[2rem] border border-white/5 hover:border-primary/50 cursor-pointer transition-all gap-4 shadow-xl"
                    >
                       <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${item.sev === 'CRITICAL' ? 'bg-accent-rose/10 text-accent-rose' : 'bg-orange-500/10 text-orange-500'}`}>
                             <AlertCircle size={28} />
                          </div>
                          <div>
                             <h5 className="text-[13px] font-black text-white italic tracking-normal uppercase group-hover:text-primary transition-colors">{item.title}</h5>
                             <div className="flex items-center gap-4 mt-2">
                                <span className="text-[9px] font-black text-on-surface/30 uppercase tracking-widest">{item.org}</span>
                                <div className="w-1 h-1 bg-white/10 rounded-full" />
                                <span className="text-[9px] font-bold text-on-surface/20">{timeAgo(item.timestamp)}</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-3">
                          {item.tags.map(tag => (
                             <span key={tag} className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[8px] font-black text-on-surface/40 uppercase tracking-wider group-hover:border-primary/20">{tag}</span>
                          ))}
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-all ml-4">
                             <ArrowUpRight size={16} className="text-on-surface/40 group-hover:text-primary" />
                          </div>
                       </div>
                    </motion.div>
                 ))}
                 {filteredEvents.length === 0 && (
                   <div className="rounded-[2rem] border border-white/5 bg-white/5 p-8 text-center text-sm font-bold text-on-surface/40">
                     No matching indicators
                   </div>
                 )}
              </div>
           </BrilliantCard>
        </div>
      </div>
    </div>
  );
};

export default MISPNode;
