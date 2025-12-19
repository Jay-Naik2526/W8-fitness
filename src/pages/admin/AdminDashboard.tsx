import React, { useEffect, useState } from 'react';
import { Users, Shield, Activity, ChevronRight, CreditCard, LayoutDashboard, Database, Radio, Send, X, AlertTriangle } from "lucide-react";
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalClients: 0, totalTrainers: 0, ptClients: 0, genClients: 0 });
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
        try {
            const res = await fetch('https://w8-fitness-backend-api.onrender.com/api/admin/stats');
            if (res.ok) setStats(await res.json());
        } catch (err) { console.error("Admin Offline"); }
    };
    fetchStats();
  }, []);

  const handleBroadcast = async () => {
      if (!broadcastMsg.trim()) return;
      setSending(true);
      try {
          const res = await fetch('https://w8-fitness-backend-api.onrender.com/api/admin/notify-all', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: broadcastMsg, type: 'ALERT' })
          });
          if (res.ok) {
              alert("GLOBAL INTEL TRANSMITTED");
              setBroadcastMsg("");
              setShowBroadcast(false);
          }
      } catch (err) { alert("BROADCAST FAILED"); }
      setSending(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 md:pl-24 relative overflow-x-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-20" />

      {/* HEADER */}
      <header className="mb-8 md:mb-12 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
         <div>
             <div className="flex items-center gap-2 text-w8-red text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] mb-2">
                <LayoutDashboard size={14} /> 
                <span>Command Center v2.4</span>
             </div>
             <h1 className="text-4xl md:text-5xl font-black italic uppercase text-white tracking-tighter leading-none">
                HQ <span className="text-gray-700">DASHBOARD</span>
             </h1>
         </div>
         
         {/* BROADCAST BUTTON */}
         <button 
            onClick={() => setShowBroadcast(true)}
            className="w-full md:w-auto bg-w8-red hover:bg-red-600 text-white px-6 py-4 rounded-xl font-black italic uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_40px_rgba(220,38,38,0.6)] transition-all transform active:scale-95 md:hover:-translate-y-1 text-xs md:text-sm"
         >
            <Radio size={18} className="animate-pulse"/> Broadcast Intel
         </button>
      </header>

      {/* --- TELEMETRY ROW (STATS) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12 relative z-10">
         
         {/* CLIENTS STAT */}
         <div className="bg-white/5 border border-white/10 p-6 relative group overflow-hidden hover:border-w8-red/50 transition-all duration-500 rounded-xl">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Users size={100}/></div>
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded"><Users size={20} /></div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Population</span>
            </div>
            <p className="text-4xl md:text-5xl font-black text-white mb-1">{stats.totalClients}</p>
            <div className="w-full bg-white/10 h-1 mt-4">
                <div className="bg-blue-500 h-full w-[70%]"></div>
            </div>
         </div>

         {/* TRAINERS STAT */}
         <div className="bg-white/5 border border-white/10 p-6 relative group overflow-hidden hover:border-w8-red/50 transition-all duration-500 rounded-xl">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Shield size={100}/></div>
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-w8-red/10 text-w8-red rounded"><Shield size={20} /></div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Active Units</span>
            </div>
            <p className="text-4xl md:text-5xl font-black text-white mb-1">{stats.totalTrainers}</p>
            <div className="w-full bg-white/10 h-1 mt-4">
                <div className="bg-w8-red h-full w-[40%]"></div>
            </div>
         </div>

         {/* SYSTEM HEALTH */}
         <div className="bg-white/5 border border-white/10 p-6 relative group overflow-hidden hover:border-w8-red/50 transition-all duration-500 rounded-xl">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Activity size={100}/></div>
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-green-500/10 text-green-500 rounded"><Activity size={20} /></div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">System Status</span>
            </div>
            <p className="text-4xl md:text-5xl font-black text-white mb-1">100%</p>
            <div className="flex gap-1 mt-5">
                {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="flex-1 h-1 bg-green-500/50 rounded-full animate-pulse"></div>)}
            </div>
         </div>
      </div>

      {/* --- MODULES GRID (NAVIGATION) --- */}
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 md:mb-6 border-b border-white/10 pb-2">Access Modules</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 relative z-10">
         
         {/* 1. CLIENT ROSTER */}
         <Link to="/admin/clients" className="group relative bg-black border border-white/10 p-6 md:p-8 h-48 md:h-64 flex flex-col justify-between hover:bg-white/5 transition-all duration-300 rounded-xl">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
             <div>
                 <Database size={28} className="text-blue-500 mb-3 md:mb-4"/>
                 <h3 className="text-xl md:text-2xl font-black italic uppercase text-white group-hover:text-blue-400 transition-colors">Client Roster</h3>
                 <p className="text-[10px] md:text-xs text-gray-500 mt-2 font-mono"> // Manage Assignments</p>
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white">
                 Initialize <ChevronRight size={12}/>
             </div>
         </Link>

         {/* 2. TRAINER UNIT */}
         <Link to="/admin/trainers" className="group relative bg-black border border-white/10 p-6 md:p-8 h-48 md:h-64 flex flex-col justify-between hover:bg-white/5 transition-all duration-300 rounded-xl">
             <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
             <div>
                 <Shield size={28} className="text-w8-red mb-3 md:mb-4"/>
                 <h3 className="text-xl md:text-2xl font-black italic uppercase text-white group-hover:text-w8-red transition-colors">Trainer Unit</h3>
                 <p className="text-[10px] md:text-xs text-gray-500 mt-2 font-mono"> // Deploy Personnel</p>
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white">
                 Initialize <ChevronRight size={12}/>
             </div>
         </Link>

         {/* 3. MEMBERSHIP MATRIX */}
         <Link to="/admin/membership" className="group relative bg-black border border-white/10 p-6 md:p-8 h-48 md:h-64 flex flex-col justify-between hover:bg-white/5 transition-all duration-300 rounded-xl">
             <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
             <div>
                 <CreditCard size={28} className="text-yellow-500 mb-3 md:mb-4"/>
                 <h3 className="text-xl md:text-2xl font-black italic uppercase text-white group-hover:text-yellow-400 transition-colors">Pricing Matrix</h3>
                 <p className="text-[10px] md:text-xs text-gray-500 mt-2 font-mono"> // Control Protocols</p>
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white">
                 Initialize <ChevronRight size={12}/>
             </div>
         </Link>

      </div>

      {/* --- BROADCAST MODAL --- */}
      <AnimatePresence>
          {showBroadcast && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
              >
                  <motion.div 
                    initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                    className="bg-black border-2 border-w8-red/50 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(220,38,38,0.2)] overflow-hidden"
                  >
                      {/* Modal Header */}
                      <div className="bg-w8-red p-4 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                              <AlertTriangle className="text-white" size={20} />
                              <h3 className="text-lg md:text-xl font-black italic uppercase text-white">Global Alert System</h3>
                          </div>
                          <button onClick={() => setShowBroadcast(false)} className="text-white/80 hover:text-white"><X size={20}/></button>
                      </div>

                      {/* Modal Body */}
                      <div className="p-4 md:p-6">
                          <p className="text-[10px] md:text-xs text-gray-400 font-mono mb-4 uppercase tracking-widest">
                              // WARNING: This message will be transmitted to all active operatives immediately.
                          </p>
                          <textarea 
                            value={broadcastMsg}
                            onChange={(e) => setBroadcastMsg(e.target.value)}
                            placeholder="ENTER URGENT INTEL..."
                            className="w-full h-32 md:h-40 bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder-gray-600 outline-none focus:border-w8-red transition-colors font-mono text-sm resize-none"
                          />
                          
                          <div className="flex gap-4 mt-6">
                              <button 
                                onClick={() => setShowBroadcast(false)}
                                className="flex-1 py-3 md:py-4 rounded-xl border border-white/10 text-gray-400 font-bold uppercase tracking-widest hover:bg-white/5 transition-colors text-[10px] md:text-xs"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={handleBroadcast}
                                disabled={sending}
                                className="flex-1 bg-w8-red hover:bg-red-600 text-white py-3 md:py-4 rounded-xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all text-[10px] md:text-xs"
                              >
                                {sending ? "TRANSMITTING..." : <><Send size={14} /> BROADCAST NOW</>}
                              </button>
                          </div>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

    </div>
  );
}