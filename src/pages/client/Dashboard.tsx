import React, { useEffect, useState } from 'react';
import { Zap, Users, Flame, ChevronRight, Bell, Cloud, Navigation, Battery, MessageSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from 'react-router-dom';

// --- VISUAL AD DATA (IMAGES ONLY) ---
const ADS = [
  { 
    id: 1, 
    image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=1000&auto=format&fit=crop" 
  },
  { 
    id: 2, 
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop" 
  },
  { 
    id: 3, 
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop" 
  }
];

export default function Dashboard() {
  const [stats, setStats] = useState<any>({ 
    name: 'Operative', tier: 'Initiate', calories: 0, streak: 0, id: '0000'
  });
  
  // New State for Dynamic Workout Calories
  const [todayBurn, setTodayBurn] = useState(0);

  const [weather, setWeather] = useState<number | null>(null);
  const [crowdLevel, setCrowdLevel] = useState({ label: 'Scanning...', percent: 0, color: 'text-gray-500' });
  const [mission, setMission] = useState({ title: 'Rest Day', sub: 'Recovery Protocol' });
  const [checkedIn, setCheckedIn] = useState(false);
  const [loadingBeacon, setLoadingBeacon] = useState(false);
  const [adIndex, setAdIndex] = useState(0);

  // --- NEW: NOTIFICATION STATES ---
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
    const adInterval = setInterval(() => setAdIndex((prev) => (prev + 1) % ADS.length), 5000); 
    return () => clearInterval(adInterval);
  }, []);

  // --- HELPER: CALCULATE CALORIES ---
  const calculateDailyBurn = (day: any) => {
    if (!day || !day.exercises) return 0;
    const totalBurn = day.exercises.reduce((acc: number, ex: any) => {
        const sets = parseInt(ex.sets) || 3;
        const reps = parseInt(ex.reps) || 10;
        const weight = parseInt(ex.weight) || 20; 
        const intensityFactor = weight > 60 ? 0.15 : 0.08; 
        const exerciseBurn = (sets * reps * intensityFactor) + 45; 
        return acc + exerciseBurn;
    }, 0);
    return Math.round(totalBurn);
  };

  const loadDashboardData = async () => {
    const storedUser = localStorage.getItem('w8_user');
    if (!storedUser) return;
    const parsedUser = JSON.parse(storedUser);
    const realId = parsedUser.id || parsedUser._id;

    // A. FETCH BASIC STATS
    try {
      const res = await fetch(`https://w8-fitness-backend-api.onrender.com/api/auth/stats/${realId}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        if (data.checkedInToday) setCheckedIn(true);
      }
    } catch (err) { console.error("Stats fetch failed", err); }

    // B. FETCH WEEKLY PLAN FOR DYNAMIC CALORIES
    try {
        const resPlan = await fetch(`https://w8-fitness-backend-api.onrender.com/api/ai/weekly-plan/${realId}`);
        if (resPlan.ok) {
            const planData = await resPlan.json();
            if (planData && planData.days) {
                // Find Today's Workout
                const todayDate = new Date().toDateString();
                const todayWorkout = planData.days.find((d: any) => new Date(d.date).toDateString() === todayDate);
                
                if (todayWorkout) {
                    const burn = calculateDailyBurn(todayWorkout);
                    setTodayBurn(burn);
                    // Also Update Mission Title from Real Plan
                    setMission({ title: todayWorkout.focus || 'Active Duty', sub: `${burn} KCAL TARGET` });
                }
            }
        }
    } catch (err) { console.error("Plan sync failed", err); }

    // C. WEATHER & CROWD
    try {
       const wRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=20.95&longitude=72.93&current=temperature_2m');
       const wData = await wRes.json();
       setWeather(wData.current.temperature_2m);
    } catch (err) { setWeather(30); }

    const hour = new Date().getHours();
    if (hour >= 6 && hour < 9) setCrowdLevel({ label: 'HIGH', percent: 85, color: 'text-w8-red' });
    else if (hour >= 17 && hour < 21) setCrowdLevel({ label: 'PEAK', percent: 95, color: 'text-w8-red' });
    else if (hour >= 9 && hour < 17) setCrowdLevel({ label: 'MODERATE', percent: 45, color: 'text-yellow-500' });
    else setCrowdLevel({ label: 'GHOST TOWN', percent: 10, color: 'text-green-500' });

    // D. FETCH NOTIFICATIONS (NEW COMMS LINK)
    try {
        const resNotes = await fetch(`https://w8-fitness-backend-api.onrender.com/api/auth/notifications/${realId}`);
        if (resNotes.ok) {
            const data = await resNotes.json();
            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.read).length);
        }
    } catch (err) { console.error("Comms Offline"); }
  };

  const handleCheckIn = async () => {
    setLoadingBeacon(true);
    const storedUser = localStorage.getItem('w8_user');
    if (!storedUser) return;
    const parsedUser = JSON.parse(storedUser);
    const realId = parsedUser.id || parsedUser._id;

    try {
      const res = await fetch('https://w8-fitness-backend-api.onrender.com/api/auth/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: realId })
      });
      const data = await res.json();
      if (res.ok) {
         setCheckedIn(true);
         setStats((prev: any) => ({ ...prev, streak: data.streak }));
      } else {
         if (data.error && data.error.includes("Already")) {
             setCheckedIn(true);
             alert("COMMAND: You are already deployed for today.");
         } else { alert("ERROR: " + data.error); }
      }
    } catch (err) { alert("BEACON OFFLINE"); } finally { setLoadingBeacon(false); }
  };

  return (
    <div className="p-6 max-w-md mx-auto pb-24 relative">
      
      {/* HEADER */}
      <header className="flex justify-between items-start mb-4 mt-2 relative z-50">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 text-gray-400 text-[10px] font-mono uppercase tracking-widest mb-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>
            System Online
          </div>
          <h1 className="text-3xl font-black italic uppercase text-white leading-none">
            {stats.name?.split(' ')[0]} <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-600">{stats.name?.split(' ')[1] || ''}</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            ID: #W8-{stats.id ? stats.id.slice(-4).toUpperCase() : '----'} • {stats.tier} CLASS
          </p>
        </motion.div>

        {/* NOTIFICATION CENTER (NEW) */}
        <div className="relative">
            <motion.button 
              onClick={() => setShowNotes(!showNotes)}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className={`p-3 rounded-xl border transition-colors ${showNotes ? 'bg-w8-red border-w8-red text-white' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border border-black animate-ping"></span>}
            </motion.button>

            {/* NOTIFICATION DROPDOWN */}
            <AnimatePresence>
                {showNotes && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-14 w-72 bg-black border border-white/20 rounded-xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-3 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Incoming Intel</span>
                            <button onClick={() => setShowNotes(false)}><X size={14} className="text-gray-500 hover:text-white"/></button>
                        </div>
                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-6 text-center text-gray-600 text-xs font-mono">NO NEW MESSAGES</div>
                            ) : (
                                notifications.map(note => (
                                    <div key={note._id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[9px] font-bold text-w8-red uppercase tracking-widest">{note.type}</span>
                                            <span className="text-[9px] text-gray-600 font-mono">{new Date(note.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-300 leading-tight">{note.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </header>

      {/* --- STANDARD AD BANNER (PURE IMAGE) --- */}
      <div className="mb-6 h-48 w-full relative overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-black">
        <AnimatePresence mode='wait'>
          <motion.div
            key={adIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
             <img 
               src={ADS[adIndex].image} 
               alt="Sponsor"
               className="w-full h-full object-cover"
             />
             <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur px-1.5 rounded border border-white/10">
                <span className="text-[8px] text-white/50 font-mono uppercase">Promoted</span>
             </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* WEATHER */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 mb-6">
        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
           <div>
             <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Navsari</p>
             <p className="text-lg font-bold text-white">{weather !== null ? `${weather}°C` : '--'}</p>
           </div>
           <Cloud size={20} className="text-gray-400" />
        </div>
        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
           <div>
             <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Recovery</p>
             <p className="text-lg font-bold text-green-400">92%</p>
           </div>
           <Battery size={20} className="text-green-400" />
        </div>
      </motion.div>

      {/* BEACON */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
        className="mb-8"
      >
         {!checkedIn ? (
           <button 
             onClick={handleCheckIn}
             disabled={loadingBeacon}
             className="w-full bg-w8-red py-5 rounded-2xl relative overflow-hidden group shadow-[0_0_30px_rgba(214,0,0,0.4)] hover:scale-[1.02] transition-transform active:scale-95 border border-red-500/50"
           >
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              
              <div className="relative z-10 flex flex-col items-center gap-1">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                    <span className="text-xl font-black italic uppercase text-white tracking-widest">
                       {loadingBeacon ? "CONNECTING..." : "DEPLOY TO BASE"}
                    </span>
                 </div>
                 <p className="text-[10px] text-red-100 font-mono opacity-80">CONFIRM ATTENDANCE • +1 STREAK XP</p>
              </div>
           </button>
         ) : (
           <div className="w-full bg-green-900/20 border border-green-500/30 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
              <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e] animate-pulse"></div>
              <span className="text-sm font-bold text-green-400 uppercase tracking-widest">OPERATIVE ONLINE</span>
           </div>
         )}
      </motion.section>

      {/* DAILY MISSION */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
        className="mb-8 relative z-10"
      >
        <Link to="/build">
          <button className="w-full h-36 rounded-2xl relative overflow-hidden group shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-white/10 text-left">
             <video 
               autoPlay loop muted playsInline
               className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700 ease-out grayscale group-hover:grayscale-0 z-0"
               src="/videos/arena.mp4" 
             />
             <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
             
             <div className="absolute bottom-0 left-0 w-2/3 p-5 z-20">
                <div className="flex items-center gap-2 mb-1">
                   <Zap size={14} className="text-w8-red fill-w8-red animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Daily Protocol</span>
                </div>
                <h2 className="text-2xl font-black italic uppercase text-white leading-none mb-1">{mission.title}</h2>
                <p className="text-xs text-white/60 font-mono">{mission.sub}</p>
             </div>

             <div className="absolute right-5 top-1/2 -translate-x-1/2 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform z-20">
                <ChevronRight size={24} className="text-white ml-0.5" />
             </div>
          </button>
        </Link>
      </motion.div>

      {/* CROWD METER */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <div className="flex justify-between items-end mb-3">
          <h3 className="text-gray-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Users size={12} className="text-w8-red"/> Live Floor Density
          </h3>
          <span className={`font-mono text-xs font-bold animate-pulse ${crowdLevel.color}`}>{crowdLevel.label}</span>
        </div>
        <div className="w-full h-12 bg-black border border-white/10 rounded-xl relative overflow-hidden flex items-center px-2 shadow-inner">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
           <div className="absolute inset-0 flex justify-between px-2 items-center opacity-10">
              {[...Array(10)].map((_, i) => <div key={i} className="w-[1px] h-4 bg-white"></div>)}
           </div>
           <motion.div 
             initial={{ width: 0 }} animate={{ width: `${crowdLevel.percent}%` }} transition={{ duration: 1.5, ease: "circOut" }}
             className="relative z-10 h-5 bg-gradient-to-r from-w8-red/20 to-w8-red rounded-md border border-w8-red/50 shadow-[0_0_15px_rgba(214,0,0,0.4)] flex items-center justify-end px-2"
           >
             <span className="text-[9px] font-black text-white">{crowdLevel.percent}%</span>
           </motion.div>
        </div>
      </motion.section>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden group"
        >
           <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Flame size={40} />
           </div>
           {/* DYNAMIC CALORIE DISPLAY */}
           <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Total Output</p>
           <p className="text-3xl font-black text-white">{todayBurn > 0 ? todayBurn : stats.calories.toLocaleString()}</p>
           <p className="text-[10px] text-w8-red font-mono mt-1">KCAL BURNED</p>
        </motion.div>

        <motion.div 
           initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
           className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden group"
        >
           <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Navigation size={40} />
           </div>
           <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Active Streak</p>
           <p className="text-3xl font-black text-white">{stats.streak} <span className="text-sm font-bold text-gray-500">Days</span></p>
           <p className="text-[10px] text-green-500 mt-4">Keep pushing.</p>
        </motion.div>
      </div>

      {/* ORACLE CHAT */}
      <Link to="/oracle" className="fixed bottom-24 right-6 bg-w8-red p-4 rounded-full shadow-lg z-50 hover:scale-110 transition-transform border-2 border-white/10 group">
        <MessageSquare size={24} className="text-white" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-black animate-pulse"></div>
      </Link>

    </div>
  );
}