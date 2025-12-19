import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, ChevronRight, AlertCircle, Terminal, CheckCircle, Download, Share, PlusSquare, X } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  // --- PWA INSTALL STATE ---
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // 2. Listen for Android Install Prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    // A. Android: Trigger Native Prompt
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } 
    // B. iOS or Desktop: Show Manual Instructions
    else {
      setShowIOSHelp(true);
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const endpoint = isRegister ? 'register' : 'login';
    
    try {
      const res = await fetch(`http://localhost:5000/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || data.error || 'System Failure');
      }

      if (isRegister) {
        setSuccessMsg("ID CREATED. AWAITING ADMIN APPROVAL.");
        setIsRegister(false);
        setLoading(false);
        return;
      }

      localStorage.setItem('w8_token', data.token);
      localStorage.setItem('w8_user', JSON.stringify(data.user));

      const role = data.user.role ? data.user.role.toLowerCase() : 'client';
      
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'trainer') navigate('/trainer/dashboard');
      else navigate('/dashboard');

    } catch (err: any) {
      if (err.message.includes("PENDING")) {
        setError("ACCESS DENIED: YOUR ID IS PENDING APPROVAL.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-red-600/50 shadow-[0_0_20px_#D60000] animate-pulse"></div>

      <div className="w-full max-w-sm z-10">
        
        <div className="mb-10 text-center">
           <div className="inline-flex items-center justify-center w-16 h-16 bg-red-900/10 rounded-full mb-4 border border-red-600/30 relative">
             <Terminal size={32} className="text-red-600" />
             <div className="absolute inset-0 border border-red-600 rounded-full animate-ping opacity-20"></div>
           </div>
           <h1 className="text-2xl font-black uppercase tracking-widest text-white">
             {isRegister ? 'New Operative' : 'System Access'}
           </h1>
           <p className="text-xs text-gray-500 mt-2 tracking-wider">
             SECURE CONNECTION // ENCRYPTED
           </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isRegister && (
            <div className="bg-white/5 border border-white/10 p-3 rounded-lg flex items-center gap-3 focus-within:border-red-600 transition-colors">
              <User size={18} className="text-gray-500" />
              <input name="name" type="text" placeholder="OPERATIVE NAME" className="bg-transparent w-full outline-none text-sm uppercase placeholder:text-gray-700" onChange={handleChange} required />
            </div>
          )}

          <div className="bg-white/5 border border-white/10 p-3 rounded-lg flex items-center gap-3 focus-within:border-red-600 transition-colors">
            <Mail size={18} className="text-gray-500" />
            <input name="email" type="email" placeholder="EMAIL ID" className="bg-transparent w-full outline-none text-sm uppercase placeholder:text-gray-700" onChange={handleChange} required/>
          </div>

          <div className="bg-white/5 border border-white/10 p-3 rounded-lg flex items-center gap-3 focus-within:border-red-600 transition-colors">
            <Lock size={18} className="text-gray-500" />
            <input name="password" type="password" placeholder="ACCESS CODE" className="bg-transparent w-full outline-none text-sm placeholder:text-gray-700" onChange={handleChange} required/>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs bg-red-500/10 p-3 rounded border border-red-500/20">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 text-green-500 text-xs bg-green-500/10 p-3 rounded border border-green-500/20">
              <CheckCircle size={14} />
              <span>{successMsg}</span>
            </div>
          )}

          <button 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white p-4 rounded-sm font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? 'PROCESSING...' : (isRegister ? 'REQUEST ACCESS' : 'ENTER SYSTEM')}
            {!loading && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform"/>}
          </button>
        </form>

        {/* --- INSTALL APP BUTTON --- */}
        <div className="mt-6 flex flex-col gap-4 text-center">
            <button 
              onClick={handleInstallClick}
              className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white flex items-center justify-center gap-2 transition-colors border border-white/10 p-3 rounded hover:bg-white/5"
            >
               <Download size={14} /> Install App
            </button>

            <button 
                onClick={() => { setIsRegister(!isRegister); setError(''); setSuccessMsg(''); }}
                className="text-gray-600 text-[10px] hover:text-red-500 transition-colors"
            >
                {isRegister ? 'Back to Login' : 'Apply for Membership'}
            </button>
        </div>

      </div>

      <div className="absolute bottom-6 text-[10px] text-gray-700 uppercase tracking-widest">W8 Fitness Systems © 2025</div>

      {/* --- IOS INSTALL HELP MODAL --- */}
      {showIOSHelp && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setShowIOSHelp(false)}>
              <div className="bg-zinc-900 border-t md:border border-white/10 p-6 w-full md:max-w-sm rounded-t-2xl md:rounded-2xl pb-10 md:pb-6 relative animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowIOSHelp(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
                  <h3 className="text-lg font-black italic uppercase text-white mb-4">Install Application</h3>
                  <div className="space-y-4">
                      <div className="flex items-center gap-4 bg-black/50 p-3 rounded-lg border border-white/5">
                          <Share className="text-blue-500" size={24} />
                          <div className="text-xs text-gray-400">
                              <span className="text-white font-bold block mb-0.5">Step 1</span>
                              Tap the <span className="text-blue-400">Share Button</span> at the bottom of your screen.
                          </div>
                      </div>
                      <div className="flex items-center gap-4 bg-black/50 p-3 rounded-lg border border-white/5">
                          <PlusSquare className="text-white" size={24} />
                          <div className="text-xs text-gray-400">
                              <span className="text-white font-bold block mb-0.5">Step 2</span>
                              Scroll down and tap <span className="text-white font-bold">'Add to Home Screen'</span>.
                          </div>
                      </div>
                  </div>
                  <button onClick={() => setShowIOSHelp(false)} className="w-full mt-6 bg-white text-black py-3 rounded font-bold uppercase text-xs tracking-widest">Got it</button>
              </div>
          </div>
      )}

    </div>
  );
}