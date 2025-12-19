import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserCheck, X, FileText, Dumbbell, Utensils, ArrowLeft, MessageSquare, Send, Check, AlertCircle, Trash2 } from "lucide-react";
import { Link } from 'react-router-dom';

export default function AdminClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [inspecting, setInspecting] = useState<any>(null);
  const [messaging, setMessaging] = useState<any>(null); 
  const [messageText, setMessageText] = useState("");
  const [tab, setTab] = useState<'WORKOUT' | 'DIET'>('WORKOUT'); 

  // FIXED: Wrapped in useCallback to satisfy dependency rules
  const fetchData = useCallback(async () => {
     try {
         const resC = await fetch('http://localhost:5000/api/admin/clients');
         const resT = await fetch('http://localhost:5000/api/admin/trainers');
         
         if (resC.ok && resT.ok) {
             const clientData = await resC.json();
             const trainerData = await resT.json();
             setClients(clientData);
             setTrainers(trainerData);
         }
     } catch (error) {
         console.error("Failed to load roster");
     }
  }, []);

  // FIXED: Added dependency
  useEffect(() => { fetchData(); }, [fetchData]);

  const assignTrainer = async (clientId: string, trainerId: string) => {
     await fetch('http://localhost:5000/api/admin/assign', {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ clientId, trainerId })
     });
     fetchData();
  };

  const approveClient = async (clientId: string) => {
      if(!window.confirm("CONFIRM CLEARANCE: Approve this operative?")) return;
      const res = await fetch(`http://localhost:5000/api/auth/approve-user/${clientId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) fetchData();
  };

  const handleDelete = async (clientId: string) => {
      if(!window.confirm("WARNING: PERMANENTLY DELETE THIS OPERATIVE?")) return;
      
      const res = await fetch(`http://localhost:5000/api/admin/delete-client/${clientId}`, {
          method: 'DELETE'
      });

      if (res.ok) {
          alert("OPERATIVE REMOVED FROM DATABASE");
          fetchData();
      } else {
          alert("DELETION FAILED");
      }
  };

  const sendIntel = async () => {
      if(!messageText) return;
      await fetch('http://localhost:5000/api/admin/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: messaging._id, message: messageText, type: 'MISSION' })
      });
      setMessaging(null);
      setMessageText("");
      alert("INTEL TRANSMITTED");
  };

  const inspectClient = async (client: any) => {
     const res = await fetch(`http://localhost:5000/api/admin/inspect/${client._id}`);
     if (res.ok) {
         const data = await res.json();
         setInspecting({ workout: data.workout, diet: data.diet, clientName: client.name });
         setTab('WORKOUT'); 
     }
  };

  const filteredClients = clients.filter(c => {
      if (filter === 'PENDING') return c.status === 'pending';
      if (filter === 'GENERAL') return c.status !== 'pending' && !c.trainerId; 
      if (filter === 'PT') return c.status !== 'pending' && c.trainerId; 
      return true;
  });

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 md:pl-24">
      
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
         <div>
            <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-mono uppercase tracking-widest mb-4 transition-colors">
                <ArrowLeft size={14} /> Back to HQ
            </Link>
            <div className="flex items-center gap-2 text-blue-500 text-xs font-mono uppercase tracking-widest mb-1"><Users size={14} /> Database</div>
            <h1 className="text-3xl md:text-4xl font-black italic uppercase">Client <span className="text-gray-600">Roster</span></h1>
         </div>
         <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'PENDING', 'GENERAL', 'PT'].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`flex-shrink-0 text-[10px] font-bold px-4 py-2 rounded border transition-colors relative ${filter === f ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/10 text-gray-500 hover:text-white'}`}>
                    {f}
                    {f === 'PENDING' && clients.filter(c => c.status === 'pending').length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                </button>
            ))}
         </div>
      </header>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden overflow-x-auto">
         <table className="w-full text-left min-w-[600px]">
            <thead className="bg-white/5 text-[10px] text-gray-500 uppercase font-bold tracking-widest">
               <tr><th className="p-4">Name</th><th className="p-4">Status</th><th className="p-4">Assigned Trainer</th><th className="p-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
               {filteredClients.map((client) => (
                  <tr key={client._id} className="hover:bg-white/5 transition-colors">
                     <td className="p-4"><div className="font-bold text-sm md:text-base">{client.name}</div><div className="text-[9px] text-gray-500">{client.email}</div></td>
                     <td className="p-4">
                        {client.status === 'pending' ? (
                             <span className="flex items-center gap-1 w-fit bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-[10px] font-bold uppercase border border-yellow-500/20">
                                 <AlertCircle size={10} className="animate-pulse"/> Awaiting Approval
                             </span>
                        ) : (
                             <span className={`px-2 py-1 rounded text-[10px] uppercase font-mono font-bold ${client.trainerId ? 'bg-w8-red/10 text-w8-red' : 'bg-blue-500/10 text-blue-500'}`}>
                                 {client.trainerId ? 'ASSIGNED' : 'GENERAL'}
                             </span>
                        )}
                     </td>
                     <td className="p-4">
                        {client.status === 'pending' ? (
                            <span className="text-[10px] text-gray-600 font-mono uppercase">/// LOCKED ///</span>
                        ) : (
                            <div className="relative group w-48">
                                <select className={`bg-black border rounded px-2 py-1.5 text-xs uppercase font-bold outline-none appearance-none w-full cursor-pointer transition-colors ${client.trainerId ? 'border-w8-red text-white' : 'border-white/20 text-gray-500'}`} value={client.trainerId?._id || ""} onChange={(e) => assignTrainer(client._id, e.target.value)}>
                                    <option value="" disabled>SELECT OFFICER</option>
                                    <option value="REMOVE" className="text-red-500 font-black">-- REVOKE TRAINER --</option>
                                    {trainers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                </select>
                                <UserCheck size={12} className="absolute right-2 top-2.5 pointer-events-none text-gray-500"/>
                            </div>
                        )}
                     </td>
                     <td className="p-4 text-right flex justify-end gap-2">
                        <button onClick={() => handleDelete(client._id)} className="p-2 bg-red-900/20 text-red-500 rounded hover:bg-red-600 hover:text-white transition-colors" title="Delete User">
                            <Trash2 size={14} />
                        </button>
                        {client.status === 'pending' ? (
                            <button onClick={() => approveClient(client._id)} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-green-900/20">
                                <Check size={14}/> Approve ID
                            </button>
                        ) : (
                            <>
                                <button onClick={() => setMessaging(client)} className="p-2 bg-white/10 rounded hover:bg-white/20 text-blue-400 transition-colors"><MessageSquare size={14}/></button>
                                <button onClick={() => inspectClient(client)} className="text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-widest flex items-center gap-1 bg-white/5 px-3 py-1 rounded border border-white/10"><FileText size={12}/> INSPECT</button>
                            </>
                        )}
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      <AnimatePresence>
          {messaging && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-black border border-white/20 p-6 rounded-xl w-full max-w-md">
                      <h3 className="text-xl font-black uppercase mb-1">Transmit Intel</h3>
                      <p className="text-xs text-gray-500 mb-4 font-mono">TARGET: {messaging.name}</p>
                      <textarea className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm text-white outline-none h-32 mb-4 focus:border-blue-500/50 transition-colors" placeholder="Type tactical instructions..." value={messageText} onChange={(e) => setMessageText(e.target.value)}/>
                      <div className="flex gap-2">
                          <button onClick={sendIntel} className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"><Send size={14}/> Send</button>
                          <button onClick={() => setMessaging(null)} className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded text-xs font-bold uppercase tracking-widest">Cancel</button>
                      </div>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      <AnimatePresence>
         {inspecting && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-0 md:p-10">
                 <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-black border border-white/20 md:rounded-2xl w-full h-full md:h-auto md:max-w-2xl md:max-h-[80vh] overflow-y-auto relative shadow-2xl flex flex-col">
                     <div className="sticky top-0 bg-black/90 p-6 border-b border-white/10 flex justify-between items-center z-10 shrink-0">
                        <div><p className="text-[10px] text-gray-500 uppercase tracking-widest">Inspecting Protocol For</p><h2 className="text-2xl font-black italic uppercase">{inspecting.clientName}</h2></div>
                        <button onClick={() => setInspecting(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={20}/></button>
                     </div>
                     <div className="flex border-b border-white/10 shrink-0">
                         <button onClick={() => setTab('WORKOUT')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${tab === 'WORKOUT' ? 'bg-white/5 text-w8-red border-b-2 border-w8-red' : 'text-gray-500 hover:text-white'}`}><Dumbbell size={14}/> Workout</button>
                         <button onClick={() => setTab('DIET')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${tab === 'DIET' ? 'bg-white/5 text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-white'}`}><Utensils size={14}/> Diet</button>
                     </div>
                     <div className="p-6 space-y-4 overflow-y-auto pb-20 md:pb-6">
                        {tab === 'WORKOUT' && (inspecting.workout ? inspecting.workout.days.map((day: any, i: number) => (
                                <div key={i} className="bg-white/5 p-4 rounded-lg border border-white/5">
                                    <h3 className="text-w8-red font-bold uppercase text-xs mb-2">{new Date(day.date).toLocaleDateString('en-US', {weekday:'long'})} // {day.focus}</h3>
                                    {day.exercises.map((ex: any, j: number) => <div key={j} className="flex justify-between text-xs border-b border-white/5 pb-1 mb-1 last:border-0"><span className="text-white font-bold">{ex.name}</span><span className="text-gray-400 font-mono">{ex.sets} x {ex.reps} @ {ex.weight}kg</span></div>)}
                                </div>
                            )) : <div className="text-center p-10 text-gray-500">NO WORKOUT PROTOCOL ACTIVE</div>)}
                        {tab === 'DIET' && (inspecting.diet ? inspecting.diet.week.map((day: any, i: number) => (
                                <div key={i} className="bg-white/5 p-4 rounded-lg border border-white/5">
                                    <h3 className="text-blue-400 font-bold uppercase text-xs mb-2">{day.day} // {day.macros.p}P {day.macros.c}C {day.macros.f}F</h3>
                                    {day.meals.map((meal: any, j: number) => <div key={j} className="flex justify-between text-xs border-b border-white/5 pb-1 mb-1 last:border-0"><span className="text-white font-bold">{meal.name}</span><span className="text-gray-400 font-mono">{meal.calories} kcal</span></div>)}
                                </div>
                            )) : <div className="text-center p-10 text-gray-500">NO DIET PLAN ACTIVE</div>)}
                     </div>
                 </motion.div>
             </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}