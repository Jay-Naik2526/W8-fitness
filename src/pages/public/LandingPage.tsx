import React, { useState, useRef, useEffect } from 'react';
import { Dumbbell, Zap, Coffee, ChevronRight, Activity, ShieldAlert, Brain, Utensils, MapPin, Instagram, Phone, ArrowRight, User, Clock, Users, ScanBarcode, Lock, Unlock, Facebook } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from 'react-router-dom';

// --- SUB-COMPONENT: SYSTEM BOOT LOADER ---
function SystemBoot({ onComplete }: { onComplete: () => void }) {
  const [text, setText] = useState<string[]>([]);
  
  useEffect(() => {
    const sequence = [
      "INITIALIZING W8_KERNEL...",
      "LOADING ASSETS...",
      "OPTIMIZING VIEWPORT...",
      "ESTABLISHING CONNECTION...",
      "SYSTEM CHECK: OPTIMAL",
      "WELCOME."
    ];

    let delay = 0;
    sequence.forEach((line, index) => {
      delay += Math.random() * 200 + 100; 
      setTimeout(() => {
        setText(prev => [...prev, line]);
        const terminal = document.getElementById('terminal-content');
        if (terminal) terminal.scrollTop = terminal.scrollHeight;
      }, delay);
    });

    setTimeout(onComplete, delay + 800);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center font-mono text-xs md:text-sm p-4 text-green-500">
      <div className="w-full max-w-md border border-white/10 p-6 bg-black">
        <div className="flex justify-between border-b border-w8-red/50 pb-2 mb-4 text-w8-red uppercase tracking-widest">
           <span>System Boot v2.4</span>
           <span className="animate-pulse">///</span>
        </div>
        <div id="terminal-content" className="h-48 overflow-y-auto space-y-2 text-gray-400">
           {text.map((line, i) => (
             <div key={i} className="flex gap-2">
               <span className="text-w8-red">{'>'}</span>
               <span className={i === text.length - 1 ? "text-white" : ""}>{line}</span>
             </div>
           ))}
           <div className="animate-pulse text-w8-red">_</div>
        </div>
      </div>
    </div>
  );
}

// --- DATA: SLICES (Video Cards) ---
const slices = [
  {
    id: 'arena',
    title: 'THE ARENA',
    subtitle: '4th Floor // Main Gym',
    description: 'The heartbeat of Navsari fitness. Hammer Strength certified equipment.',
    video: '/videos/arena.mp4', 
    icon: Dumbbell,
    videoPosition: 'object-center'
  },
  {
    id: 'system',
    title: 'THE SYSTEM',
    subtitle: 'AI Ecosystem // The App',
    description: 'We don\'t guess. Our Inventory-Aware App scans machines and tracks your sets.',
    video: '/videos/tech.mp4',
    icon: Zap,
    videoPosition: 'object-top'
  },
  {
    id: 'lifestyle',
    title: 'THE LIFESTYLE',
    subtitle: 'VIP & Recovery // Fuel',
    description: 'Steam rooms. Private VIP floor. In-house coffee bar for post-workout fuel.',
    video: '/videos/vip.mp4', 
    icon: Coffee,
    videoPosition: 'object-center'
  }
];

const features = [
  { title: "Goal Architect", subtitle: "WORKOUT GEN", desc: "Select your goal. The AI scans inventory and builds a path to failure.", icon: Brain, status: "ACTIVE" },
  { title: "Adaptive Fuel", subtitle: "SMART DIET", desc: "Diet plans that adjust daily based on your metabolic rate.", icon: Utensils, status: "SYNCED" },
  { title: "Crowd Meter", subtitle: "LIVE TRAFFIC", desc: "Check the live floor heatmap before you even tie your shoes.", icon: Activity, status: "LIVE" },
  { title: "Injury Guard", subtitle: "SAFE MODE", desc: "Toggle 'Injury Mode' to auto-swap dangerous moves for safe ones.", icon: ShieldAlert, status: "STANDBY" }
];

// --- MAIN COMPONENT ---
export default function LandingPage() {
  const [activeSlice, setActiveSlice] = useState('arena');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // DYNAMIC DATA STATES
  const [maleTrainers, setMaleTrainers] = useState<any[]>([]);
  const [femaleTrainers, setFemaleTrainers] = useState<any[]>([]);
  const [groupedPlans, setGroupedPlans] = useState<any[]>([]);
  
  // VAULT STATE
  const [activeVault, setActiveVault] = useState<string | null>(null);

  useEffect(() => {
     // 1. FETCH TRAINERS
     fetch('http://w8-fitness-backend-api.onrender.com/api/auth/public-trainers')
       .then(res => res.json())
       .then(data => {
           setMaleTrainers(data.filter((t: any) => t.gender === 'Male'));
           setFemaleTrainers(data.filter((t: any) => t.gender === 'Female'));
       })
       .catch(err => console.error("Roster Offline"));

     // 2. FETCH PRICING & GROUP
     fetch('http://w8-fitness-backend-api.onrender.com/api/auth/public-plans')
       .then(res => res.json())
       .then(data => {
           const categories = [
               { id: 'GYM', label: 'GYM FLOOR', plans: data.filter((p: any) => p.category === 'GYM') },
               { id: 'PT', label: 'PERSONAL TRAINING', plans: data.filter((p: any) => p.category === 'PT') },
               { id: 'PRO', label: 'PRO VIP', plans: data.filter((p: any) => p.category === 'PRO') },
               { id: 'PILATES', label: 'PILATES', plans: data.filter((p: any) => p.category === 'PILATES') }
           ];
           setGroupedPlans(categories);
       })
       .catch(err => console.error("Pricing Offline"));
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="fixed inset-0 z-[100]">
             <SystemBoot onComplete={() => setLoading(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="min-h-screen w-full bg-black font-sans selection:bg-red-600 selection:text-white relative overflow-x-hidden">
        
        {/* HEADER */}
        <div className="fixed top-0 left-0 w-full z-50 p-4 md:p-6 flex justify-between items-center pointer-events-none mix-blend-difference text-white">
          <div className="pointer-events-auto cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <h1 className="text-xl md:text-3xl font-black italic leading-none">W8<span className="text-red-600">FITNESS</span></h1>
            <p className="text-[10px] font-mono opacity-80 uppercase tracking-widest mt-1 hidden md:block">Navsari, Gujarat</p>
          </div>
          <button 
            onClick={() => navigate('/login')} 
            className="pointer-events-auto bg-red-600 text-white px-4 py-2 font-bold uppercase text-[10px] md:text-xs shadow-lg hover:bg-red-700 transition-colors"
          >
            Join Now
          </button>
        </div>

        {/* HERO SECTION */}
        <section className="h-[100dvh] w-full flex flex-col md:flex-row overflow-hidden relative border-b border-red-600/20">
          {slices.map((slice) => (
              <SliceComponent key={slice.id} slice={slice} isActive={activeSlice === slice.id} onClick={() => setActiveSlice(slice.id)} onHover={() => setActiveSlice(slice.id)} onExplore={() => scrollToSection('system')} />
          ))}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/50 animate-bounce md:hidden z-40 pointer-events-none"><span className="text-[10px] uppercase tracking-widest bg-black/50 px-2 py-1 rounded">Tap Cards</span></div>
        </section>

        {/* PHILOSOPHY */}
        <section className="py-16 md:py-24 px-4 md:px-6 bg-black text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-full bg-red-600/5 blur-[100px] pointer-events-none"></div>
          <div className="max-w-4xl mx-auto relative z-10">
            <h3 className="text-red-600 font-bold uppercase tracking-[0.2em] text-xs md:text-base mb-4 md:mb-6">Our Philosophy</h3>
            <h2 className="text-3xl md:text-6xl font-black italic text-white uppercase leading-tight mb-6 md:mb-8">Pain is a Signal.<br/>Growth is Response.</h2>
            <p className="text-gray-400 text-sm md:text-lg leading-relaxed max-w-2xl mx-auto px-4">Most gyms sell memberships. <strong className="text-white">We build systems.</strong> Our ecosystem tracks every rep, so you can't cheat the process.</p>
          </div>
        </section>

        {/* SYSTEM GRID */}
        <section id="system" className="py-16 md:py-24 px-4 md:px-6 bg-zinc-900 border-y border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 relative z-10">
              <div className="lg:sticky lg:top-32 lg:self-start text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 border border-red-600/50 bg-red-600/10 px-3 py-1 mb-4"><span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span><span className="text-red-600 font-mono text-[10px] uppercase tracking-widest">Kernel v2.4</span></div>
                  <h2 className="text-4xl md:text-7xl font-black italic text-white uppercase leading-[0.9] mb-4">Intelligence<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-white">Over Iron.</span></h2>
                  <p className="text-gray-400 text-sm md:text-lg max-w-md mx-auto lg:mx-0 leading-relaxed">The W8 Ecosystem manages your entire fitness lifecycle.</p>
              </div>
              <div className="space-y-4 md:space-y-6">
                {features.map((feat, idx) => (
                    <div key={idx} className="group bg-black border-l-4 border-white/10 hover:border-red-600 p-6 md:p-8 transition-all duration-300 relative overflow-hidden">
                      <div className="flex justify-between items-start mb-4 relative z-10"><div className="p-2 bg-white/5 rounded-sm text-red-600"><feat.icon size={20} /></div><span className="font-mono text-[10px] text-gray-600 uppercase tracking-widest border border-white/10 px-2 py-1 rounded-full">{feat.status}</span></div>
                      <div className="relative z-10"><h4 className="text-red-600 text-[10px] font-bold uppercase tracking-widest mb-1">{feat.subtitle}</h4><h3 className="text-xl md:text-2xl font-black italic text-white uppercase mb-2">{feat.title}</h3><p className="text-gray-400 text-xs md:text-sm leading-relaxed border-l border-white/10 pl-3">{feat.desc}</p></div>
                    </div>
                ))}
              </div>
          </div>
        </section>

        {/* TRAINERS */}
        <section className="py-16 md:py-24 px-4 md:px-6 bg-black relative">
          <div className="max-w-7xl mx-auto relative z-10">
              <div className="mb-12 text-center md:text-left">
                  <h3 className="text-red-600 font-bold uppercase tracking-widest mb-2 text-xs md:text-sm">The Command</h3>
                  <h2 className="text-3xl md:text-5xl font-black italic text-white uppercase">Personnel Roster</h2>
              </div>
              <div className="mb-16">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-2 h-8 bg-blue-600"></div>
                    <h3 className="text-xl font-black italic text-white uppercase tracking-wider">Male Division</h3>
                    <div className="h-[1px] bg-white/10 flex-1"></div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {maleTrainers.map((trainer, idx) => (<DossierCard key={idx} trainer={trainer} theme="blue" />))}
                 </div>
              </div>
              <div>
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-2 h-8 bg-purple-500"></div>
                    <h3 className="text-xl font-black italic text-white uppercase tracking-wider">Female Unit</h3>
                    <div className="h-[1px] bg-white/10 flex-1"></div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {femaleTrainers.map((trainer, idx) => (<DossierCard key={idx} trainer={trainer} theme="purple" />))}
                 </div>
              </div>
          </div>
        </section>

        {/* --- PRICING: THE KINETIC VAULT (MOBILE RESPONSIVE) --- */}
        <section id="pricing" className="py-16 md:py-24 px-4 md:px-6 bg-zinc-900 relative border-t border-white/5">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <h3 className="text-red-600 font-bold uppercase tracking-widest mb-2 text-xs md:text-sm">Access Control</h3>
              <h2 className="text-4xl md:text-7xl font-black italic text-white uppercase">Membership Protocols</h2>
            </div>

            {/* VAULT CONTAINER */}
            <div 
                className="flex flex-col md:flex-row h-auto md:h-[600px] w-full gap-2 transition-all duration-500"
                // On Desktop: Reset when leaving the whole container
                onMouseLeave={() => { if (window.innerWidth >= 768) setActiveVault(null); }}
            >
              {groupedPlans.length > 0 ? groupedPlans.map((group) => (
                <VaultPillar 
                    key={group.id} 
                    group={group} 
                    isActive={activeVault === group.id} 
                    onActivate={() => setActiveVault(activeVault === group.id ? null : group.id)} 
                />
              )) : (
                <div className="w-full text-center text-gray-500 font-mono text-xs py-12">CONNECTING TO VAULT DATABASE...</div>
              )}
            </div>

          </div>
        </section>

        {/* FOOTER - UPDATED */}
        <footer className="bg-black py-16 md:py-20 px-6 border-t border-white/10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12 text-center md:text-left">
            
            {/* BRAND & SOCIALS */}
            <div className="max-w-xs mx-auto md:mx-0">
              <h2 className="text-3xl font-black italic text-white mb-6">W8<span className="text-red-600">FITNESS</span></h2>
              <p className="text-gray-500 mb-8 text-sm leading-relaxed">"We didn't build a gym to make you comfortable. We built a system to make you dangerous."</p>
              
              <div className="flex gap-4 justify-center md:justify-start">
                
                {/* Instagram */}
                <a href="https://www.instagram.com/w8fitness/?hl=en" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors text-white border border-white/10">
                  <Instagram size={18} />
                </a>
                
                {/* Facebook */}
                <a href="https://www.facebook.com/w8fitness.navsari" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors text-white border border-white/10">
                  <Facebook size={18} />
                </a>

                {/* WhatsApp (API Link) */}
                <a href="https://wa.me/916356408080" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 flex items-center justify-center hover:bg-green-600 hover:text-white transition-colors text-white border border-white/10">
                  <Phone size={18} />
                </a>

              </div>
            </div>

            {/* ADDRESS & DIRECTIONS */}
            <div className="mx-auto md:mx-0">
              <h4 className="text-white font-bold uppercase tracking-widest mb-6 flex items-center gap-2 justify-center md:justify-start">
                <MapPin className="text-red-600" size={18}/> Base Location
              </h4>
              <address className="text-gray-400 not-italic space-y-2 text-sm">
                <p className="text-white font-bold text-lg">4th Floor, Central Bazzar</p>
                <p>Opp. Vidyakunj School</p>
                <p>Pratiksha Society</p>
                <p>Navsari, Gujarat 396445</p>
              </address>
              
              {/* FIXED: REAL GOOGLE MAPS LINK */}
              <a 
                href="https://www.google.com/maps/dir/?api=1&destination=W8+Fitness+Navsari+Gujarat"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 text-red-600 text-sm font-bold uppercase border-b border-red-600 pb-1 hover:text-white hover:border-white transition-colors flex items-center gap-2 mx-auto md:mx-0 inline-flex cursor-pointer"
              >
                Get Directions <ArrowRightIcon />
              </a>
            </div>

            {/* SYSTEM COLUMN REMOVED (As Requested) */}

          </div>
          <div className="border-t border-white/5 mt-16 pt-8 text-center text-gray-600 text-[10px] md:text-xs uppercase tracking-widest">© 2025 W8 Fitness. All Rights Reserved. Built by Jay Naik.</div>
        </footer>

      </main>
    </>
  );
}

// --- CONCEPT 1: KINETIC VAULT PILLAR (MOBILE OPTIMIZED) ---
function VaultPillar({ group, isActive, onActivate }: { group: any, isActive: boolean, onActivate: () => void }) {
    const isPro = group.id === 'PRO';
    const isGym = group.id === 'GYM';
    const isPT = group.id === 'PT';
    
    // COLOR MATRIX
    const theme = {
        bg: isPro ? 'bg-yellow-950/30' : (isGym ? 'bg-red-950/30' : (isPT ? 'bg-blue-950/30' : 'bg-purple-950/30')),
        border: isPro ? 'border-yellow-600' : (isGym ? 'border-red-600' : (isPT ? 'border-blue-600' : 'border-purple-600')),
        text: isPro ? 'text-yellow-500' : (isGym ? 'text-red-500' : (isPT ? 'text-blue-500' : 'text-purple-500')),
        accent: isPro ? 'bg-yellow-500' : (isGym ? 'bg-red-500' : (isPT ? 'bg-blue-500' : 'bg-purple-500')),
    };

    return (
        <motion.div 
            layout
            onClick={onActivate} // Mobile Click Trigger
            onMouseEnter={() => { if (window.innerWidth >= 768) onActivate(); }} // Desktop Hover Trigger
            className={`
                relative overflow-hidden cursor-pointer
                border border-white/10 ${theme.bg}
                flex flex-col md:flex-row
                w-full md:w-auto
                /* MOBILE: Height Animation */
                ${isActive ? 'h-auto md:h-full md:flex-[4] border-opacity-100' : 'h-[80px] md:h-full md:flex-[1] border-opacity-30'}
                transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
            `}
            style={{ borderColor: isActive ? undefined : 'rgba(255,255,255,0.1)' }}
        >
            {/* BACKGROUND GRADIENT */}
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.accent} to-transparent opacity-5 pointer-events-none`}></div>

            {/* --- COLLAPSED STATE (The "Spine") --- */}
            <div className={`
                absolute inset-0 flex flex-col md:items-center justify-center p-6 md:p-4
                transition-opacity duration-300
                ${isActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}
            `}>
                {/* Mobile: Horizontal Row */}
                <div className="flex md:hidden justify-between items-center w-full">
                    <span className={`text-xl font-black uppercase italic ${theme.text}`}>{group.label}</span>
                    <Lock size={16} className="text-gray-500" />
                </div>

                {/* Desktop: Vertical Spine */}
                <div className="hidden md:flex flex-col items-center h-full justify-between py-10">
                    <div className="h-20 w-[1px] bg-white/20"></div>
                    <span className="text-3xl font-black text-white/50 writing-vertical-rl rotate-180 tracking-widest whitespace-nowrap">
                        {group.label}
                    </span>
                    <div className="h-20 w-[1px] bg-white/20"></div>
                    <Lock size={16} className="text-gray-600 mb-4" />
                </div>
            </div>

            {/* --- EXPANDED STATE (The "Vault Interior") --- */}
            <div className={`
                relative md:absolute inset-0 p-6 md:p-8 flex flex-col
                transition-all duration-500 delay-100
                ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
            `}>
                {/* Header */}
                <div className="flex justify-between items-start mb-6 md:mb-8">
                    <div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 bg-white/5 ${theme.text} border border-white/10`}>
                            <Unlock size={10} /> SECURE ACCESS
                        </div>
                        <h3 className="text-2xl md:text-5xl font-black italic text-white uppercase leading-none">
                            {group.label}
                        </h3>
                    </div>
                    <ScanBarcode className={`opacity-50 ${theme.text} hidden md:block`} size={40} />
                </div>

                {/* Sub-Plans List */}
                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
                    {group.plans.map((plan: any) => (
                        <div key={plan._id} className="bg-black/40 border border-white/10 p-4 hover:border-white/30 transition-colors group/card">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-white uppercase text-xs md:text-sm">{plan.title}</h4>
                                <span className={`text-lg md:text-xl font-black ${theme.text}`}>₹{plan.price.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-gray-500 font-mono uppercase">{plan.duration}</p>
                                    <p className="text-[10px] text-gray-400 line-clamp-1">{plan.features.slice(0, 2).join(' • ')}</p>
                                </div>
                                <button className={`bg-white text-black text-[10px] font-bold uppercase px-3 py-2 md:opacity-0 md:group-hover/card:opacity-100 transition-opacity`}>Select</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

// --- EXISTING SUB-COMPONENTS (DossierCard, SliceComponent, etc.) ---

function DossierCard({ trainer, theme }: { trainer: any, theme: 'blue' | 'purple' }) {
  const colorClass = theme === 'blue' ? 'text-blue-500 border-blue-500/30' : 'text-purple-500 border-purple-500/30';
  const bgHoverClass = theme === 'blue' ? 'group-hover:border-blue-500' : 'group-hover:border-purple-500';
  const rankAbbr = { 'COMMANDER': 'CMD', 'ELITE': 'ELT', 'OPERATIVE': 'OPR', 'INITIATE': 'INT' }[trainer.tier as string] || 'AGT';
  
  return (
    <div className={`group relative h-[320px] bg-white/5 border border-white/10 overflow-hidden transition-all duration-500 hover:bg-black ${bgHoverClass}`}>
       <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-20"></div>
       <div className="absolute -bottom-6 -right-6 text-9xl font-black italic text-white/[0.02] select-none transition-all duration-700 group-hover:scale-110 group-hover:text-white/[0.04] z-0">{rankAbbr}</div>
       <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10">
           <div className="flex flex-col">
              <span className={`text-[9px] font-mono font-bold uppercase tracking-widest border border-dashed px-2 py-1 rounded ${colorClass}`}>{trainer.tier} CLASS</span>
              <span className="text-[10px] text-gray-500 font-mono mt-1">ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
           </div>
           <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-black"><User size={14} className="text-gray-400"/></div>
       </div>
       <div className="absolute bottom-0 left-0 w-full p-6 z-20">
           <h3 className="text-3xl font-black italic text-white uppercase leading-none mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all drop-shadow-md">{trainer.name}</h3>
           <p className={`text-xs font-bold uppercase tracking-widest mb-4 opacity-80 ${theme === 'blue' ? 'text-blue-400' : 'text-purple-400'}`}>// {trainer.goal} Specialist</p>
           <div className="h-0 overflow-hidden group-hover:h-auto transition-all duration-500">
              <div className="border-t border-white/10 pt-4 mt-2 space-y-2">
                 <div className="flex items-center gap-3 text-xs text-gray-300"><Clock size={12} className={theme === 'blue' ? 'text-blue-500' : 'text-purple-500'} /><span className="font-mono">{trainer.bio ? trainer.bio.split('•')[0] : 'Exp: Unknown'}</span></div>
                 <div className="flex items-center gap-3 text-xs text-gray-300"><Users size={12} className={theme === 'blue' ? 'text-blue-500' : 'text-purple-500'} /><span className="font-mono">{trainer.bio ? trainer.bio.split('•')[1] || 'Clients: Classified' : 'Clients: Classified'}</span></div>
              </div>
           </div>
       </div>
       <div className={`absolute top-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-700 ${theme === 'blue' ? 'bg-blue-600' : 'bg-purple-600'}`}></div>
    </div>
  );
}

const ArrowRightIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>);

function SliceComponent({ slice, isActive, onClick, onHover, onExplore }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) playPromise.catch(() => {});
    }
  }, [isActive]);

  return (
    <motion.div layout onClick={onClick} onMouseEnter={() => { if (window.innerWidth > 768) onHover(); }} className={`relative cursor-pointer overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] border-b md:border-b-0 md:border-r border-white/10 ${isActive ? 'h-[50vh] md:h-auto flex-[5] md:flex-[3] grayscale-0' : 'h-[25vh] md:h-auto flex-[1] grayscale'} w-full md:w-auto`}>
      <div className={`absolute inset-0 z-10 transition-colors duration-500 ${isActive ? 'bg-black/20' : 'bg-black/60'}`}/>
      <video ref={videoRef} src={slice.video} loop muted playsInline className={`absolute inset-0 w-full h-full object-cover ${slice.videoPosition} transition-transform duration-1000 ${isActive ? 'scale-110' : 'scale-100'}`} />
      <div className="absolute inset-0 z-20 p-4 md:p-8 flex flex-col justify-end">
        {!isActive && (<div className="h-full flex flex-col items-center justify-center md:justify-end gap-2 opacity-70"><slice.icon size={20} className="text-white drop-shadow-md md:hidden" /><slice.icon size={24} className="text-white drop-shadow-md hidden md:block" /><h2 className="text-xl md:text-5xl font-black italic text-white uppercase md:writing-vertical-rl md:rotate-180 tracking-widest drop-shadow-md">{slice.title.replace('THE ', '')}</h2></div>)}
        <AnimatePresence>
          {isActive && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} className="w-full max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-red-600/90 text-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest mb-2 shadow-lg backdrop-blur-sm"><slice.icon size={10} /><span>{slice.subtitle}</span></div>
              <h2 className="text-3xl md:text-8xl font-black italic text-white mb-2 md:mb-6 leading-none tracking-tighter drop-shadow-2xl">{slice.title}</h2>
              <p className="text-gray-100 text-xs md:text-xl font-medium mb-3 md:mb-8 max-w-md leading-relaxed drop-shadow-md line-clamp-2 md:line-clamp-none border-l-2 border-red-600 pl-2">{slice.description}</p>
              <div className="flex gap-3"><button onClick={(e) => { e.stopPropagation(); onExplore(); }} className="bg-white text-black px-4 py-2 md:px-8 md:py-4 font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 text-[10px] md:text-sm shadow-lg">{slice.id === 'system' ? 'Install' : 'Explore'}<ChevronRight size={14}/></button></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}