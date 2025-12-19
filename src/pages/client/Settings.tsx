import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, ChevronLeft, Shield, CreditCard, User, AlertTriangle } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>({});

  useEffect(() => {
    const storedUser = localStorage.getItem('w8_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    if (window.confirm("CONFIRM: Terminate Session?")) {
      // 1. Wipe Data
      localStorage.removeItem('w8_user');
      localStorage.removeItem('w8_token');
      
      // 2. Redirect to Login
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-md mx-auto relative">
      
      {/* HEADER */}
      <header className="flex items-center gap-4 mb-8 mt-2">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
           <p className="text-[10px] text-w8-red font-mono uppercase tracking-widest">System Config</p>
           <h1 className="text-2xl font-black uppercase italic">Control Panel</h1>
        </div>
      </header>

      <div className="space-y-6">
        
        {/* SECTION 1: IDENTITY CARD */}
        <section className="bg-white/5 border border-white/10 p-4 rounded-xl">
           <div className="flex items-center gap-3 mb-4">
              <div className="bg-gray-800 p-2 rounded-lg">
                 <User size={20} className="text-gray-400" />
              </div>
              <div>
                 <p className="text-xs text-gray-500 uppercase font-bold">Operative</p>
                 <p className="text-lg font-bold text-white">{user.name || 'Unknown'}</p>
              </div>
           </div>
           <div className="bg-black/50 p-3 rounded-lg border border-white/5 flex justify-between items-center">
              <span className="text-xs text-gray-500 font-mono">ID CLASSIFICATION</span>
              <span className="text-xs font-bold text-w8-red uppercase">{user.tier || 'Initiate'}</span>
           </div>
        </section>

        {/* SECTION 2: MEMBERSHIP STATUS */}
        <section className="bg-white/5 border border-white/10 p-4 rounded-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-10">
              <CreditCard size={40} />
           </div>
           <h3 className="text-sm font-bold uppercase text-gray-400 mb-1">Clearance Status</h3>
           <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
              <span className="text-xl font-black text-white italic">ACTIVE</span>
           </div>
           <p className="text-[10px] text-gray-600 font-mono">RENEWAL: AUTO-DEDUCT ENABLED</p>
        </section>

        {/* SECTION 3: SYSTEM ACTIONS */}
        <section className="space-y-3">
           
           {/* LINK TO PROTOCOLS (Privacy & Rules) */}
           <Link to="/protocols" className="block">
              <div className="w-full bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between group hover:bg-white/10 transition-colors cursor-pointer">
                 <div className="flex items-center gap-3">
                    <Shield size={18} className="text-blue-400" />
                    <span className="text-sm font-bold text-gray-300">Privacy & Protocols</span>
                 </div>
                 <ChevronLeft size={16} className="rotate-180 text-gray-600" />
              </div>
           </Link>

           {/* REPORT GLITCH (Placeholder) */}
           <button 
             onClick={() => alert("Report ticket #4922 opened. Admin will review.")}
             className="w-full bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between group hover:bg-white/10 transition-colors"
           >
              <div className="flex items-center gap-3">
                 <AlertTriangle size={18} className="text-yellow-400" />
                 <span className="text-sm font-bold text-gray-300">Report Glitch</span>
              </div>
              <ChevronLeft size={16} className="rotate-180 text-gray-600" />
           </button>
        </section>

        {/* DANGER ZONE: LOGOUT */}
        <button 
          onClick={handleLogout}
          className="w-full mt-8 bg-red-900/20 border border-red-500/30 p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-900/40 transition-colors"
        >
           <LogOut size={18} className="text-red-500" />
           <span className="text-sm font-bold text-red-400 uppercase tracking-widest">Terminate Session</span>
        </button>

        {/* FOOTER */}
        <div className="text-center mt-8 pb-8">
           <p className="text-[10px] text-gray-700 font-mono">MEMBER OS v1.0.4 // BUILD 8821</p>
        </div>

      </div>
    </div>
  );
}