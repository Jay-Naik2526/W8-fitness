import React, { useState, useRef, useEffect } from 'react';
import { motion } from "framer-motion";
import { Send, Bot, User, ChevronLeft, AlertCircle } from "lucide-react";
import { useNavigate } from 'react-router-dom';

export default function Oracle() {
  const navigate = useNavigate();
  const scrollRef = useRef<any>(null);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Initial State: System Welcome Message
  const [messages, setMessages] = useState<any[]>([
    { role: 'model', text: "Systems Online. I am The Oracle. Ask me about training, nutrition, or recovery." }
  ]);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e: any) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Add User Message to UI immediately
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input; // Store for API call
    setInput(''); // Clear input box
    setLoading(true);

    try {
      // 2. Prepare History for Context
      // We take the last 6 messages to give the AI context, but avoid overloading it
      const historyForAI = messages.slice(-6).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      // 3. Send to Backend
      const res = await fetch('https://w8-fitness-backend-api.onrender.com/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, history: historyForAI })
      });

      const data = await res.json();

      // 4. Check for Server Errors
      if (!res.ok || data.error) {
        throw new Error(data.error || data.reply || "Unknown Server Error");
      }
      
      // 5. Success: Add AI Response
      setMessages(prev => [...prev, { role: 'model', text: data.reply }]);

    } catch (err: any) {
      // 6. Failure: Add Error Message to Chat
      console.error("Oracle Error:", err);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: `ERROR: ${err.message || "Connection Failed"}`, 
        isError: true 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white max-w-md mx-auto relative">
      
      {/* HEADER */}
      <header className="p-4 border-b border-white/10 bg-black/80 backdrop-blur-md flex items-center gap-3 z-10 sticky top-0">
         <button 
           onClick={() => navigate('/dashboard')} 
           className="p-2 hover:bg-white/10 rounded-full transition-colors"
         >
            <ChevronLeft size={20} />
         </button>
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-w8-red/20 border border-w8-red flex items-center justify-center relative">
               <Bot size={20} className="text-w8-red" />
               <div className="absolute inset-0 bg-w8-red/20 animate-ping rounded-full opacity-50"></div>
            </div>
            <div>
               <h1 className="font-bold uppercase text-sm italic">The Oracle</h1>
               <p className="text-[10px] text-green-500 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> ONLINE
               </p>
            </div>
         </div>
      </header>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
         {messages.map((msg, i) => (
            <motion.div 
               key={i}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
               {/* Avatar */}
               <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border
                  ${msg.role === 'user' 
                     ? 'bg-gray-800 border-gray-700' 
                     : msg.isError ? 'bg-red-900/20 border-red-500' : 'bg-w8-red/10 border-w8-red/50'}`}>
                  {msg.role === 'user' ? <User size={14} /> : msg.isError ? <AlertCircle size={14} className="text-red-500"/> : <Bot size={14} className="text-w8-red" />}
               </div>

               {/* Bubble */}
               <div className={`p-3 rounded-2xl text-sm max-w-[80%] leading-relaxed shadow-lg break-words
                  ${msg.role === 'user' 
                     ? 'bg-white/10 text-white rounded-tr-none border border-white/10' 
                     : msg.isError 
                        ? 'bg-red-500/10 text-red-200 border border-red-500/50 rounded-tl-none'
                        : 'bg-w8-red/10 text-gray-200 rounded-tl-none border border-w8-red/20 shadow-[0_0_15px_rgba(214,0,0,0.1)]'
                  }`}>
                  {msg.text}
               </div>
            </motion.div>
         ))}
         
         {/* Loading Indicator */}
         {loading && (
            <div className="flex gap-3">
               <div className="w-8 h-8 rounded-full bg-w8-red/10 border border-w8-red/50 flex items-center justify-center">
                  <Bot size={14} className="text-w8-red" />
               </div>
               <div className="bg-w8-red/10 p-4 rounded-2xl rounded-tl-none border border-w8-red/20 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-w8-red rounded-full animate-bounce"/>
                  <span className="w-1.5 h-1.5 bg-w8-red rounded-full animate-bounce delay-100"/>
                  <span className="w-1.5 h-1.5 bg-w8-red rounded-full animate-bounce delay-200"/>
               </div>
            </div>
         )}
         <div ref={scrollRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-black/80 backdrop-blur-xl border-t border-white/10 fixed bottom-0 w-full max-w-md z-50">
         <form onSubmit={handleSend} className="relative flex items-center gap-2">
            <input 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="Enter Query..."
               className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-5 pr-12 text-sm text-white focus:border-w8-red focus:bg-white/10 outline-none transition-all placeholder:text-gray-600 font-mono"
               disabled={loading}
            />
            <button 
               type="submit"
               disabled={loading || !input.trim()}
               className="absolute right-2 p-2 bg-w8-red rounded-full text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:bg-gray-800"
            >
               <Send size={16} />
            </button>
         </form>
      </div>

    </div>
  );
}