import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Check, Sparkles, MessageSquare, Target, User as UserIcon } from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

const INTENT_OPTIONS = [
  { id: 'emotions', label: '🌊 Process emotions' },
  { id: 'understand', label: '🔍 Understand myself' },
  { id: 'resonance', label: '🤝 Find resonance with others' },
  { id: 'writing', label: '✍️ Write without judgment' },
  { id: 'quiet', label: '🌙 Quiet the noise' },
  { id: 'patterns', label: '💡 Track my patterns' }
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshProfile } = useProfile();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [intent, setIntent] = useState('');
  const [thought, setThought] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const thoughtInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (step === 2 && nameInputRef.current) {
      nameInputRef.current.focus();
    } else if (step === 4 && thoughtInputRef.current) {
      thoughtInputRef.current.focus();
    }
  }, [step]);

  const handleNext = async () => {
    if (step === 2) {
      await supabase.from('profiles').update({ username: name }).eq('id', user?.id);
    } else if (step === 3) {
      await supabase.from('profiles').update({ onboarding_intent: intent }).eq('id', user?.id);
    }
    setStep((prev) => (prev + 1) as Step);
  };

  const handleBack = () => {
    setStep((prev) => (prev - 1) as Step);
  };

  const handleComplete = async (savePost: boolean) => {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
      if (savePost && thought.trim()) {
        await supabase.from('posts').insert({
          user_id: user.id,
          content: thought,
          mood: 'Initiation',
          is_anonymous: true // Default to anonymous for first thought
        });
      }

      await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id);
      await refreshProfile();
      navigate('/');
    } catch (error) {
      console.error('Onboarding completion failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgress = () => (
    <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
      <motion.div 
        className="h-full bg-[#8e84ad] shadow-[0_0_10px_rgba(142,132,173,0.5)]"
        initial={{ width: '0%' }}
        animate={{ width: `${(step / 4) * 100}%` }}
        transition={{ type: 'spring', stiffness: 50, damping: 20 }}
      />
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-8"
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-[#8e84ad]/20 blur-3xl rounded-full" />
              <div className="relative w-24 h-24 bg-black border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Sparkles className="w-12 h-12 text-[#8e84ad]" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-outfit font-bold tracking-tight text-white">
                Welcome to Echo
              </h1>
              <p className="text-[#e1e3ed]/60 text-lg leading-relaxed max-w-sm mx-auto">
                A sanctuary for your unperformed thoughts. No likes. No followers. Just resonance.
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full max-w-xs bg-white text-black font-semibold py-4 px-8 rounded-2xl hover:bg-[#e1e3ed] transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              Begin Journey
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        );

      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 w-full max-w-md"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-[#8e84ad] mb-2">
                <UserIcon className="w-5 h-5" />
                <span className="text-sm font-medium uppercase tracking-widest">Identify</span>
              </div>
              <h2 className="text-3xl font-bold text-white">What should we call you?</h2>
              <p className="text-[#e1e3ed]/50 text-sm">
                This is your presence in the collective. It can be anything.
              </p>
            </div>

            <div className="relative">
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 30))}
                placeholder="A name, a feeling, a word..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-lg text-white placeholder:text-white/20 focus:outline-none focus:border-[#8e84ad]/50 transition-colors"
                maxLength={30}
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] text-white/30 font-mono">
                {name.length}/30
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                disabled={!name.trim()}
                onClick={handleNext}
                className="w-full bg-white text-black font-semibold py-4 px-8 rounded-2xl hover:bg-[#e1e3ed] disabled:opacity-50 disabled:hover:bg-white transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
              <button 
                onClick={handleBack}
                className="text-[#e1e3ed]/40 text-sm hover:text-white transition-colors"
              >
                Back to start
              </button>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 w-full max-w-md"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-[#b08d97] mb-2">
                <Target className="w-5 h-5" />
                <span className="text-sm font-medium uppercase tracking-widest">Purpose</span>
              </div>
              <h2 className="text-3xl font-bold text-white">Why are you here?</h2>
              <p className="text-[#e1e3ed]/50 text-sm">
                This shapes your experience. Choose what resonates.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {INTENT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setIntent(option.id)}
                  className={`w-full text-left px-6 py-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group
                    ${intent === option.id 
                      ? 'bg-[#8e84ad]/10 border-[#8e84ad]/50 text-white' 
                      : 'bg-white/5 border-white/10 text-[#e1e3ed]/60 hover:border-white/20'}`}
                >
                  <span className="text-base">{option.label}</span>
                  {intent === option.id && (
                    <motion.div 
                      layoutId="intent-check"
                      className="w-5 h-5 bg-[#8e84ad] rounded-full flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <button
                disabled={!intent}
                onClick={handleNext}
                className="w-full bg-white text-black font-semibold py-4 px-8 rounded-2xl hover:bg-[#e1e3ed] disabled:opacity-50 disabled:hover:bg-white transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
              <button 
                onClick={handleBack}
                className="text-[#e1e3ed]/40 text-sm hover:text-white transition-colors"
              >
                Back
              </button>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 w-full max-w-md"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-[#c0c0c0] mb-2">
                <MessageSquare className="w-5 h-5" />
                <span className="text-sm font-medium uppercase tracking-widest">Initial Flow</span>
              </div>
              <h2 className="text-3xl font-bold text-white">Begin with one thought</h2>
              <p className="text-[#e1e3ed]/50 text-sm">
                It won't be judged. It won't be shared unless you choose.
              </p>
            </div>

            <div className="relative">
              <textarea
                ref={thoughtInputRef}
                value={thought}
                onChange={(e) => setThought(e.target.value)}
                placeholder="What's present for you right now?"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 min-h-[160px] text-lg text-white placeholder:text-white/20 focus:outline-none focus:border-[#8e84ad]/50 transition-colors resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={isSubmitting || !thought.trim()}
                  onClick={() => handleComplete(true)}
                  className="bg-white text-black font-semibold py-4 px-4 rounded-2xl hover:bg-[#e1e3ed] disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Save Privately'}
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={() => handleComplete(false)}
                  className="bg-white/5 border border-white/10 text-white font-semibold py-4 px-4 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center text-sm"
                >
                  Skip for now
                </button>
              </div>
              <button 
                disabled={isSubmitting}
                onClick={handleBack}
                className="w-full text-[#e1e3ed]/40 text-sm hover:text-white transition-colors"
              >
                Back
              </button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#8e84ad]/5 blur-[120px] rounded-full pointer-events-none" />
      
      {renderProgress()}

      <div className="w-full max-w-sm relative z-10 py-12">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-12 left-0 right-0 text-center pointer-events-none">
        <div className="font-serif text-sm tracking-[0.3em] text-white/5 select-none">ECHO ONBOARDING</div>
      </div>
    </div>
  );
}
