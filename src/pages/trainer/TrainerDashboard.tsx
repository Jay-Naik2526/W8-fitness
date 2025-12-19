import React, { useEffect, useState } from 'react';
import { Users, ChevronRight, Activity, Search } from "lucide-react";
import { Link } from 'react-router-dom';

export default function TrainerDashboard() {
  const [squad, setSquad] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const trainerId = JSON.parse(localStorage.getItem('w8_user') || '{}').id; // Get logged in trainer ID

  useEffect(() => {
    fetch(`https://w8-fitness-backend-api.onrender.com/api/trainer/squad/${trainerId}`)
      .then(res => res.json())
      .then(data => { setSquad(data); setLoading(false); })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 relative overflow-x-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-20" />

      <header className="mb-10 relative z-10">
         <div className="flex items-center gap-2 text-w8-red text-xs font-mono uppercase tracking-[0.2em] mb-2">
            <Activity size={14} /> Field Command
         </div>
         <h1 className="text-4xl md:text-5xl font-black italic uppercase text-white tracking-tighter">
            ACTIVE <span className="text-gray-700">SQUAD</span>
         </h1>
      </header>

      {/* SQUAD GRID */}
      {loading ? (
          <div className="text-center text-gray-500 font-mono animate-pulse">ESTABLISHING LINK...</div>
      ) : squad.length === 0 ? (
          <div className="p-10 border border-white/10 rounded-xl text-center bg-white/5">
              <h3 className="text-xl font-bold uppercase text-gray-400">No Operatives Assigned</h3>
              <p className="text-xs text-gray-600 mt-2">Wait for HQ to assign recruits.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
              {squad.map((client) => (
                  <Link to={`/trainer/client/${client._id}`} key={client._id} className="group relative bg-white/5 border border-white/10 p-6 rounded-xl hover:border-w8-red/50 transition-all duration-300 overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Users size={80}/></div>
                      
                      <div className="flex items-center gap-4 mb-6">
                          <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-white/10 overflow-hidden">
                              {/* Placeholder Image or Real if available */}
                              <div className="w-full h-full flex items-center justify-center font-black text-2xl text-gray-600">{client.name[0]}</div>
                          </div>
                          <div>
                              <h3 className="text-xl font-black italic uppercase text-white group-hover:text-w8-red transition-colors">{client.name}</h3>
                              <p className="text-[10px] font-mono text-gray-500">{client.email}</p>
                          </div>
                      </div>

                      <div className="flex justify-between items-end border-t border-white/10 pt-4">
                          <div>
                              <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Target Protocol</p>
                              <p className="text-sm font-bold text-white uppercase">{client.goal}</p>
                          </div>
                          <div className="bg-white/10 p-2 rounded-full group-hover:bg-w8-red group-hover:text-white transition-colors">
                              <ChevronRight size={16} />
                          </div>
                      </div>
                  </Link>
              ))}
          </div>
      )}
    </div>
  );
}