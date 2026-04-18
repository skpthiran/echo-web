import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PostCard } from '../components/PostCard';
import { useFeed } from '../hooks/useFeed';
import { ResonancePanel } from '../components/ResonancePanel';
import { useResonance } from '../hooks/useResonance';
import { useAuth } from '../context/AuthContext';

export function FeedPage() {
  const { user } = useAuth();
  const { posts, loading, error, refetch } = useFeed();
  const { resonanceMatches, isComputing, computeResonance, fheReady } = useResonance(user?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12 pb-32">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Main Feed */}
        <div className="lg:col-span-8">
          <div className="mb-8 md:mb-12">
            <h1 className="font-serif text-3xl md:text-5xl font-light tracking-tight text-white mb-4">
              The Social Feed
            </h1>
            <p className="text-white/40 text-xs md:text-sm font-light tracking-wide max-w-lg leading-relaxed">
              Echoes from around the world. Every thought is a thread in the collective consciousness.
            </p>
          </div>

          <AnimatePresence mode="popLayout">
            {loading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center"
              >
                <p className="text-white/40 font-serif italic text-lg animate-pulse">Gathering thoughts...</p>
              </motion.div>
            ) : error ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center space-y-4"
              >
                <p className="text-red-400/60 font-serif italic text-lg">Our connection to the feed was lost.</p>
                <button 
                  onClick={() => refetch()}
                  className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-[10px] uppercase tracking-[0.2em]"
                >
                  Reconnect
                </button>
              </motion.div>
            ) : (posts ?? []).length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-[40vh] flex flex-col items-center justify-center text-center italic"
              >
                <p className="text-white/30 text-lg font-serif">No thoughts shared yet. Be the first.</p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {(posts ?? []).map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onReactionUpdate={() => refetch()} 
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Resonance Sidebar - Hidden on mobile */}
        <div className="hidden lg:block lg:col-span-4 space-y-6">
          <div className="sticky top-24">
            <ResonancePanel 
              isComputing={isComputing}
              matches={resonanceMatches}
              onCompute={computeResonance}
              fheReady={fheReady}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
