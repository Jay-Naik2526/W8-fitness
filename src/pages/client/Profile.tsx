import React, { useEffect, useState } from 'react';
import { User, Trophy, Calendar, Clock, ChevronRight, Shield, Medal, Edit2, Save, Activity, Settings, Dumbbell, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from 'react-router-dom';

export default function Profile() {
  const [user, setUser] = useState<any>({ name: 'Operative', level: 1 });
  const [loading, setLoading] = useState(true);
  
  // --- DYNAMIC DATA STATES ---
  const [battleLogs, setBattleLogs] = useState<any[]>([]); // All raw logs
  const [stats, setStats] = useState({ bench: 0, squat: 0, deadlift: 0 });
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // --- SEARCH & FILTER STATE ---
  const [searchDate, setSearchDate] = useState(""); 

  // --- RANK SYSTEM ---
  const getRank = (count: number) => {
    if (count > 50) return { title: "SPARTAN", color: "text-yellow-400", icon: Trophy };
    if (count > 20) return { title: "VETERAN", color: "text-purple-400", icon: Medal };
    if (count > 5) return { title: "SOLDIER", color: "text-blue-400", icon: Shield };
    return { title: "RECRUIT", color: "text-gray-400", icon: User };
  };

  useEffect(() => {
    const fetchData = async () => {
        const storedUser = localStorage.getItem('w8_user');
        if (!storedUser) return;
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        const realId = parsedUser.id || parsedUser._id;

        try {
            const res = await fetch(`https://w8-fitness-backend-api.onrender.com/api/ai/stats-history/${realId}`);
            if (res.ok) {
                const history = await res.json();
                
                // 1. UPDATE TROPHY ROOM
                if (history.length > 0) {
                    const latest = history[0].startingStats;
                    setStats({
                        bench: latest.bench || 0,
                        squat: latest.squat || 0,
                        deadlift: latest.deadlift || 0
                    });
                }

                // 2. PROCESS BATTLE LOGS
                const allDays: any[] = [];
                history.forEach((plan: any) => {
                    if (plan.days && Array.isArray(plan.days)) {
                        plan.days.forEach((day: any) => {
                            if (day.exercises && day.exercises.length > 0) {
                                allDays.push({
                                    id: day._id || Math.random().toString(),
                                    date: day.date,
                                    focus: day.focus,
                                    exercises: day.exercises,
                                    duration: '60'
                                });
                            }
                        });
                    }
                });

                // Sort Newest First
                allDays.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setBattleLogs(allDays);
            }
        } catch (err) {
            console.error("Profile Sync Failed", err);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  // --- FILTER LOGIC (The Core Update) ---
  const getFilteredLogs = () => {
      if (searchDate) {
          // 1. Search Mode: Show logs matching the specific date
          return battleLogs.filter(log => new Date(log.date).toISOString().split('T')[0] === searchDate);
      } else {
          // 2. Default Mode: Show only LAST 7 DAYS
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return battleLogs.filter(log => new Date(log.date) >= oneWeekAgo);
      }
  };

  const visibleLogs = getFilteredLogs();
  const rank = getRank(battleLogs.length); // Rank based on TOTAL lifetime logs, not filtered
  const RankIcon = rank.icon;

  const toggleLog = (id: string) => {
      setExpandedLog(expandedLog === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-32 p-6 max-w-md mx-auto relative overflow-hidden">
      
      {/* BACKGROUND ACCENTS */}
      <div className="fixed top-0 left-0 w-full h-96 bg-w8-red/10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* --- SETTINGS BUTTON --- */}
      <Link to="/settings" className="absolute top-6 right-6 z-20 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md border border-white/5">
         <Settings size={20} className="text-gray-300 hover:text-white" />
      </Link>

      {/* --- 1. IDENTITY HEADER --- */}
      <header className="relative z-10 text-center mb-8 mt-4">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-800 to-black rounded-full border-2 border-white/10 flex items-center justify-center mb-4 shadow-2xl relative">
           <RankIcon size={40} className={rank.color} />
           <div className="absolute -bottom-2 bg-black px-3 py-1 rounded-full border border-white/20 text-[10px] font-bold">
              LVL {Math.floor(battleLogs.length / 5) + 1}
           </div>
        </div>
        
        <h1 className="text-2xl font-black uppercase italic tracking-wider">
          {user.name}
        </h1>
        <div className={`text-xs font-mono font-bold tracking-[0.3em] uppercase mt-1 ${rank.color}`}>
           {rank.title} CLASS
        </div>
      </header>

      {/* --- 2. TROPHY ROOM --- */}
      <section className="mb-8 relative z-10">
         <div className="flex justify-between items-end mb-4">
            <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
               <Trophy size={12} className="text-w8-red"/> Trophy Room (Current 1RM)
            </h3>
         </div>

         <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center relative hover:border-w8-red/30 transition-colors">
               <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-2">Bench</p>
               <p className="text-xl font-black text-white">{stats.bench} <span className="text-[10px] text-gray-600 font-normal">KG</span></p>
            </div>
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center relative hover:border-w8-red/30 transition-colors">
               <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-2">Squat</p>
               <p className="text-xl font-black text-white">{stats.squat} <span className="text-[10px] text-gray-600 font-normal">KG</span></p>
            </div>
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center relative hover:border-w8-red/30 transition-colors">
               <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-2">Deadlift</p>
               <p className="text-xl font-black text-white">{stats.deadlift} <span className="text-[10px] text-gray-600 font-normal">KG</span></p>
            </div>
         </div>
      </section>

      {/* --- 3. BATTLE LOGS (FILTERED) --- */}
      <div className="relative z-10">
         <div className="flex justify-between items-end mb-4">
            <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
               <Activity size={12} className="text-w8-red"/> Battle Logs
            </h3>
            
            {/* SEARCH / DATE PICKER */}
            <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 bg-white/5 border ${searchDate ? 'border-w8-red' : 'border-white/10'} rounded-lg px-2 py-1 transition-colors`}>
                    <Search size={12} className={searchDate ? "text-w8-red" : "text-gray-500"} />
                    <input 
                        type="date" 
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="bg-transparent text-[10px] text-white uppercase outline-none font-mono w-24"
                    />
                    {searchDate && (
                        <button onClick={() => setSearchDate("")}><X size={12} className="text-gray-500 hover:text-white" /></button>
                    )}
                </div>
            </div>
         </div>

         {loading ? (
            <p className="text-center text-xs text-gray-600 font-mono animate-pulse mt-10">DECRYPTING RECORDS...</p>
         ) : visibleLogs.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-white/10 rounded-xl">
               <p className="text-xs text-gray-500">
                   {searchDate ? "No combat data found for this date." : "No activity recorded in the last 7 days."}
               </p>
               <button onClick={() => setSearchDate("")} className="text-[10px] text-w8-red font-bold mt-2 hover:underline">
                   {searchDate ? "CLEAR SEARCH" : "VIEW OLDER LOGS"}
               </button>
            </div>
         ) : (
            <div className="space-y-3">
               {visibleLogs.map((log) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    key={log.id}
                    className={`bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all ${expandedLog === log.id ? 'border-w8-red/50 bg-white/10' : 'hover:bg-white/10'}`}
                  >
                     {/* LOG HEADER */}
                     <div onClick={() => toggleLog(log.id)} className="p-4 flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-4">
                           <div className={`p-3 rounded-lg ${expandedLog === log.id ? 'bg-w8-red text-white' : 'bg-white/5 text-gray-400'}`}>
                              <Dumbbell size={18} />
                           </div>
                           <div>
                              <h4 className="font-bold text-sm text-white uppercase italic">{log.focus}</h4>
                              <p className="text-[10px] text-gray-500 font-mono flex items-center gap-2 mt-1">
                                 <Calendar size={10} /> {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                 <span className="text-w8-red">•</span>
                                 <Clock size={10} /> ~{log.duration} MIN
                              </p>
                           </div>
                        </div>
                        <motion.div animate={{ rotate: expandedLog === log.id ? 90 : 0 }}>
                           <ChevronRight size={16} className="text-gray-600" />
                        </motion.div>
                     </div>

                     {/* EXPANDED DETAILS */}
                     <AnimatePresence>
                        {expandedLog === log.id && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                className="bg-black/40 border-t border-white/5 px-4 pb-4"
                            >
                                <div className="space-y-2 mt-3">
                                    {log.exercises.map((ex: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-xs">
                                            <span className="text-gray-300 font-bold uppercase">{ex.name}</span>
                                            <div className="flex items-center gap-3 font-mono">
                                                <span className="text-gray-500">{ex.sets} x {ex.reps}</span>
                                                <span className="text-w8-red font-bold">{ex.weight} KG</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                     </AnimatePresence>
                  </motion.div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
}