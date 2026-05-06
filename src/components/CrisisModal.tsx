import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Phone, Info, AlertTriangle } from 'lucide-react';

interface CrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

export function CrisisModal({ isOpen, onClose, onProceed }: CrisisModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-[#0d0e14] border border-[#8e84ad]/20 rounded-[32px] overflow-hidden shadow-[0_0_100px_rgba(142,132,173,0.1)] pointer-events-auto"
            >
              <div className="p-8 md:p-10">
                {/* Header Image/Icon */}
                <div className="w-16 h-16 rounded-2xl bg-[#8e84ad]/10 flex items-center justify-center mb-8 mx-auto">
                    <Heart className="w-8 h-8 text-[#8e84ad]" />
                </div>

                <div className="text-center mb-10">
                  <h2 className="font-serif text-3xl text-white mb-4">You're not alone in this silence.</h2>
                  <p className="text-[#e1e3ed]/60 text-lg leading-relaxed font-light">
                    Your words carry a lot of weight today. Before you share this thought, we wanted to reach out and offer a safe space.
                  </p>
                </div>

                {/* Crisis Resources (Sri Lanka) */}
                <div className="space-y-4 mb-10">
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 group hover:border-[#8e84ad]/30 transition-colors">
                    <Phone className="w-5 h-5 text-[#8e84ad] mt-0.5" />
                    <div>
                      <div className="text-white font-medium mb-1 flex items-center gap-2">
                        Sumithrayo
                        <span className="text-[10px] bg-[#8e84ad]/20 text-[#8e84ad] px-2 py-0.5 rounded-full uppercase tracking-widest">24/7 Helpline</span>
                      </div>
                      <a href="tel:0112692909" className="text-2xl font-mono text-[#8e84ad] hover:text-[#a59bc8] transition-colors">011-2692909</a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 group hover:border-[#8e84ad]/30 transition-colors">
                    <div className="w-5 h-5 flex items-center justify-center text-[#8e84ad] font-bold text-lg mt-0.5">!</div>
                    <div>
                      <div className="text-white font-medium mb-1 flex items-center gap-2">
                        CCCline
                        <span className="text-[10px] bg-[#8e84ad]/20 text-[#8e84ad] px-2 py-0.5 rounded-full uppercase tracking-widest">Toll Free</span>
                      </div>
                      <a href="tel:1333" className="text-2xl font-mono text-[#8e84ad] hover:text-[#a59bc8] transition-colors">1333</a>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={onProceed}
                    className="w-full py-4 rounded-full bg-white text-black font-semibold text-sm hover:scale-[0.98] transition-transform shadow-[0_4px_20px_rgba(255,255,255,0.1)]"
                  >
                    I'm okay, post anyway
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-4 rounded-full bg-transparent border border-white/10 text-white/50 font-medium text-sm hover:bg-white/5 transition-colors"
                  >
                    Take a moment
                  </button>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 italic">
                        Your thought is anonymized by AI before anything is shared.
                    </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
