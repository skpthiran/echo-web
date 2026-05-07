import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldOff, Sparkles, Heart, AlertTriangle, Ban } from 'lucide-react';
import { FilterVerdict } from '../lib/messageFilter';
import { CrisisModal } from './CrisisModal';

interface MessageWarningBannerProps {
  verdict: FilterVerdict | null;
  isChecking: boolean;
  isLocked: boolean;
  onDismiss: () => void;
  onDismissAndSend: () => void;
}

export function MessageWarningBanner({ verdict, isChecking, isLocked, onDismiss, onDismissAndSend }: MessageWarningBannerProps) {
  const [showCrisis, setShowCrisis] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isLocked && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="w-full bg-[rgba(220,38,38,0.1)] border border-red-900/40 rounded-xl p-4 mb-4 flex items-center gap-3"
          >
            <ShieldOff className="w-5 h-5 text-red-500" />
            <span className="text-red-200/80 text-sm font-medium tracking-wide">
              This conversation has been locked due to repeated violations.
            </span>
          </motion.div>
        )}

        {!isLocked && isChecking && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="w-full bg-[rgba(142,132,173,0.08)] border border-[#8e84ad]/20 rounded-xl p-4 mb-4 flex items-center gap-3"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
              <Sparkles className="w-5 h-5 text-[#8e84ad]" />
            </motion.div>
            <span className="text-[#8e84ad] text-sm font-medium tracking-wide">
              Analyzing message...
            </span>
          </motion.div>
        )}

        {!isLocked && !isChecking && verdict && !verdict.allowed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className={`w-full rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border ${
              verdict.severity === 'distress' ? 'bg-[rgba(251,191,36,0.08)] border-amber-500/20' :
              verdict.severity === 'mild' ? 'bg-[rgba(249,115,22,0.08)] border-orange-500/20' :
              'bg-[rgba(220,38,38,0.08)] border-red-500/20'
            }`}
          >
            <div className="flex items-center gap-3">
              {verdict.severity === 'distress' && <Heart className="w-5 h-5 text-amber-500 flex-shrink-0" />}
              {verdict.severity === 'mild' && <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />}
              {verdict.severity === 'severe' && <Ban className="w-5 h-5 text-red-500 flex-shrink-0" />}
              <span className={`text-sm font-medium tracking-wide ${
                verdict.severity === 'distress' ? 'text-amber-200/90' :
                verdict.severity === 'mild' ? 'text-orange-200/90' :
                'text-red-200/90'
              }`}>
                {verdict.message}
              </span>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
              {verdict.severity === 'distress' ? (
                <>
                  <button
                    onClick={onDismissAndSend}
                    className="text-[10px] uppercase tracking-widest text-amber-500/70 hover:text-amber-500 transition-colors"
                  >
                    I'm okay, send anyway
                  </button>
                  <button
                    onClick={() => setShowCrisis(true)}
                    className="text-[10px] uppercase tracking-widest bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded hover:bg-amber-500/30 transition-colors"
                  >
                    Get Support
                  </button>
                </>
              ) : (
                <button
                  onClick={onDismiss}
                  className={`text-[10px] uppercase tracking-widest px-3 py-1.5 rounded transition-colors ${
                    verdict.severity === 'mild' 
                      ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' 
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  }`}
                >
                  Edit message
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <CrisisModal 
        isOpen={showCrisis} 
        onClose={() => setShowCrisis(false)} 
        onProceed={() => {
          setShowCrisis(false);
          onDismiss();
        }} 
      />
    </>
  );
}
