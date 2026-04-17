import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Lock, Disc, Sparkles } from 'lucide-react';

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="relative min-h-screen bg-[#050508] text-[#e1e3ed] overflow-hidden selection:bg-[#8e84ad] selection:text-white">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#12142b] rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#201a2b] rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-[#446475] rounded-full mix-blend-screen filter blur-[90px] opacity-30 animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 md:px-16 md:py-8">
        <div className="text-2xl tracking-widest font-serif font-medium">ECHO</div>
        <button 
          onClick={onEnter}
          className="text-sm uppercase tracking-widest hover:text-white transition-colors duration-300"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] backdrop-blur-md">
            <Lock className="w-3.5 h-3.5 text-[#8e84ad]" />
            <span className="text-xs uppercase tracking-widest text-[#8e84ad]">Privacy-first Emotional Sanctuary</span>
          </div>
          
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.1] tracking-tight mb-6">
            Your thoughts were never <br className="hidden md:block" /> meant to <span className="text-gradient italic">disappear.</span>
          </h1>
          
          <p className="max-w-2xl text-lg md:text-xl text-[#e1e3ed]/60 font-light mb-12 leading-relaxed">
            A quiet space where private feelings become human resonance. We don't build profiles to sell you things. We build a universe to understand you.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <button 
              onClick={onEnter}
              className="group relative inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-black font-medium text-sm tracking-wide overflow-hidden transition-transform active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Writing <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button 
              onClick={onEnter}
              className="inline-flex items-center justify-center px-8 py-4 rounded-full border border-[rgba(255,255,255,0.2)] bg-transparent hover:bg-[rgba(255,255,255,0.05)] text-white font-medium text-sm tracking-wide transition-colors"
            >
              Enter ECHO
            </button>
          </div>
        </motion.div>
        
        {/* Trust tags */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-24 flex flex-wrap justify-center gap-8 md:gap-16 opacity-50"
        >
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
            <Lock className="w-4 h-4" /> Anonymous
          </div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
            <Disc className="w-4 h-4" /> Meaningful Resonance
          </div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
            <Sparkles className="w-4 h-4" /> Intelligent Reflection
          </div>
        </motion.div>
      </main>
    </div>
  );
}
