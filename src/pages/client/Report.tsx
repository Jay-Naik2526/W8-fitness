import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Activity, TrendingUp, Zap, BarChart3, PieChart, Download, Crosshair, Droplets, ArrowUpRight } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Report() {
  const [loading, setLoading] = useState(true);
  const [workoutData, setWorkoutData] = useState<any>(null);
  const [dietData, setDietData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]); 
  const [hydration, setHydration] = useState(0); 
  const [stats, setStats] = useState<any>({ goal: '' });

  // --- 1. DATA HARVEST ---
  useEffect(() => {
    const fetchData = async () => {
        const storedUser = localStorage.getItem('w8_user');
        const storedDiet = localStorage.getItem('w8_diet_plan');
        const storedStats = localStorage.getItem('w8_diet_stats'); // Need stats for goal

        if (storedDiet) setDietData(JSON.parse(storedDiet));
        if (storedStats) setStats(JSON.parse(storedStats));

        const today = new Date().toDateString();
        const savedHydro = localStorage.getItem(`w8_hydro_${today}`);
        if (savedHydro) setHydration(parseInt(savedHydro));

        if (storedUser) {
            const realId = JSON.parse(storedUser).id || JSON.parse(storedUser)._id;
            try {
                // Active Plan
                const resPlan = await fetch(`https://w8-fitness-backend-api.onrender.com/api/ai/weekly-plan/${realId}`);
                if (resPlan.ok) setWorkoutData(await resPlan.json());

                // History
                const resHist = await fetch(`https://w8-fitness-backend-api.onrender.com/api/ai/stats-history/${realId}`);
                if (resHist.ok) setHistoryData(await resHist.json());

            } catch (err) { console.error("Intel Uplink Failed", err); }
        }
        setLoading(false);
    };
    fetchData();
  }, []);

  // --- 2. CALCULATORS ---
  const updateHydration = (val: number) => {
      const today = new Date().toDateString();
      setHydration(val);
      localStorage.setItem(`w8_hydro_${today}`, val.toString());
  };

  const calculateWorkoutBurn = (day: any) => {
    if (!day || !day.exercises) return 0;
    return day.exercises.reduce((acc: number, ex: any) => {
        const sets = parseInt(ex.sets) || 3;
        const reps = parseInt(ex.reps) || 10;
        const weight = parseInt(ex.weight) || 20; 
        const intensity = weight > 60 ? 0.15 : 0.08; 
        return acc + ((sets * reps * intensity) + 45);
    }, 0);
  };

  // Merge Data for Charts
  const chartData = workoutData?.days.map((wDay: any) => {
      const burn = Math.round(calculateWorkoutBurn(wDay));
      const tdee = dietData?.meta?.dailyCalories || 2000; 
      const intake = dietData?.meta?.dailyCalories || 2000; 
      
      return {
          day: new Date(wDay.date).toLocaleDateString('en-US', { weekday: 'short' }),
          burn: burn, 
          baseBurn: tdee,
          output: tdee + burn, // Total Burn (Metabolic + Gym)
          intake: intake,
          net: intake - (tdee + burn) // The Deficit/Surplus
      };
  }) || [];

  const maxCalVal = Math.max(...chartData.map((d: any) => Math.max(d.intake, d.output)), 2500);
  const weeklySurplus = chartData.reduce((acc: number, d: any) => acc + d.net, 0);
  const projectedWeightChange = (weeklySurplus / 7700).toFixed(2); // 7700kcal = 1kg fat

  // --- 3. CUSTOM LINE CHART ---
  const LineChart = ({ data, dataKey, color }: any) => {
      if (!data || data.length < 2) return <div className="h-full flex items-center justify-center text-[10px] text-gray-500 font-mono">AWAITING MORE DATA</div>;
      
      const max = Math.max(...data.map((d:any) => d[dataKey])) * 1.1;
      const min = Math.min(...data.map((d:any) => d[dataKey])) * 0.9;
      
      return (
          <div className="relative w-full h-full flex items-end justify-between pt-4 px-2">
              <svg className="absolute inset-0 w-full h-full overflow-visible">
                  <polyline
                      fill="none" stroke={color} strokeWidth="2"
                      points={data.map((d: any, i: number) => {
                          const x = (i / (data.length - 1)) * 100;
                          const y = 100 - ((d[dataKey] - min) / (max - min)) * 100;
                          return `${x * 3} ${y}`; // Rough scaling
                      }).join(' ')}
                      vectorEffect="non-scaling-stroke"
                  />
                  {data.map((d: any, i: number) => {
                      const x = (i / (data.length - 1)) * 100;
                      const y = 100 - ((d[dataKey] - min) / (max - min)) * 100;
                      return <circle key={i} cx={`${x}%`} cy={`${y}%`} r="3" fill={color} />;
                  })}
              </svg>
          </div>
      );
  };

  const strengthHistory = historyData.map((h: any) => ({
      week: h.weekNumber,
      bench: h.startingStats?.bench || 0,
      squat: h.startingStats?.squat || 0,
      dead: h.startingStats?.deadlift || 0,
      weight: h.startingStats?.bodyWeight || 0
  }));

  // --- 4. EXPORT ---
  const handleDownloadReport = () => {
    const doc = new jsPDF();
    doc.setFillColor(0,0,0); doc.rect(0,0,210,297,'F');
    doc.setTextColor(255,255,255); doc.setFontSize(22); doc.text("W8 TACTICAL REPORT", 14, 25);
    doc.setFontSize(10); doc.setTextColor(214, 0, 0); doc.text(`GOAL: ${stats.goal?.toUpperCase()}`, 14, 35);

    autoTable(doc, {
        startY: 45,
        head: [['Metric', 'Value']],
        body: [
            ['Net Bio-Availability', `${weeklySurplus} KCAL/WK`],
            ['Projected Delta', `${projectedWeightChange} KG`],
            ['Hydration', `${hydration}/8 Bottles`],
            ['Strength Trend', strengthHistory.length > 1 ? 'POSITIVE' : 'PENDING'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [214, 0, 0] },
        bodyStyles: { fillColor: [20, 20, 20], textColor: 255 }
    });
    doc.save('W8-Full-Intel.pdf');
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-w8-red font-mono animate-pulse">ESTABLISHING UPLINK...</div>;

  return (
    <div className="p-6 pt-10 min-h-screen max-w-md mx-auto relative pb-32">
       
       <header className="mb-8">
        <div className="flex items-center gap-2 text-w8-red text-[10px] font-mono uppercase tracking-widest mb-1">
          <Activity size={12} /><span>Biometric Analytics v2.0</span>
        </div>
        <h1 className="text-3xl font-black italic uppercase text-white leading-none">Fitness <span className="text-gray-600">Intel</span></h1>
      </header>

      {/* --- ROW 1: HEADLINES (RESTORED) --- */}
      <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 p-4 rounded-xl">
             <div className="flex items-center gap-2 text-yellow-500 mb-2">
                <Zap size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Net Energy</span>
             </div>
             <div className="text-2xl font-black text-white">{weeklySurplus > 0 ? '+' : ''}{Math.round(weeklySurplus / 7)} <span className="text-xs text-gray-500 font-normal">kcal/day</span></div>
             <p className="text-[9px] text-gray-400 mt-1 uppercase">{weeklySurplus > 0 ? 'Surplus (Growth)' : 'Deficit (Cut)'}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 border border-white/10 p-4 rounded-xl">
             <div className="flex items-center gap-2 text-w8-red mb-2">
                <TrendingUp size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Projected</span>
             </div>
             <div className="text-2xl font-black text-white">{projectedWeightChange} <span className="text-xs text-gray-500 font-normal">kg/wk</span></div>
             <p className="text-[9px] text-gray-400 mt-1 uppercase">Based on 7-Day Plan</p>
          </motion.div>
      </div>

      {/* --- ROW 2: HYDRATION & MASS (NEW) --- */}
      <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Hydration */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="text-blue-400 font-bold uppercase text-xs flex items-center gap-1"><Droplets size={14}/> Aqua</h3>
                  <span className="text-[9px] font-mono text-gray-400">{hydration}/8</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                  {[1,2,3,4,5,6,7,8].map((num) => (
                      <button 
                        key={num} 
                        onClick={() => updateHydration(num)}
                        className={`h-8 rounded-sm transition-all ${num <= hydration ? 'bg-blue-500' : 'bg-white/10'}`}
                      />
                  ))}
              </div>
          </div>

          {/* Mass Trend Graph */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl relative overflow-hidden">
             <div className="flex items-center gap-2 text-yellow-500 mb-1">
                <Crosshair size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Mass Trend</span>
             </div>
             <div className="h-12 border-l border-b border-white/10 mt-2">
                 <LineChart data={strengthHistory} dataKey="weight" color="#EAB308" />
             </div>
          </div>
      </div>

      {/* --- ROW 3: STRENGTH BALLISTICS (NEW) --- */}
      <div className="bg-white/5 border border-white/10 p-5 rounded-xl mb-6 h-48 flex flex-col">
          <div className="flex justify-between items-center mb-2">
              <h3 className="text-white font-bold uppercase text-xs flex items-center gap-2"><ArrowUpRight size={14} className="text-green-500"/> Strength Vector</h3>
              <div className="flex gap-2 text-[9px] font-mono">
                  <span className="text-w8-red">BENCH</span>
                  <span className="text-white">SQUAT</span>
                  <span className="text-gray-500">DEADLIFT</span>
              </div>
          </div>
          <div className="flex-1 relative border-l border-b border-white/10">
             <div className="absolute inset-0 opacity-100"><LineChart data={strengthHistory} dataKey="bench" color="#D60000" /></div>
             <div className="absolute inset-0 opacity-50"><LineChart data={strengthHistory} dataKey="squat" color="#FFFFFF" /></div>
             <div className="absolute inset-0 opacity-30"><LineChart data={strengthHistory} dataKey="dead" color="#888888" /></div>
          </div>
      </div>

      {/* --- ROW 4: METABOLIC BATTLEGROUND (RESTORED DYNAMIC) --- */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 border border-white/10 p-5 rounded-xl mb-6">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-gray-200 font-bold uppercase text-xs flex items-center gap-2"><BarChart3 size={14} className="text-w8-red"/> Metabolic Battleground</h3>
            <div className="flex gap-3 text-[9px] font-mono">
                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> INTAKE</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-w8-red rounded-full"></div> OUTPUT</span>
            </div>
         </div>
         <div className="flex justify-between items-end h-32 gap-2 relative border-b border-white/5 pb-1">
            {chartData.map((d: any, i: number) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1 h-full justify-end group">
                    <div className="relative w-full h-full flex items-end justify-center">
                        <motion.div initial={{ height: 0 }} animate={{ height: `${(d.intake / maxCalVal) * 100}%` }} className="w-1.5 bg-yellow-500 rounded-t-sm absolute bottom-0 left-[25%] opacity-80" />
                        <motion.div initial={{ height: 0 }} animate={{ height: `${(d.output / maxCalVal) * 100}%` }} className="w-1.5 bg-w8-red rounded-t-sm absolute bottom-0 right-[25%] opacity-90" />
                    </div>
                    <span className="text-[9px] text-gray-600 font-mono uppercase">{d.day}</span>
                </div>
            ))}
         </div>
      </motion.div>

      {/* --- ROW 5: MACRO & ANALYSIS (RESTORED) --- */}
      <div className="grid grid-cols-3 gap-3 mb-6">
         <div className="col-span-1 bg-white/5 border border-white/10 p-3 rounded-xl flex flex-col items-center justify-center relative">
             <div className="w-12 h-12 rounded-full border-4 border-white/10 relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#3b82f6 0% 30%, #22c55e 30% 70%, #ef4444 70% 100%)`, opacity: 0.8 }}></div>
                <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center"><PieChart size={16} className="text-gray-500"/></div>
             </div>
             <p className="text-[8px] text-gray-400 mt-2 font-mono uppercase">Macros</p>
         </div>

         <div className="col-span-2 bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col justify-center">
             <h4 className="text-w8-red font-bold uppercase text-[10px] mb-2 flex items-center gap-2"><Crosshair size={12}/> Analysis</h4>
             <p className="text-[10px] text-gray-300 leading-relaxed">
                {weeklySurplus > 500 ? "High surplus. Monitor fat gain." : weeklySurplus < -500 ? "Aggressive cut. Keep protein high." : "Maintenance zone. Focus on strength."}
             </p>
         </div>
      </div>

      <button onClick={handleDownloadReport} className="w-full bg-white text-black py-4 rounded-sm font-black uppercase tracking-[0.2em] hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
        <Download size={18} /> Export Intel
      </button>

    </div>
  );
}