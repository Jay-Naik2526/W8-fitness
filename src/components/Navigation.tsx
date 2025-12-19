import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, Utensils, User, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'HQ', icon: LayoutDashboard },
    { path: '/build', label: 'BUILD', icon: Dumbbell },
    { path: '/fuel', label: 'FUEL', icon: Utensils },
    { path: '/report', label: 'INTEL', icon: Activity },
    { path: '/id', label: 'ID', icon: User },
  ];

  return (
    // GLASS CONTAINER (Fixed at bottom)
    <div className="fixed bottom-0 left-0 w-full z-50 px-4 pb-6 pt-2 pointer-events-none">
      <div className="max-w-md mx-auto relative pointer-events-auto">
        
        {/* The Glass Bar Background */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl"></div>

        <div className="relative flex justify-between items-center px-6 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link 
                to={item.path} 
                key={item.path}
                className="relative flex flex-col items-center justify-center w-10 h-10 group"
              >
                {/* Active Glow Behind Icon */}
                {isActive && (
                  <motion.div 
                    layoutId="glass-glow"
                    className="absolute inset-0 bg-red-600/20 blur-lg rounded-full"
                    transition={{ duration: 0.3 }}
                  />
                )}

                {/* Icon */}
                <Icon 
                  size={20} 
                  className={`transition-all duration-300 relative z-10
                    ${isActive ? 'text-red-600 drop-shadow-[0_0_8px_rgba(214,0,0,0.8)] scale-110' : 'text-gray-500 group-hover:text-white'}`} 
                />
                
                {/* Label (Only shows when active) */}
                {isActive && (
                    <motion.span 
                        initial={{ opacity: 0, y: 5 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-5 text-[8px] font-black uppercase tracking-widest text-red-600"
                    >
                        {item.label}
                    </motion.span>
                )}

                {/* Tiny Active Dot */}
                {isActive && (
                  <motion.div 
                    layoutId="glass-dot"
                    className="absolute -bottom-2 w-1 h-1 bg-red-600 rounded-full shadow-[0_0_5px_#D60000]"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}