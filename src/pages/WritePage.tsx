import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, Send, Sparkles, Clock } from 'lucide-react';
import { PageId } from './AppShell';
import { useCreatePost } from '../hooks/useCreatePost';
import { useAuth } from '../context/AuthContext';
import { ai } from '../lib/ai';
import { supabase } from '../lib/supabase';
import { CrisisModal } from '../components/CrisisModal';
import { HumanGate } from '../components/HumanGate';

export function WritePage({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('Quiet');
  const [isPrivate, setIsPrivate] = useState(true);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [sharing, setSharing] = useState(false);
  const { createPost, loading, error: createError } = useCreatePost();
  const { user } = useAuth();
  const [aiMoodSuggestion, setAiMoodSuggestion] = useState<string | null>(null);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<'idle' | 'moderating' | 'anonymizing' | 'sharing'>('idle');
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const moods = ['Quiet', 'Heavy', 'Hopeful', 'Reflective', 'Lost', 'Found'];

  const handleSubmit = async () => {
    if (!content.trim() || loading) return;
    
    try {
      await createPost(content, mood);
      setSuccessMessage('Your thought has been released.');
      setSuccess(true);
      setContent('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to release thought:', err);
    }
  };

  const handleShareToFeed = async (bypassSafety = false) => {
    if (!content.trim() || content.length < 30 || sharing || !user) return;

    // BUG 3 FIX: close crisis modal immediately when user chooses to proceed
    if (bypassSafety) setShowCrisisModal(false);

    setSharing(true);
    setPipelineError(null);
    let finalContent = content;

    try {
      if (!bypassSafety) {
        // A. Moderation
        setPipelineStep('moderating');
        const moderation = await ai.moderate(content);

        if (moderation === 'distress') {
          setShowCrisisModal(true);
          setSharing(false);
          setPipelineStep('idle');
          return;
        }

        if (moderation === 'aggression') {
          setPipelineError("This thought couldn't be shared. Try rephrasing.");
          setSharing(false);
          setPipelineStep('idle');
          return;
        }
      }

      // BUG 4 FIX: always anonymize — even on bypass path — to prevent PII leaks
      setPipelineStep('anonymizing');
      finalContent = await ai.anonymize(content);

      // Publish to Supabase
      const finalMood = mood || aiMoodSuggestion || 'Quiet';

      setPipelineStep('sharing');
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: finalContent,
          mood: finalMood,
          embedding: await ai.embed(finalContent),
        });

      if (error) throw error;

      setSuccessMessage('Your thought is on the feed');
      setSuccess(true);
      setContent('');

      setTimeout(() => {
        setSuccess(false);
        onNavigate('feed');
      }, 1500);
    } catch (err: any) {
      // BUG 5 FIX: surface errors to the user instead of swallowing them
      console.error('Failed to share to feed:', err);
      setPipelineError(err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSharing(false);
      setPipelineStep('idle');
    }
  };

  useEffect(() => {
    if (content.length < 30) {
      setAiMoodSuggestion(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await ai.getMood(content);
        if (result && result !== 'Quiet') setAiMoodSuggestion(result);
      } catch {
        // silently fail — AI is optional
      }
    }, 1500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) };
  }, [content]);

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Ambient background for this specific page */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] bg-[radial-gradient(circle,rgba(22,26,58,0.3)_0%,transparent_70%)] rounded-full mix-blend-screen filter blur-[80px]" />
      </div>

      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 md:px-6 py-6 md:py-12 lg:py-20 relative z-10">
        
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 md:mb-12 opacity-80 sm:opacity-60 sm:hover:opacity-100 transition-opacity duration-500">
          <div className="flex items-center gap-4">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium text-[#e1e3ed]">Drafting...</span>
            <span className="text-[10px] sm:text-xs font-mono text-[#e1e3ed]/50 flex items-center gap-1.5"><Clock className="w-3 h-3"/> Saved 2m ago</span>
          </div>

          <button 
            onClick={() => setIsPrivate(!isPrivate)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] transition-colors text-[10px] sm:text-xs uppercase tracking-widest w-full sm:w-auto justify-center"
          >
            {isPrivate ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            {isPrivate ? 'Private Space' : 'Open to Resonance'}
          </button>
        </div>

        {/* Writing Canvas */}
        <div className="flex-1 flex flex-col min-h-[30vh]">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What is lingering in the silence today?"
            className="w-full flex-1 bg-transparent border-none outline-none resize-none font-serif text-2xl md:text-5xl lg:text-6xl text-white placeholder:text-[#e1e3ed]/20 leading-[1.2] tracking-tight font-light selection:bg-[#8e84ad]/30"
            autoFocus
          />
        </div>

        {/* Footer Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 pt-8 border-t border-[rgba(255,255,255,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
        >
          {/* Mood Selection */}
          <div className="flex flex-col gap-3 w-full sm:w-auto">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#e1e3ed]/40">Emotional Tone</span>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar w-full sm:max-w-md hide-scrollbar mask-gradient-right">
              {moods.map(m => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`px-4 py-1.5 rounded-full text-xs transition-colors shrink-0
                    ${mood === m 
                      ? 'bg-[rgba(255,255,255,0.1)] text-white border border-[rgba(255,255,255,0.2)]' 
                      : 'text-[#e1e3ed]/40 border border-transparent hover:text-white'
                    }`}
                >
                  {m}
                </button>
              ))}
            </div>
            
            {aiMoodSuggestion && aiMoodSuggestion !== mood && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mt-2"
              >
                <span className="text-xs text-[#e1e3ed]/30 tracking-wide">AI senses:</span>
                <button
                  onClick={() => setMood(aiMoodSuggestion)}
                  className="text-xs text-[#8e84ad] border border-[#8e84ad]/30 rounded-full px-3 py-0.5 hover:bg-[#8e84ad]/10 transition-colors tracking-wide"
                >
                  {aiMoodSuggestion}
                </button>
                <span className="text-[10px] text-[#e1e3ed]/20">tap to apply</span>
              </motion.div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-xs font-mono text-[#e1e3ed]/30 sm:order-first order-last text-right sm:text-left">
              {content.length} / 500
            </div>
            
            <div className="flex flex-col items-stretch sm:items-end gap-3 order-first sm:order-last">
              <button 
                onClick={handleSubmit}
                disabled={content.length === 0 || loading || sharing}
                className={`group flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 rounded-full font-medium text-sm transition-all duration-500 w-full sm:w-auto
                  ${content.length > 0 && !loading && !sharing
                    ? 'bg-white text-black hover:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]' 
                    : 'bg-[rgba(255,255,255,0.02)] text-[#e1e3ed]/30 cursor-not-allowed border border-[rgba(255,255,255,0.05)]'
                  }`}
              >
                <Send className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
                <span>{loading ? 'Releasing...' : 'Release (Private)'}</span>
              </button>

              {content.length >= 30 && user && (
                <div className="flex flex-col items-stretch sm:items-end gap-2">
                  <HumanGate 
                    fallback={
                      <button
                        className="flex items-center gap-2 px-6 py-2 rounded-full border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] text-[#e1e3ed]/20 text-[10px] uppercase tracking-widest cursor-default italic w-full justify-center"
                      >
                        Verification Required to Share
                      </button>
                    }
                  >
                    <button
                      onClick={() => handleShareToFeed()}
                      disabled={sharing || loading}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#8e84ad]/30 bg-transparent hover:bg-[#8e84ad]/5 transition-all duration-300 text-[10px] uppercase tracking-widest text-[#8e84ad] font-bold w-full justify-center ${sharing ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${sharing ? 'animate-spin' : ''}`} />
                      {pipelineStep === 'moderating' ? 'Checking...' : 
                       pipelineStep === 'anonymizing' ? 'Anonymizing...' : 
                       pipelineStep === 'sharing' ? 'Releasing...' : 'Release (Feed)'}
                    </button>
                  </HumanGate>
                  {pipelineError && (
                    <span className="text-[10px] text-red-400/60 lowercase italic tracking-wide">
                      {pipelineError}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <CrisisModal 
          isOpen={showCrisisModal} 
          onClose={() => setShowCrisisModal(false)}
          onProceed={() => handleShareToFeed(true)}
        />

        {/* Feedback Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 text-center text-[#8e84ad] text-sm"
            >
              {successMessage}
            </motion.div>
          )}
          {createError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 text-center text-red-500 text-sm"
            >
              {createError}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
