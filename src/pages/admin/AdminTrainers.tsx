import React, { useEffect, useState } from 'react';
import { Shield, Users, UserPlus, X, User, ArrowLeft, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from 'react-router-dom';

export default function AdminTrainers() {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<any>(null);
  const [squad, setSquad] = useState<any[]>([]);
  
  // ADD TRAINER STATE
  const [isAdding, setIsAdding] = useState(false);
  const [newTrainer, setNewTrainer] = useState({ name: '', email: '', password: '', tier: 'ELITE' });

  useEffect(() => { fetchTrainers(); }, []);

  const fetchTrainers = async () => {
      try {
          const res = await fetch('http://localhost:5000/api/admin/trainers');
          if (res.ok) setTrainers(await res.json());
      } catch (e) { console.error("Fetch Error"); }
  };

  const handleAddTrainer = async (e: React.FormEvent) => {
      e.preventDefault();
      // Calls our new Auth Route to create Active Trainer directly
      const res = await fetch('http://localhost:5000/api/auth/create-trainer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTrainer)
      });
      
      const data = await res.json();
      
      if(res.ok) {
          alert("OFFICER RECRUITED SUCCESSFULLY");
          setIsAdding(false);
          setNewTrainer({ name: '', email: '', password: '', tier: 'ELITE' });
          fetchTrainers();
      } else {
          alert("RECRUITMENT FAILED: " + data.msg);
      }
  };

  const handleDeleteTrainer = async (id: string, e: any) => {
      e.stopPropagation();
      if(!window.confirm("CONFIRM TERMINATION? This will unassign all their clients.")) return;
      const res = await fetch(`http://localhost:5000/api/admin/delete-trainer/${id}`, { method: 'DELETE' });
      if (res.ok) fetchTrainers();
  };

  const viewSquad = async (trainer: any) => {
      setSelectedTrainer(trainer);
      const res = await fetch(`http://localhost:5000/api/admin/squad/${trainer._id}`);
      if (res.ok) setSquad(await res.json());
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 md:pl-24">
      
      {/* HEADER */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
         <div>
            <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-mono uppercase tracking-widest mb-4 transition-colors">
                <ArrowLeft size={14} /> Back to HQ
            </Link>
            <div className="flex items-center gap-2 text-w8-red text-xs font-mono uppercase tracking-widest mb-1"><Shield size={14} /> Personnel</div>
            <h1 className="text-3xl md:text-4xl font-black italic uppercase">Trainer <span className="text-gray-600">Unit</span></h1>
         </div>
         <button onClick={() => setIsAdding(true)} className="w-full md:w-auto bg-w8-red hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-900/20">
            <UserPlus size={14} /> Recruit Officer
         </button>
      </header>

      {/* RESPONSIVE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
         {trainers.map((t) => (
             <div key={t._id} onClick={() => viewSquad(t)} className="cursor-pointer bg-white/5 border border-white/10 p-6 rounded-xl relative group hover:border-w8-red/50 hover:bg-white/10 transition-all">
                 <button onClick={(e) => handleDeleteTrainer(t._id, e)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-colors z-10"><Trash2 size={16}/></button>
                 
                 <div className="flex justify-between items-start mb-4">
                     <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-gray-800">
                        {t.image ? <img src={t.image} alt={t.name} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-w8-red">{t.name ? t.name[0] : 'T'}</div>}
                     </div>
                     <span className="bg-w8-red/10 text-w8-red text-[10px] font-bold px-2 py-1 rounded uppercase">{t.tier || 'OPERATIVE'}</span>
                 </div>
                 <h3 className="text-xl font-black italic uppercase">{t.name}</h3>
                 <p className="text-xs text-gray-500 font-mono mb-4">{t.email}</p>
                 <div className="flex items-center gap-2 border-t border-white/5 pt-4 text-xs font-bold uppercase tracking-widest text-gray-400 group-hover:text-white">
                     <Users size={14} /> View Squad ({t.clientCount || 0})
                 </div>
             </div>
         ))}
      </div>

      {/* ADD TRAINER MODAL */}
      <AnimatePresence>
          {isAdding && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-black border border-white/20 p-8 rounded-xl w-full max-w-md shadow-2xl">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-black uppercase">New Recruitment</h3>
                          <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
                      </div>
                      <p className="text-xs text-gray-500 mb-6 font-mono">ENTER OFFICER CREDENTIALS</p>
                      
                      <form onSubmit={handleAddTrainer} className="space-y-4">
                          <input required placeholder="FULL NAME" className="w-full bg-white/5 border border-white/10 p-3 rounded text-sm text-white outline-none focus:border-w8-red transition-colors" value={newTrainer.name} onChange={e => setNewTrainer({...newTrainer, name: e.target.value})} />
                          <input required type="email" placeholder="EMAIL ID" className="w-full bg-white/5 border border-white/10 p-3 rounded text-sm text-white outline-none focus:border-w8-red transition-colors" value={newTrainer.email} onChange={e => setNewTrainer({...newTrainer, email: e.target.value})} />
                          <input required type="password" placeholder="ASSIGN PASSWORD" className="w-full bg-white/5 border border-white/10 p-3 rounded text-sm text-white outline-none focus:border-w8-red transition-colors" value={newTrainer.password} onChange={e => setNewTrainer({...newTrainer, password: e.target.value})} />
                          
                          <div className="space-y-1">
                              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Rank / Tier</label>
                              <select className="w-full bg-black border border-white/10 p-3 rounded text-sm text-white outline-none focus:border-w8-red transition-colors" value={newTrainer.tier} onChange={e => setNewTrainer({...newTrainer, tier: e.target.value})}>
                                  <option value="ELITE">ELITE CLASS</option>
                                  <option value="COMMANDER">COMMANDER CLASS</option>
                                  <option value="OPERATIVE">OPERATIVE CLASS</option>
                              </select>
                          </div>

                          <div className="flex gap-3 mt-6">
                              <button type="submit" className="flex-1 bg-w8-red hover:bg-red-600 py-3 rounded text-xs font-bold uppercase tracking-widest text-white transition-colors">Confirm</button>
                              <button type="button" onClick={() => setIsAdding(false)} className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded text-xs font-bold uppercase tracking-widest text-gray-400">Cancel</button>
                          </div>
                      </form>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* SQUAD MODAL (Existing) */}
      <AnimatePresence>
         {selectedTrainer && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                 <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-black border border-white/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                     <div className="bg-black/90 p-6 border-b border-white/10 flex justify-between items-center">
                        <div><p className="text-[10px] text-gray-500 uppercase tracking-widest">Commanding Officer</p><h2 className="text-2xl font-black italic uppercase">{selectedTrainer.name}</h2></div>
                        <button onClick={() => setSelectedTrainer(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={20}/></button>
                     </div>
                     <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
                        {squad.length === 0 ? <p className="text-center text-gray-500 text-sm">NO ASSIGNED OPERATIVES</p> : squad.map(client => (
                            <div key={client._id} className="flex items-center justify-between bg-white/5 p-4 rounded-lg border border-white/5">
                                <div className="flex items-center gap-3"><div className="p-2 bg-white/10 rounded-full"><User size={16}/></div><div><p className="font-bold text-sm uppercase">{client.name}</p><p className="text-[10px] text-gray-500 font-mono">{client.email}</p></div></div>
                                <span className="text-[10px] font-bold bg-w8-red/20 text-w8-red px-2 py-1 rounded uppercase">{client.goal}</span>
                            </div>
                        ))}
                     </div>
                 </motion.div>
             </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}