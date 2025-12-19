import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Zap, RotateCcw, Calendar, FileText, Lock, ChevronRight } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Fuel() {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  
  // --- INPUT STATE ---
  const [stats, setStats] = useState({
    weight: '',
    height: '',
    dob: '', 
    gender: 'Male',
    goal: 'Hypertrophy',
    dietType: 'Vegetarian', 
    activityLevel: 'Moderate',
    budget: 'Student (Low Cost)',
    allergies: '',
    startDate: new Date().toISOString().split('T')[0] // Default to today
  });

  const [dietPlan, setDietPlan] = useState<any>(null);

  // --- 1. LOAD DATA (NOW FETCHES FROM DB) ---
  useEffect(() => {
    const storedUser = localStorage.getItem('w8_user');
    if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        const realId = parsedUser.id || parsedUser._id;

        // A. Load from LocalStorage (Instant)
        const savedPlan = localStorage.getItem('w8_diet_plan');
        const savedStats = localStorage.getItem('w8_diet_stats');
        
        if (savedPlan) {
            setDietPlan(JSON.parse(savedPlan));
            if(savedStats) setStats(JSON.parse(savedStats));
            setStep(3);
        }

        // B. Fetch from Database (Persistence Check)
        // This ensures that if you switch devices or refresh, the data comes back.
        fetch(`https://w8-fitness-backend-api.onrender.com/api/auth/my-diet/${realId}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.week) {
                    // Update state with server data
                    setDietPlan(data);
                    setStep(3);
                    // Sync local storage
                    localStorage.setItem('w8_diet_plan', JSON.stringify(data));
                }
            })
            .catch(err => console.error("Fuel Sync Failed:", err));
    }
  }, []);

  // --- HELPER: GET DATE FOR A SPECIFIC DAY INDEX ---
  const getDayDate = (dayIndex: number) => {
    const start = new Date(stats.startDate);
    start.setDate(start.getDate() + dayIndex);
    return start;
  };

  // --- 2. GENERATE PLAN ---
  const handleGenerate = async () => {
    if (!stats.weight || !stats.height || !stats.dob) return;
    setStep(2);

    // Get User ID
    const storedUser = localStorage.getItem('w8_user');
    const realId = storedUser ? (JSON.parse(storedUser).id || JSON.parse(storedUser)._id) : null;

    try {
      const res = await fetch('https://w8-fitness-backend-api.onrender.com/api/ai/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: realId, // <--- SENDS ID SO BACKEND CAN SAVE IT
            ...stats
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error("AI Failed");

      setDietPlan(data);
      // Save locally
      localStorage.setItem('w8_diet_plan', JSON.stringify(data));
      localStorage.setItem('w8_diet_stats', JSON.stringify(stats));
      setStep(3);
    } catch (err) {
      console.error(err);
      setStep(1);
      alert("System Overload. Try again.");
    }
  };

  // --- 3. PDF EXPORT ---
  const handleDownloadPDF = () => {
    if (!dietPlan) return;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("W8 FUEL // WEEKLY NUTRITION PROTOCOL", 14, 20);
    doc.setFontSize(10);
    doc.text(`TARGET: ${dietPlan.meta.dailyCalories} KCAL // GOAL: ${dietPlan.meta.goal ? dietPlan.meta.goal.toUpperCase() : 'FITNESS'}`, 14, 28);
    doc.text(`START DATE: ${new Date(stats.startDate).toDateString().toUpperCase()}`, 14, 33);

    let yPos = 45;

    dietPlan.week.forEach((day: any, index: number) => {
      const dateObj = getDayDate(index);
      const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();

      doc.setFillColor(234, 179, 8); // Yellow
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      
      // Header
      doc.rect(14, yPos, 182, 8, 'F');
      doc.text(`${dateStr} - P:${day.macros.p} C:${day.macros.c} F:${day.macros.f}`, 16, yPos + 6);
      
      const tableData = day.meals.map((m: any) => [
        m.time,
        m.name,
        m.ingredients,
        `${m.calories} kcal`
      ]);

      autoTable(doc, {
        startY: yPos + 10,
        head: [['Time', 'Meal', 'Ingredients', 'Energy']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [40, 40, 40], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
      if (yPos > 250) { doc.addPage(); yPos = 20; }
    });

    doc.save('W8-Fuel-Protocol.pdf');
  };

  const activeDay = dietPlan ? dietPlan.week[activeDayIndex] : null;
  const activeDate = getDayDate(activeDayIndex);

  return (
    <div className="p-6 max-w-md mx-auto min-h-screen pb-32">
      
      <header className="flex justify-between items-end mb-8 mt-2">
        <div>
          <div className="flex items-center gap-2 text-yellow-500 text-[10px] font-mono uppercase tracking-widest mb-1">
             <Utensils size={12} />
             <span>Navsari Metabolic AI</span>
          </div>
          <h1 className="text-3xl font-black italic uppercase text-white leading-none">
            Fuel <span className="text-gray-600">Protocol</span>
          </h1>
        </div>
        {step === 3 && (
            <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                <Lock size={10} /> <span>LOCKED</span>
            </div>
        )}
      </header>

      <AnimatePresence mode='wait'>
        
        {/* --- STEP 1: INPUT FORM --- */}
        {step === 1 && (
          <motion.div 
            key="input"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
             {/* BASIC STATS */}
             <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                <h3 className="text-yellow-500 font-bold uppercase text-[10px] tracking-widest mb-3">01 // Biometrics</h3>
                
                {/* START DATE INPUT */}
                <div className="mb-3">
                   <label className="text-[10px] text-gray-500 uppercase">Protocol Start Date</label>
                   <div className="flex items-center gap-2 bg-black border border-white/10 p-3 rounded mt-1">
                      <Calendar size={14} className="text-yellow-500"/>
                      <input 
                        type="date" 
                        value={stats.startDate}
                        className="bg-transparent text-white text-xs w-full outline-none uppercase"
                        onChange={(e) => setStats({...stats, startDate: e.target.value})}
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                   <input 
                     type="number" placeholder="Weight (KG)" 
                     className="bg-black border border-white/10 p-3 rounded text-white text-sm focus:border-yellow-500 outline-none"
                     onChange={(e) => setStats({...stats, weight: e.target.value})}
                   />
                   <input 
                     type="number" placeholder="Height (CM)" 
                     className="bg-black border border-white/10 p-3 rounded text-white text-sm focus:border-yellow-500 outline-none"
                     onChange={(e) => setStats({...stats, height: e.target.value})}
                   />
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className='relative'>
                        <span className='absolute top-[-8px] left-2 bg-black px-1 text-[9px] text-gray-500 uppercase'>Date of Birth</span>
                        <input 
                            type="date" 
                            className="w-full bg-black border border-white/10 p-3 rounded text-white text-xs focus:border-yellow-500 outline-none uppercase"
                            onChange={(e) => setStats({...stats, dob: e.target.value})}
                        />
                   </div>
                   <select 
                     className="bg-black border border-white/10 p-3 rounded text-white text-sm focus:border-yellow-500 outline-none"
                     onChange={(e) => setStats({...stats, gender: e.target.value})}
                   >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                   </select>
                </div>
             </div>

             {/* PREFERENCES */}
             <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                <h3 className="text-yellow-500 font-bold uppercase text-[10px] tracking-widest mb-3">02 // Context</h3>
                
                <div className="mb-3">
                   <label className="text-[10px] text-gray-500 uppercase">Diet Preference</label>
                   <select 
                     className="w-full bg-black border border-white/10 p-3 rounded text-white text-sm focus:border-yellow-500 outline-none mt-1"
                     onChange={(e) => setStats({...stats, dietType: e.target.value})}
                   >
                      <option value="Vegetarian">Pure Veg (Gujarati)</option>
                      <option value="Eggetarian">Eggetarian (Veg + Eggs)</option>
                      <option value="Non-Veg">Non-Veg (Chicken/Fish)</option>
                   </select>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                   <div>
                      <label className="text-[10px] text-gray-500 uppercase">Activity</label>
                      <select 
                        className="w-full bg-black border border-white/10 p-3 rounded text-white text-sm focus:border-yellow-500 outline-none mt-1"
                        onChange={(e) => setStats({...stats, activityLevel: e.target.value})}
                      >
                         <option value="Sedentary">Sedentary</option>
                         <option value="Moderate">Moderate</option>
                         <option value="Active">Active</option>
                      </select>
                   </div>
                   <div>
                      <label className="text-[10px] text-gray-500 uppercase">Budget</label>
                      <select 
                        className="w-full bg-black border border-white/10 p-3 rounded text-white text-sm focus:border-yellow-500 outline-none mt-1"
                        onChange={(e) => setStats({...stats, budget: e.target.value})}
                      >
                         <option value="Student (Low Cost)">Student</option>
                         <option value="Standard">Standard</option>
                         <option value="Premium">Premium</option>
                      </select>
                   </div>
                </div>
             </div>

             <button 
               onClick={handleGenerate}
               disabled={!stats.weight || !stats.height || !stats.dob}
               className="w-full bg-yellow-500 hover:bg-yellow-600 text-black p-4 rounded-sm font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(234,179,8,0.4)]"
             >
               Initialize Protocol
             </button>
          </motion.div>
        )}

        {/* --- STEP 2: LOADING --- */}
        {step === 2 && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-64 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-6"></div>
             <p className="text-white font-bold uppercase tracking-widest text-xs">Calibrating Diet...</p>
             <p className="text-gray-500 text-[10px] font-mono mt-2">OPTIMIZING FOR {stats.goal.toUpperCase()}...</p>
          </motion.div>
        )}

        {/* --- STEP 3: WEEKLY VIEW --- */}
        {step === 3 && dietPlan && activeDay && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             
             {/* WEEKLY TABS */}
             <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
               {dietPlan.week.map((day: any, index: number) => {
                  const date = getDayDate(index);
                  return (
                    <button 
                        key={index} 
                        onClick={() => setActiveDayIndex(index)} 
                        className={`flex-shrink-0 px-5 py-3 rounded-lg border flex flex-col items-center min-w-[80px] transition-all 
                            ${activeDayIndex === index ? 'bg-yellow-500 border-yellow-500 text-black' : 'bg-white/5 border-white/10 text-gray-500'}`}
                    >
                        <span className="text-[10px] font-bold uppercase">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className="text-lg font-black">{date.getDate()}</span>
                    </button>
                  );
               })}
             </div>

             {/* DAILY MACRO CARD */}
             <div className="bg-white/5 border border-white/10 p-5 rounded-xl mb-6 relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-black italic uppercase text-white">
                            {activeDate.toLocaleDateString('en-US', { weekday: 'long' })}
                        </h2>
                        <p className="text-xs text-yellow-500 font-mono tracking-widest uppercase">
                            {activeDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="block text-2xl font-black text-yellow-500 leading-none">{dietPlan.meta.dailyCalories}</span>
                        <span className="text-[9px] text-gray-500 font-mono">TARGET KCAL</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center bg-black/40 p-3 rounded-lg border border-white/5">
                   <div><p className="text-lg font-bold text-blue-400">{activeDay.macros.p}g</p><p className="text-[9px] text-gray-500 uppercase">Protein</p></div>
                   <div><p className="text-lg font-bold text-green-400">{activeDay.macros.c}g</p><p className="text-[9px] text-gray-500 uppercase">Carbs</p></div>
                   <div><p className="text-lg font-bold text-red-400">{activeDay.macros.f}g</p><p className="text-[9px] text-gray-500 uppercase">Fats</p></div>
                </div>
             </div>

             {/* MEAL LIST */}
             <div className="space-y-3 mb-8">
                {activeDay.meals.map((meal: any, index: number) => (
                   <div key={index} className="bg-black/40 p-4 rounded-xl border border-white/10 flex justify-between items-start">
                         <div>
                            <p className="text-[10px] text-yellow-500 font-mono mb-1">{meal.time}</p>
                            <h4 className="font-bold uppercase italic text-white text-sm">{meal.name}</h4>
                            <p className="text-xs text-gray-400 mt-1">{meal.ingredients}</p>
                         </div>
                         <div className="text-right min-w-[60px]">
                            <p className="text-white font-bold text-sm">{meal.calories}</p>
                            <p className="text-[9px] text-gray-500">KCAL</p>
                         </div>
                   </div>
                ))}
             </div>

             {/* ACTION BUTTONS */}
             <div className="flex gap-3">
                <button 
                  onClick={() => {
                      if(window.confirm("Start a new week? Current protocol will be erased.")) {
                          localStorage.removeItem('w8_diet_plan'); 
                          localStorage.removeItem('w8_diet_stats');
                          setStep(1);
                          setStats({ ...stats, startDate: new Date().toISOString().split('T')[0] });
                      }
                  }}
                  className="flex-1 bg-white/5 py-4 font-bold text-xs uppercase tracking-widest text-gray-500 hover:text-white border border-white/10 rounded-md"
                >
                  Next Week
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  className="flex-[2] bg-white text-black py-4 font-black text-xs uppercase tracking-widest hover:bg-gray-200 rounded-md flex items-center justify-center gap-2"
                >
                   <FileText size={16} /> Download PDF
                </button>
             </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}