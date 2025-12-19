import React, { useEffect, useState } from 'react';
import { CreditCard, Trash2, Plus, RefreshCw, ArrowLeft } from "lucide-react";
import { Link } from 'react-router-dom';

export default function AdminMembership() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newPlan, setNewPlan] = useState({ title: '', category: 'GYM', duration: '', price: 0, features: '' });

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
      const res = await fetch('https://w8-fitness-backend-api.onrender.com/api/admin/plans');
      if (res.ok) setPlans(await res.json());
  };

  const handleSeed = async () => {
      if(!window.confirm("Reset all prices to Default?")) return;
      await fetch('https://w8-fitness-backend-api.onrender.com/api/admin/seed-plans', { method: 'POST' });
      fetchPlans();
  };

  const handleDelete = async (id: string) => {
      if(!window.confirm("Remove this plan?")) return;
      await fetch(`https://w8-fitness-backend-api.onrender.com/api/admin/delete-plan/${id}`, { method: 'DELETE' });
      fetchPlans();
  };

  const handleAdd = async () => {
      const featuresArray = newPlan.features.split(',').map(s => s.trim());
      await fetch('https://w8-fitness-backend-api.onrender.com/api/admin/add-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newPlan, features: featuresArray })
      });
      setIsAdding(false);
      fetchPlans();
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 md:pl-24">
      
      {/* HEADER */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
         <div>
            {/* FIX: Link points to /admin/dashboard */}
            <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-mono uppercase tracking-widest mb-4 transition-colors">
                <ArrowLeft size={14} /> Back to HQ
            </Link>
            <div className="flex items-center gap-2 text-yellow-500 text-xs font-mono uppercase tracking-widest mb-1"><CreditCard size={14} /> Finance</div>
            <h1 className="text-3xl md:text-4xl font-black italic uppercase">Membership <span className="text-gray-600">Matrix</span></h1>
         </div>
         <div className="flex gap-2 w-full md:w-auto">
             <button onClick={handleSeed} className="flex-1 md:flex-initial bg-white/5 hover:bg-white/10 text-xs font-bold uppercase px-4 py-3 rounded flex items-center justify-center gap-2 transition-colors"><RefreshCw size={14}/> Reset</button>
             <button onClick={() => setIsAdding(true)} className="flex-1 md:flex-initial bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-bold uppercase px-4 py-3 rounded flex items-center justify-center gap-2 transition-colors"><Plus size={14}/> Add Plan</button>
         </div>
      </header>

      {/* PLANS GRID (RESPONSIVE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         {plans.map((plan) => (
             <div key={plan._id} className="bg-white/5 border border-white/10 p-5 rounded-xl relative group hover:border-yellow-500/50 transition-colors">
                 <button onClick={() => handleDelete(plan._id)} className="absolute top-3 right-3 text-gray-600 hover:text-red-500"><Trash2 size={16}/></button>
                 <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded mb-2 inline-block ${plan.category === 'PRO' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/10 text-gray-400'}`}>{plan.category}</span>
                 <h3 className="text-xl font-black italic uppercase">{plan.title}</h3>
                 <p className="text-xs text-gray-500 font-mono mb-3">{plan.duration}</p>
                 <div className="text-2xl font-bold text-yellow-500">₹{plan.price}</div>
                 <div className="mt-4 space-y-1">
                    {plan.features.map((f: string, i: number) => <p key={i} className="text-[10px] text-gray-400">• {f}</p>)}
                 </div>
             </div>
         ))}
      </div>

      {/* ADD MODAL (FULL SCREEN ON MOBILE) */}
      {isAdding && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-0 md:p-4 z-50">
              <div className="bg-black border border-white/20 p-6 md:rounded-xl w-full h-full md:h-auto md:max-w-md overflow-y-auto">
                  <h3 className="text-xl font-black uppercase mb-4">New Protocol</h3>
                  <div className="space-y-3">
                      <input placeholder="Plan Title" className="w-full bg-white/5 p-3 rounded text-sm text-white outline-none" onChange={e => setNewPlan({...newPlan, title: e.target.value})} />
                      <div className="grid grid-cols-2 gap-3">
                          <select className="bg-white/5 p-3 rounded text-sm text-white outline-none" onChange={e => setNewPlan({...newPlan, category: e.target.value})}>
                              <option value="GYM">Gym Floor</option><option value="PT">Personal Training</option><option value="PRO">PRO VIP</option><option value="PILATES">Pilates</option>
                          </select>
                          <input type="number" placeholder="Price (₹)" className="bg-white/5 p-3 rounded text-sm text-white outline-none" onChange={e => setNewPlan({...newPlan, price: Number(e.target.value)})} />
                      </div>
                      <input placeholder="Duration (e.g. 1 Month)" className="w-full bg-white/5 p-3 rounded text-sm text-white outline-none" onChange={e => setNewPlan({...newPlan, duration: e.target.value})} />
                      <textarea placeholder="Features (comma separated)" className="w-full bg-white/5 p-3 rounded text-sm text-white outline-none h-20" onChange={e => setNewPlan({...newPlan, features: e.target.value})} />
                      <button onClick={handleAdd} className="w-full bg-yellow-500 text-black py-3 font-bold uppercase rounded">Confirm</button>
                      <button onClick={() => setIsAdding(false)} className="w-full py-2 text-xs text-gray-500 uppercase">Cancel</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}