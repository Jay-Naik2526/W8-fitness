import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Activity, Brain, Utensils, User } from "lucide-react";

export default function ClientLayout() {
  return (
    <div className="bg-black min-h-screen text-white font-sans selection:bg-w8-red pb-28 relative overflow-hidden">
      
      {/* --- GLOBAL VISUALS --- */}
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] z-0" />
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* --- CONTENT AREA --- */}
      <div className="relative z-10">
        <Outlet />
      </div>

      {/* --- TACTICAL DOCK (4-Tab Layout) --- */}
      <nav className="fixed bottom-0 left-0 w-full z-50 px-6 pb-8 pt-2">
        <div className="max-w-md mx-auto bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl flex justify-around items-center h-20 shadow-2xl relative">
          
          <NavItem to="/dashboard" icon={Activity} label="HQ" />
          <NavItem to="/architect" icon={Brain} label="BUILD" />
          
          {/* Vertical Divider */}
          <div className="w-[1px] h-8 bg-white/10"></div>

          <NavItem to="/fuel" icon={Utensils} label="FUEL" />
          <NavItem to="/profile" icon={User} label="ID" />
          
        </div>
      </nav>
    </div>
  );
}

// Helper for Navigation Links
function NavItem({ to, icon: Icon, label }: any) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex flex-col items-center gap-1.5 transition-all duration-300 relative w-12 ${isActive ? 'text-white scale-110' : 'text-gray-600 hover:text-gray-400'}`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
          <span className="text-[9px] font-black tracking-widest uppercase">{label}</span>
          {isActive && <span className="absolute -bottom-3 w-1 h-1 bg-w8-red rounded-full shadow-[0_0_8px_#D60000]"></span>}
        </>
      )}
    </NavLink>
  );
}