import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Dumbbell, Utensils, Save, FileText, Check, Loader, Plus, Trash2, X } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function TrainerClientManager() {
  const { clientId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'WORKOUT' | 'DIET'>('WORKOUT');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5000/api/trainer/protocols/${clientId}`)
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); });
  }, [clientId]);

  // --- SAVE HANDLERS ---
  const handleSaveWorkout = async () => {
      setSaving(true);
      await fetch('http://localhost:5000/api/trainer/update-workout', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: data.workout._id, days: data.workout.days })
      });
      setSaving(false);
      alert("WORKOUT PROTOCOL UPDATED");
  };

  const handleSaveDiet = async () => {
      setSaving(true);
      await fetch('http://localhost:5000/api/trainer/update-diet', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: data.diet._id, week: data.diet.week })
      });
      setSaving(false);
      alert("RATION PLAN UPDATED");
  };

  // --- WORKOUT MANIPULATION ---
  const updateExercise = (dayIdx: number, exIdx: number, field: string, val: string) => {
      const newData = { ...data };
      newData.workout.days[dayIdx].exercises[exIdx][field] = val;
      setData(newData);
  };

  const addExercise = (dayIdx: number) => {
      const newData = { ...data };
      newData.workout.days[dayIdx].exercises.push({
          name: "New Operation", sets: "3", reps: "10", weight: "0", notes: "Focus"
      });
      setData(newData);
  };

  const removeExercise = (dayIdx: number, exIdx: number) => {
      if(!window.confirm("Abort this exercise?")) return;
      const newData = { ...data };
      newData.workout.days[dayIdx].exercises.splice(exIdx, 1);
      setData(newData);
  };

  // --- DIET MANIPULATION ---
  const updateMeal = (dayIdx: number, mealIdx: number, field: string, val: string) => {
      const newData = { ...data };
      newData.diet.week[dayIdx].meals[mealIdx][field] = val;
      setData(newData);
  };

  const addMeal = (dayIdx: number) => {
      const newData = { ...data };
      newData.diet.week[dayIdx].meals.push({
          time: "00:00", name: "New Meal", calories: 0, ingredients: "-"
      });
      setData(newData);
  };

  const removeMeal = (dayIdx: number, mealIdx: number) => {
      if(!window.confirm("Remove this meal?")) return;
      const newData = { ...data };
      newData.diet.week[dayIdx].meals.splice(mealIdx, 1);
      setData(newData);
  };

  // --- PDF GENERATORS ---
  const downloadWorkoutPDF = () => {
      const doc = new jsPDF();
      doc.text(`TACTICAL WORKOUT: ${data.client.name.toUpperCase()}`, 14, 20);
      let y = 30;
      data.workout.days.forEach((day: any) => {
          doc.setFontSize(12);
          doc.text(`${new Date(day.date).toDateString()} // ${day.focus}`, 14, y);
          const rows = day.exercises.map((ex: any) => [ex.name, ex.sets, ex.reps, ex.weight]);
          autoTable(doc, { startY: y + 5, head: [['Exercise', 'Sets', 'Reps', 'Load']], body: rows });
          y = (doc as any).lastAutoTable.finalY + 15;
      });
      doc.save(`${data.client.name}_Workout.pdf`);
  };

  const downloadDietPDF = () => {
      const doc = new jsPDF();
      doc.text(`RATION PLAN: ${data.client.name.toUpperCase()}`, 14, 20);
      let y = 30;
      data.diet.week.forEach((day: any) => {
          doc.setFontSize(12);
          doc.text(`${day.day}`, 14, y);
          const rows = day.meals.map((m: any) => [m.time, m.name, m.calories]);
          autoTable(doc, { startY: y + 5, head: [['Time', 'Meal', 'Kcal']], body: rows });
          y = (doc as any).lastAutoTable.finalY + 15;
      });
      doc.save(`${data.client.name}_Diet.pdf`);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">ACCESSING SECURE FILES...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 relative">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
              <Link to="/trainer" className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-mono uppercase tracking-widest mb-2 transition-colors"><ArrowLeft size={14}/> Back to Squad</Link>
              <h1 className="text-3xl font-black italic uppercase">{data.client.name} <span className="text-gray-600">Protocol</span></h1>
          </div>
          
          <div className="flex gap-2">
              <button onClick={() => setActiveTab('WORKOUT')} className={`px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'WORKOUT' ? 'bg-w8-red text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>
                  <Dumbbell size={16}/> Workout
              </button>
              <button onClick={() => setActiveTab('DIET')} className={`px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'DIET' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>
                  <Utensils size={16}/> Ration
              </button>
          </div>
      </header>

      {/* --- WORKOUT EDITOR --- */}
      {activeTab === 'WORKOUT' && data.workout && (
          <div className="space-y-6 pb-20">
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                  <span className="text-xs font-mono text-gray-400">STATUS: {data.workout.isActive ? 'ACTIVE' : 'ARCHIVED'}</span>
                  <div className="flex gap-2">
                      <button onClick={downloadWorkoutPDF} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-xs font-bold uppercase flex items-center gap-2 transition-colors"><FileText size={14}/> PDF</button>
                      <button onClick={handleSaveWorkout} disabled={saving} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded text-xs font-bold uppercase flex items-center gap-2 transition-colors">
                          {saving ? <Loader size={14} className="animate-spin"/> : <Save size={14}/>} Save Changes
                      </button>
                  </div>
              </div>

              {data.workout.days.map((day: any, dIdx: number) => (
                  <div key={dIdx} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                      <div className="bg-white/5 p-4 border-b border-white/5 flex justify-between items-center">
                          <h3 className="font-black text-lg uppercase italic text-gray-300">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })} <span className="text-w8-red">// {day.focus}</span></h3>
                      </div>
                      <div className="p-4 space-y-4">
                          {day.exercises.map((ex: any, exIdx: number) => (
                              <div key={exIdx} className="relative grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-black/40 p-4 rounded border border-white/5 group">
                                  
                                  {/* REMOVE BUTTON */}
                                  <button 
                                    onClick={() => removeExercise(dIdx, exIdx)}
                                    className="absolute -top-2 -right-2 bg-red-900/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  >
                                    <X size={12}/>
                                  </button>

                                  <div className="md:col-span-4">
                                      <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Exercise</label>
                                      <input className="w-full bg-transparent text-white font-bold border-b border-white/10 focus:border-w8-red outline-none pb-1" value={ex.name} onChange={(e) => updateExercise(dIdx, exIdx, 'name', e.target.value)} />
                                  </div>
                                  <div className="md:col-span-2">
                                      <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Sets</label>
                                      <input className="w-full bg-transparent text-white font-mono border-b border-white/10 focus:border-w8-red outline-none pb-1" value={ex.sets} onChange={(e) => updateExercise(dIdx, exIdx, 'sets', e.target.value)} />
                                  </div>
                                  <div className="md:col-span-2">
                                      <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Reps</label>
                                      <input className="w-full bg-transparent text-white font-mono border-b border-white/10 focus:border-w8-red outline-none pb-1" value={ex.reps} onChange={(e) => updateExercise(dIdx, exIdx, 'reps', e.target.value)} />
                                  </div>
                                  <div className="md:col-span-2">
                                      <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Load</label>
                                      <input className="w-full bg-transparent text-w8-red font-black border-b border-white/10 focus:border-w8-red outline-none pb-1" value={ex.weight} onChange={(e) => updateExercise(dIdx, exIdx, 'weight', e.target.value)} />
                                  </div>
                                  <div className="md:col-span-2">
                                      <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Notes</label>
                                      <input className="w-full bg-transparent text-gray-400 text-xs border-b border-white/10 focus:border-w8-red outline-none pb-1" value={ex.notes} onChange={(e) => updateExercise(dIdx, exIdx, 'notes', e.target.value)} />
                                  </div>
                              </div>
                          ))}
                          
                          {/* ADD BUTTON */}
                          <button onClick={() => addExercise(dIdx)} className="w-full py-3 border border-dashed border-white/10 rounded-lg text-gray-500 hover:text-white hover:border-white/30 text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all">
                              <Plus size={14}/> Add Operation
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* --- DIET EDITOR --- */}
      {activeTab === 'DIET' && data.diet && (
          <div className="space-y-6 pb-20">
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                  <span className="text-xs font-mono text-gray-400">CALORIE TARGET: {data.diet.meta.dailyCalories} KCAL</span>
                  <div className="flex gap-2">
                      <button onClick={downloadDietPDF} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-xs font-bold uppercase flex items-center gap-2 transition-colors"><FileText size={14}/> PDF</button>
                      <button onClick={handleSaveDiet} disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold uppercase flex items-center gap-2 transition-colors">
                          {saving ? <Loader size={14} className="animate-spin"/> : <Save size={14}/>} Save Changes
                      </button>
                  </div>
              </div>

              {data.diet.week.map((day: any, dIdx: number) => (
                  <div key={dIdx} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                      <div className="bg-white/5 p-4 border-b border-white/5">
                          <h3 className="font-black text-lg uppercase italic text-gray-300">{day.day}</h3>
                      </div>
                      <div className="p-4 space-y-4">
                          {day.meals.map((meal: any, mIdx: number) => (
                              <div key={mIdx} className="relative grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-black/40 p-4 rounded border border-white/5 group">
                                  
                                  {/* REMOVE MEAL */}
                                  <button 
                                    onClick={() => removeMeal(dIdx, mIdx)}
                                    className="absolute -top-2 -right-2 bg-red-900/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  >
                                    <X size={12}/>
                                  </button>

                                  <div className="md:col-span-2">
                                      <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Time</label>
                                      <input className="w-full bg-transparent text-blue-400 font-bold border-b border-white/10 focus:border-blue-500 outline-none pb-1" value={meal.time} onChange={(e) => updateMeal(dIdx, mIdx, 'time', e.target.value)} />
                                  </div>
                                  <div className="md:col-span-6">
                                      <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Meal Item</label>
                                      <input className="w-full bg-transparent text-white font-bold border-b border-white/10 focus:border-blue-500 outline-none pb-1" value={meal.name} onChange={(e) => updateMeal(dIdx, mIdx, 'name', e.target.value)} />
                                  </div>
                                  <div className="md:col-span-2">
                                      <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Calories</label>
                                      <input className="w-full bg-transparent text-gray-300 font-mono border-b border-white/10 focus:border-blue-500 outline-none pb-1" value={meal.calories} onChange={(e) => updateMeal(dIdx, mIdx, 'calories', e.target.value)} />
                                  </div>
                                  <div className="md:col-span-2">
                                      <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Ingredients</label>
                                      <input className="w-full bg-transparent text-gray-500 text-xs border-b border-white/10 focus:border-blue-500 outline-none pb-1" value={meal.ingredients || ''} onChange={(e) => updateMeal(dIdx, mIdx, 'ingredients', e.target.value)} />
                                  </div>
                              </div>
                          ))}

                          {/* ADD MEAL */}
                          <button onClick={() => addMeal(dIdx)} className="w-full py-3 border border-dashed border-white/10 rounded-lg text-gray-500 hover:text-white hover:border-white/30 text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all">
                              <Plus size={14}/> Add Fuel
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {(!data.workout && activeTab === 'WORKOUT') && <div className="text-center p-20 text-gray-500 font-mono">NO WORKOUT DATA FOUND</div>}
      {(!data.diet && activeTab === 'DIET') && <div className="text-center p-20 text-gray-500 font-mono">NO RATION PLAN FOUND</div>}

    </div>
  );
}