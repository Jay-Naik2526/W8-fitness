import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, Save, FileText, Lock, Edit3, Calendar, Dumbbell, PlayCircle, X, Loader, Youtube, Flame, Clock, Home, Settings, Disc } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- 1. YOUR EXACT FACILITY INVENTORY ---
const GYM_INVENTORY = `
STRICT EQUIPMENT LIST (USE ONLY THESE):
CARDIO: Treadmill (5), Elliptical (2), Recumbent bike (1), Step-up Climber (1), Spinning Bike (2), Air Bike (2), Air Rower (2), Ski Trainer (1).
MACHINES: Pec Fly, Vertical Chest press, Assisted Dip Chin, Overhead press, Bicep Curl, Lateral Raise, Seated Tricep Dip, Leg Extension, Prone Leg Curl, Abductor Combo, Multi Functional Station, Lat Pull down dual pulley, Plate Loaded Rowing Machine, Smith Machine Counter balanced, Seated Calf, 45 Degree Leg Press.
BENCHES: Olympic Flat Bench, Olympic Incline Bench, Olympic Decline Bench, Super Bench (3), Utility Bench (2), Work Bench, Abdominal Board Adjustable, Back Extension, Preacher Curl Bench.
STATIONS: Deadlift Station, Power Cage, Half Rack, Weight Lifting Platform.
FREE WEIGHTS: Dumbbells (2.5kg to 40kg in 2.5kg increments).
PLATES (BUMPER): Pairs of 2.5kg, 5kg, 10kg, 15kg, 20kg, 25kg.
`;

// Types for the Scheduler
type EquipmentType = 'Full Gym' | 'Dumbbells' | 'Bodyweight';
type DurationType = '30' | '45' | '60' | '90';

interface DayConfig {
  id: string; // 'mon', 'tue'...
  label: string;
  active: boolean;
  equipment: EquipmentType;
  duration: DurationType;
}

export default function Architect() {
  const [step, setStep] = useState(1); 
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // --- VIDEO DEMO STATE ---
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentExerciseName, setCurrentExerciseName] = useState("");
  const [errorMsg, setErrorMsg] = useState(""); 
  
  // --- DIET SYNC STATE ---
  const [dailyTDEE, setDailyTDEE] = useState<number | null>(null);

  // --- CONFIGURATION STATE ---
  const [config, setConfig] = useState({
    bench: '', squat: '', deadlift: '',
    goal: 'Hypertrophy',
    startDate: new Date().toISOString().split('T')[0]
  });

  // --- SCHEDULE STATE ---
  const [schedule, setSchedule] = useState<DayConfig[]>([
    { id: 'mon', label: 'Mon', active: true, equipment: 'Full Gym', duration: '60' },
    { id: 'tue', label: 'Tue', active: true, equipment: 'Full Gym', duration: '60' },
    { id: 'wed', label: 'Wed', active: true, equipment: 'Full Gym', duration: '60' },
    { id: 'thu', label: 'Thu', active: true, equipment: 'Full Gym', duration: '60' },
    { id: 'fri', label: 'Fri', active: true, equipment: 'Full Gym', duration: '60' },
    { id: 'sat', label: 'Sat', active: true, equipment: 'Full Gym', duration: '60' },
    { id: 'sun', label: 'Sun', active: false, equipment: 'Bodyweight', duration: '30' },
  ]);

  const [weeklyPlan, setWeeklyPlan] = useState<any>(null);

  // --- LOAD DATA ON START ---
  useEffect(() => {
    const fetchPlan = async () => {
        const storedUser = localStorage.getItem('w8_user');
        if (!storedUser) return;
        const realId = JSON.parse(storedUser).id || JSON.parse(storedUser)._id;

        try {
            const res = await fetch(`http://localhost:5000/api/ai/weekly-plan/${realId}`);
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    setWeeklyPlan(data);
                    setStep(3);
                }
            }
        } catch (err) { console.error("Load failed", err); }
    };
    fetchPlan();

    const savedDiet = localStorage.getItem('w8_diet_plan');
    if (savedDiet) {
        const dietData = JSON.parse(savedDiet);
        if (dietData.meta && dietData.meta.dailyCalories) {
            setDailyTDEE(dietData.meta.dailyCalories);
        }
    }
  }, []);

  // --- HELPER: CALCULATE PLATE MATH (CUSTOM INVENTORY) ---
  const getPlateMath = (exerciseName: string, weightVal: any) => {
    // 1. If weight is text (e.g., "Moderate"), return it directly
    const weight = parseInt(weightVal);
    if (isNaN(weight)) return String(weightVal).toUpperCase();

    const name = exerciseName.toLowerCase();
    
    // 2. DUMBBELL CHECK (2.5kg increments)
    if (name.includes('dumbbell') || name.includes('db ')) {
        const dbWeight = Math.round(weight / 2.5) * 2.5; 
        return `USE ${dbWeight} KG DUMBBELLS`;
    }

    // 3. MACHINE CHECK
    if (name.includes('machine') || name.includes('press') || name.includes('extension') || name.includes('curl') || name.includes('row')) {
        if (!name.includes('bench') && !name.includes('squat') && !name.includes('deadlift')) {
            return `SET PIN / LOAD: ${weight} KG`;
        }
    }

    // 4. BARBELL PLATE MATH (20kg Bar + Specific Bumper Set)
    if (weight < 20) return "BAR ONLY (20KG)";
    
    const oneSide = (weight - 20) / 2;
    if (oneSide <= 0) return "BAR ONLY (20KG)";

    // Your Specific Bumper Plate Set
    const availablePlates = [25, 20, 15, 10, 5, 2.5]; 
    let remaining = oneSide;
    const platesNeeded: number[] = [];

    availablePlates.forEach(plate => {
        while (remaining >= plate) {
            platesNeeded.push(plate);
            remaining -= plate;
        }
    });

    if (platesNeeded.length === 0) return `LOAD: ${weight} KG`;
    
    return `[ ${platesNeeded.join(' + ')} ] / SIDE`;
  };

  // --- HELPER: CALORIES (Safe Handling for Text Weights) ---
  const calculateCalories = (day: any) => {
    if (!day || !day.exercises) return 0;
    return Math.round(day.exercises.reduce((acc: number, ex: any) => {
        // Fallback to 20kg if weight is text ("Moderate")
        const safeWeight = parseInt(ex.weight) || 20; 
        const factor = safeWeight > 60 ? 0.15 : 0.08; 
        return acc + ((parseInt(ex.sets) * parseInt(ex.reps) * factor) + 45);
    }, 0));
  };

  const toggleDay = (index: number) => {
    const newSched = [...schedule];
    newSched[index].active = !newSched[index].active;
    setSchedule(newSched);
  };

  const updateDayConfig = (index: number, field: keyof DayConfig, value: any) => {
    const newSched = [...schedule];
    (newSched[index] as any)[field] = value;
    setSchedule(newSched);
  };

  // --- GENERATE NEW PLAN (PASSING INVENTORY) ---
  const handleGenerate = async () => {
    if (!config.bench || !config.squat || !config.deadlift) return;
    
    const activeDays = schedule.filter(d => d.active);
    if (activeDays.length === 0) {
        alert("PROTOCOL ERROR: Activate at least one training day.");
        return;
    }

    setStep(2);
    try {
      const storedUser = localStorage.getItem('w8_user');
      const realId = storedUser ? JSON.parse(storedUser).id || JSON.parse(storedUser)._id : null;

      const payload = {
          userId: realId,
          stats: { ...config },
          schedule: activeDays,
          inventory: GYM_INVENTORY // <--- CRITICAL: Sending your exact equipment
      };

      const res = await fetch('http://localhost:5000/api/ai/generate-weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation Failed");

      setWeeklyPlan(data.plan);
      setStep(3);
    } catch (error: any) {
      console.error(error);
      setStep(1);
      alert("MISSION ABORTED: " + error.message);
    }
  };

  const fetchDemo = async (exerciseName: string) => {
    setShowVideoModal(true);
    setVideoLoading(true);
    setCurrentExerciseName(exerciseName);
    setVideoId(null);
    setErrorMsg("");

    try {
        let cleanName = exerciseName.replace(/\(.*\)/, '').replace(/[^a-zA-Z ]/g, "").trim();
        const res = await fetch(`http://localhost:5000/api/proxy/video?q=${encodeURIComponent(cleanName)}`);
        const data = await res.json();
        
        if (res.ok && data.videoId) setVideoId(data.videoId);
        else setErrorMsg("VIDEO NOT FOUND");
    } catch (error) { setErrorMsg("CONNECTION ERROR"); } 
    finally { setVideoLoading(false); }
  };

  const toggleEdit = async (dayIndex: number) => {
    if (editingDay === dayIndex) {
       setSaving(true);
       try {
           await fetch('http://localhost:5000/api/ai/update-plan', {
               method: 'PUT',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ planId: weeklyPlan._id, updatedDays: weeklyPlan.days })
           });
           setEditingDay(null);
       } catch (err) { alert("SAVE FAILED"); } finally { setSaving(false); }
    } else { setEditingDay(dayIndex); }
  };

  const updateExercise = (dayIndex: number, exIndex: number, field: string, value: any) => {
     const newPlan = { ...weeklyPlan };
     newPlan.days[dayIndex].exercises[exIndex][field] = value;
     setWeeklyPlan(newPlan);
  };

  const handleDownloadPDF = () => {
    if (!weeklyPlan) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("W8 TACTICAL // WEEKLY PROTOCOL", 14, 20);
    
    let yPos = 45;
    weeklyPlan.days.forEach((day: any) => {
      const workoutBurn = calculateCalories(day);
      doc.setFillColor(214, 0, 0); 
      doc.setTextColor(255, 255, 255); 
      doc.setFontSize(12);
      doc.rect(14, yPos, 182, 8, 'F');
      doc.text(`${new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()} - ${day.focus}`, 16, yPos + 6);
      
      const tableData = day.exercises.map((ex: any) => {
          const loadInfo = getPlateMath(ex.name, ex.weight); 
          return [ex.name, `${ex.sets} x ${ex.reps}`, `${ex.weight} kg\n(${loadInfo})`, ex.notes];
      });

      autoTable(doc, { 
          startY: yPos + 10, 
          head: [['Exercise', 'Sets', 'Load / Config', 'Cue']], 
          body: tableData, 
          theme: 'grid',
          headStyles: { fillColor: [40, 40, 40] },
      });
      
      const finalY = (doc as any).lastAutoTable.finalY;
      doc.setFontSize(10); 
      doc.setTextColor(214, 0, 0); 
      doc.text(`WORKOUT BURN: ~${workoutBurn} KCAL`, 14, finalY + 8);
      doc.setTextColor(0, 0, 0);
      
      yPos = finalY + 18;
      if (yPos > 250) { doc.addPage(); yPos = 20; }
    });
    doc.save('W8-Mission-Protocol.pdf');
  };

  return (
    <div className="p-6 pt-10 min-h-screen max-w-md mx-auto relative pb-40">
      
      <header className="mb-8">
        <div className="flex items-center gap-2 text-w8-red text-[10px] font-mono uppercase tracking-widest mb-1">
          <Crosshair size={12} /><span>Tactical Architect v5.2</span>
        </div>
        <h1 className="text-3xl font-black italic uppercase text-white leading-none">Weekly <span className="text-gray-600">Cycle</span></h1>
      </header>

      <AnimatePresence>
        {showVideoModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" onClick={() => setShowVideoModal(false)}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-black border border-white/20 p-2 rounded-2xl w-full max-w-sm relative shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setShowVideoModal(false)} className="absolute top-4 right-4 z-10 bg-black/50 p-2 rounded-full text-white"><X size={20} /></button>
                    <div className="aspect-video bg-black flex items-center justify-center relative rounded-xl overflow-hidden">
                        {videoLoading ? (<div className="text-center"><Loader size={40} className="text-w8-red animate-spin mx-auto mb-2" /><p className="text-white text-[10px] font-bold uppercase tracking-widest">Acquiring Visuals...</p></div>) 
                        : videoId ? (<iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`} title="Exercise Demo" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full"></iframe>) 
                        : (<div className="text-center p-6 w-full"><Youtube size={40} className="text-gray-600 mx-auto mb-2" /><p className="text-gray-500 text-xs font-bold uppercase mb-4">Video Unavailable</p></div>)}
                    </div>
                    <div className="p-4 text-center"><h3 className="text-white font-black uppercase italic text-xl">{currentExerciseName}</h3></div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode='wait'>
        {step === 1 && (
          <motion.div key="config" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <section className="bg-white/5 border border-white/10 p-4 rounded-xl">
               <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><Calendar size={14} className="text-w8-red"/> Mission Parameters</h3>
               <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={config.startDate} onChange={(e) => setConfig({...config, startDate: e.target.value})} className="bg-black border border-white/20 p-2 rounded text-white text-xs uppercase" />
                  <select className="bg-black border border-white/20 p-2 rounded text-white text-xs uppercase" onChange={(e) => setConfig({...config, goal: e.target.value})}>
                     <option value="Hypertrophy">Hypertrophy (Size)</option>
                     <option value="Strength">Strength (Power)</option>
                     <option value="Endurance">Endurance</option>
                  </select>
               </div>
            </section>

            <section className="bg-white/5 border border-white/10 p-4 rounded-xl">
              <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><Dumbbell size={14} className="text-w8-red"/> 1-Rep Max (KG)</h3>
              <div className="grid grid-cols-3 gap-2">
                 <div className="flex flex-col"><label className="text-[10px] font-bold uppercase mb-1 text-gray-400">Bench</label><input type="number" placeholder="0" className="bg-black border border-white/20 p-2 rounded text-center text-white font-bold" onChange={(e) => setConfig({...config, bench: e.target.value})} /></div>
                 <div className="flex flex-col"><label className="text-[10px] font-bold uppercase mb-1 text-gray-400">Squat</label><input type="number" placeholder="0" className="bg-black border border-white/20 p-2 rounded text-center text-white font-bold" onChange={(e) => setConfig({...config, squat: e.target.value})} /></div>
                 <div className="flex flex-col"><label className="text-[10px] font-bold uppercase mb-1 text-gray-400">Deadlift</label><input type="number" placeholder="0" className="bg-black border border-white/20 p-2 rounded text-center text-white font-bold" onChange={(e) => setConfig({...config, deadlift: e.target.value})} /></div>
              </div>
            </section>

            <section className="bg-white/5 border border-white/10 p-4 rounded-xl">
              <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><Settings size={14} className="text-w8-red"/> Weekly Schedule</h3>
              <div className="space-y-2">
                {schedule.map((day, idx) => (
                    <div key={day.id} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${day.active ? 'bg-white/5 border-white/20' : 'opacity-50 border-transparent'}`}>
                        <button onClick={() => toggleDay(idx)} className={`w-10 h-10 rounded flex items-center justify-center font-black text-xs uppercase ${day.active ? 'bg-w8-red text-white' : 'bg-black text-gray-600'}`}>{day.label}</button>
                        {day.active ? (
                            <div className="flex flex-1 gap-2">
                                <div className="relative flex-1">
                                    <select className="w-full bg-black text-white text-[10px] uppercase font-bold p-2 pl-8 rounded border border-white/10 appearance-none" value={day.equipment} onChange={(e) => updateDayConfig(idx, 'equipment', e.target.value)}>
                                        <option value="Full Gym">Full Gym</option>
                                        <option value="Dumbbells">Dumbbells Only</option>
                                        <option value="Bodyweight">No Gear (Home)</option>
                                    </select>
                                    <div className="absolute left-2 top-2.5 pointer-events-none text-gray-400">{day.equipment === 'Full Gym' ? <Dumbbell size={12}/> : day.equipment === 'Bodyweight' ? <Home size={12}/> : <Dumbbell size={12}/>}</div>
                                </div>
                                <div className="relative w-20">
                                    <select className="w-full bg-black text-white text-[10px] uppercase font-bold p-2 pl-7 rounded border border-white/10 appearance-none" value={day.duration} onChange={(e) => updateDayConfig(idx, 'duration', e.target.value)}>
                                        <option value="30">30m</option><option value="45">45m</option><option value="60">60m</option><option value="90">90m</option>
                                    </select>
                                    <Clock size={12} className="absolute left-2 top-2.5 pointer-events-none text-gray-400"/>
                                </div>
                            </div>
                        ) : (<div className="flex-1 flex items-center justify-center"><span className="text-[10px] font-mono uppercase tracking-widest text-gray-600">Rest Day Protocol</span></div>)}
                    </div>
                ))}
              </div>
            </section>

            <button onClick={handleGenerate} disabled={!config.bench} className="w-full bg-w8-red py-5 rounded-sm font-black uppercase tracking-[0.2em] text-white hover:bg-red-700 shadow-[0_0_20px_rgba(214,0,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all">Initialize Protocol</button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-96 flex flex-col items-center justify-center">
            <div className="w-20 h-20 border-4 border-w8-red border-t-transparent rounded-full animate-spin mb-8"></div>
            <p className="text-w8-red font-mono text-sm animate-pulse uppercase tracking-widest">ANALYZING INVENTORY...</p>
            <p className="text-gray-500 text-[10px] mt-2 font-mono">BUILDING FROM AVAILABLE ASSETS</p>
          </motion.div>
        )}

        {step === 3 && weeklyPlan && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
               {weeklyPlan.days.map((day: any, index: number) => (
                  <button key={index} onClick={() => setActiveDayIndex(index)} className={`flex-shrink-0 px-5 py-3 rounded-lg border flex flex-col items-center min-w-[80px] transition-all ${activeDayIndex === index ? 'bg-w8-red border-w8-red text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                     <span className="text-[10px] font-bold uppercase">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                     <span className="text-lg font-black">{new Date(day.date).getDate()}</span>
                  </button>
               ))}
            </div>

            <div className="bg-white/5 border border-white/10 p-5 rounded-xl mb-6 relative overflow-hidden">
               <div className="flex justify-between items-start mb-6">
                  <div>
                     <h2 className="text-2xl font-black italic uppercase text-white">{new Date(weeklyPlan.days[activeDayIndex].date).toLocaleDateString('en-US', { weekday: 'long' })}</h2>
                     <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-w8-red font-mono tracking-widest uppercase">{weeklyPlan.days[activeDayIndex].focus}</p>
                        <div className="flex items-center gap-2 bg-red-900/30 px-3 py-1 rounded border border-red-900/50">
                            <Flame size={12} className="text-w8-red" />
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-white font-mono font-bold">{calculateCalories(weeklyPlan.days[activeDayIndex])} KCAL <span className="text-gray-500 font-normal">(GYM)</span></span>
                                {dailyTDEE && (<><div className="w-[1px] h-3 bg-red-800"></div><span className="text-[10px] text-white font-mono font-bold">{dailyTDEE} KCAL <span className="text-gray-500 font-normal">(DAY)</span></span></>)}
                            </div>
                        </div>
                     </div>
                  </div>
                  <button onClick={() => toggleEdit(activeDayIndex)} className={`p-2 rounded-full border transition-all ${editingDay === activeDayIndex ? 'bg-green-500 border-green-500 text-black' : 'border-white/20 text-gray-400'}`}>{saving ? <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full"/> : (editingDay === activeDayIndex ? <Lock size={16} /> : <Edit3 size={16} />)}</button>
               </div>

               <div className="space-y-4">
                  {weeklyPlan.days[activeDayIndex].exercises.map((ex: any, i: number) => (
                     <div key={i} className="bg-black/40 p-4 rounded-lg border border-white/5 flex flex-col gap-2 relative">
                        <div className="flex justify-between items-center pr-8"> 
                           {editingDay === activeDayIndex ? (<input className="bg-transparent border-b border-gray-600 text-white font-bold uppercase italic w-full focus:outline-none focus:border-w8-red" value={ex.name} onChange={(e) => updateExercise(activeDayIndex, i, 'name', e.target.value)} />) : (<h4 className="font-bold text-white uppercase italic text-sm">{ex.name}</h4>)}
                        </div>
                        <button onClick={() => fetchDemo(ex.name)} className="absolute top-4 right-4 text-gray-500 hover:text-w8-red transition-colors"><PlayCircle size={20} /></button>
                        
                        <div className="flex justify-between items-start mt-1">
                           <div className="flex flex-col gap-1">
                               <span className="text-xs text-gray-400 font-mono">{ex.sets} Sets x {ex.reps}</span>
                               
                               {/* --- PLATE INTELLIGENCE (SHOWS EXACT LOAD) --- */}
                               <div className="flex items-center gap-1.5 mt-1 bg-white/5 px-2 py-1 rounded border border-white/10 w-fit">
                                   <Disc size={10} className="text-w8-red"/>
                                   <span className="text-[9px] font-mono font-bold text-gray-300 uppercase">
                                       {editingDay === activeDayIndex ? "CALCULATING..." : getPlateMath(ex.name, ex.weight)}
                                   </span>
                               </div>
                           </div>

                           <div className="flex items-center gap-2">
                               <span className="text-[10px] text-gray-500 uppercase">LOAD:</span>
                               {editingDay === activeDayIndex ? (
                                   <input type="text" className="bg-white/10 w-24 p-1 rounded text-center text-white text-xs font-bold" value={ex.weight} onChange={(e) => updateExercise(activeDayIndex, i, 'weight', e.target.value)} />
                               ) : (
                                   <span className="text-w8-red font-black text-lg">
                                       {/* Display weight cleanly */}
                                       {isNaN(parseInt(ex.weight)) ? "" : ex.weight + " KG"}
                                       {/* If it's text, displayed by logic above, or handle here if preferred */}
                                       {isNaN(parseInt(ex.weight)) ? <span className="text-xs text-white">{ex.weight}</span> : ""}
                                   </span>
                               )}
                           </div>
                        </div>
                        <p className="text-[9px] text-gray-600 uppercase tracking-wide mt-1 border-t border-white/5 pt-2">{ex.notes}</p>
                     </div>
                  ))}
               </div>
            </div>

            <div className="flex gap-3">
               <button onClick={() => setStep(1)} className="flex-1 bg-white/5 py-4 font-bold text-xs uppercase tracking-widest text-gray-400 hover:text-white border border-white/10 rounded-md">Reset</button>
               <button onClick={handleDownloadPDF} className="flex-[2] bg-white text-black py-4 font-black text-xs uppercase tracking-widest hover:bg-gray-200 rounded-md flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"><FileText size={16} /> Download PDF Protocol</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}