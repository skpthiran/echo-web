import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Zap, Users, ShieldCheck, RefreshCw, Lock } from 'lucide-react'
import { ResonanceMatch } from '../hooks/useResonance'

interface ResonancePanelProps {
  isComputing: boolean
  matches: ResonanceMatch[]
  onCompute: () => void
  fheReady: boolean
}

export const ResonancePanel: React.FC<ResonancePanelProps> = ({
  isComputing,
  matches,
  onCompute,
  fheReady
}) => {

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Zap className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="font-semibold text-lg text-white">Resonance</h2>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded-full">
            <ShieldCheck className="w-3 h-3 text-green-400" />
            <span className="text-[10px] font-medium text-green-400 uppercase tracking-widest">On-Device</span>
          </div>
          {fheReady && (
            <div className="flex items-center gap-1 px-2 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
              <Lock className="w-2.5 h-2.5 text-indigo-400" />
              <span className="text-[9px] font-medium text-indigo-400/70 uppercase tracking-tighter italic">
                Signal (dev mode)
              </span>
            </div>
          )}
        </div>
      </div>

      <p className="text-white/60 text-sm mb-6 leading-relaxed">
        Paired by mathematical similarity of intent. STEER encryption ensures your raw data is never exposed.
      </p>

      <div className="space-y-4 mb-6">
        <AnimatePresence mode="popLayout">
          {isComputing ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-12 flex flex-col items-center justify-center text-center"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5] 
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500/40" />
              </motion.div>
              <p className="text-indigo-300 font-medium animate-pulse">Reading your signal...</p>
              <p className="text-white/40 text-xs mt-2">Generating homomorphic embeddings</p>
            </motion.div>
          ) : matches.length > 0 ? (
            matches.map((match, idx) => (
              <motion.div
                key={match.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-indigo-500/30 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {match.avatar_url ? (
                      <img src={match.avatar_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {match.username[0]}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                      @{match.username}
                    </div>
                    <div className="text-[11px] text-white/40">Synchronized intent</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-indigo-400">
                    {Math.round(match.similarity * 100)}%
                  </div>
                  <div className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">Match</div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <Users className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">Your signal is unique.<br />Keep writing to find resonance.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={onCompute}
        disabled={isComputing}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
      >
        <RefreshCw className={`w-4 h-4 ${isComputing ? 'animate-spin' : ''}`} />
        {isComputing ? 'Syncing Vectors...' : 'Compute Resonance'}
      </button>
    </div>
  )
}
