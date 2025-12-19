import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield, Lock, FileText, AlertTriangle } from "lucide-react";

export default function Protocols() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-md mx-auto">
      
      {/* HEADER */}
      <header className="flex items-center gap-4 mb-8 mt-2">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
           <p className="text-[10px] text-blue-400 font-mono uppercase tracking-widest">Legal & Rules</p>
           <h1 className="text-2xl font-black uppercase italic">Protocols</h1>
        </div>
      </header>

      <div className="space-y-8">

        {/* --- SECTION 1: DATA PRIVACY --- */}
        <section>
           <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <Lock size={14} className="text-w8-red"/> Data Classification
           </h3>
           
           <div className="bg-white/5 border border-white/10 p-5 rounded-xl space-y-4">
              <div className="flex gap-3">
                 <Shield size={20} className="text-green-500 flex-shrink-0" />
                 <div>
                    <h4 className="font-bold text-sm text-white">End-to-End Encryption</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                       Your biometric data, battle logs, and 1RM stats are encrypted. We do not sell operative data to third-party agencies.
                    </p>
                 </div>
              </div>
              <div className="w-full h-[1px] bg-white/10"></div>
              <div className="flex gap-3">
                 <FileText size={20} className="text-blue-500 flex-shrink-0" />
                 <div>
                    <h4 className="font-bold text-sm text-white">Local Storage Protocol</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                       Session tokens are stored on your device. Logging out terminates the local key immediately.
                    </p>
                 </div>
              </div>
           </div>
        </section>

        {/* --- SECTION 2: GYM RULES (CODE OF CONDUCT) --- */}
        <section>
           <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle size={14} className="text-w8-red"/> Facility Rules
           </h3>
           
           <div className="space-y-3">
              <RuleCard 
                num="01" 
                title="Respect the Iron" 
                desc="Re-rack your weights. Leaving equipment on the floor is a Class C violation." 
              />
              <RuleCard 
                num="02" 
                title="Zero Tolerance" 
                desc="Harassment of any kind will result in immediate dishonorable discharge (Ban)." 
              />
              <RuleCard 
                num="03" 
                title="Sanitation Protocol" 
                desc="Wipe down stations after deployment. Leave no trace." 
              />
           </div>
        </section>

        {/* --- FOOTER --- */}
        <div className="text-center pt-8 opacity-50">
           <p className="text-[10px] font-mono">LAST UPDATED: 2025.10.15</p>
           <p className="text-[10px] font-mono">COMMAND AUTHORITY: W8 SYSTEM</p>
        </div>

      </div>
    </div>
  );
}

function RuleCard({ num, title, desc }: any) {
   return (
      <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex gap-4 items-start">
         <span className="font-mono text-xs font-bold text-gray-600 pt-1">{num}</span>
         <div>
            <h4 className="font-bold text-sm text-white uppercase italic">{title}</h4>
            <p className="text-xs text-gray-400 mt-1">{desc}</p>
         </div>
      </div>
   )
}