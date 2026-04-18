import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Focus, Disc } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ResonancePage() {
  const [postCount, setPostCount] = useState<number | null>(null);
  const [moodClusters, setMoodClusters] = useState<{ name: string, percentage: number, color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // 1. Get total post count
        const { count, error: countError } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true });
        
        if (!countError) setPostCount(count);

        // 2. Get mood clusters
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('mood');
        
        if (!postsError && posts && posts.length > 0) {
          const total = posts.length;
          const moods: Record<string, number> = {};
          
          posts.forEach(p => {
            if (p.mood) {
              moods[p.mood] = (moods[p.mood] || 0) + 1;
            }
          });

          const sortedMoods = Object.entries(moods)
            .map(([name, count]) => ({
              name,
              percentage: Math.round((count / total) * 100),
              color: name === 'calm' ? '#446475' : name === 'melancholy' ? '#8e84ad' : '#b08d97'
            }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 3);
          
          setMoodClusters(sortedMoods);
        }
      } catch (err) {
        console.error('Failed to fetch resonance data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-12 pb-32">
        <header className="mb-8 md:mb-16">
          <h1 className="font-serif text-3xl md:text-5xl font-light text-white mb-4">Emotional Resonance</h1>
          <p className="text-[#e1e3ed]/50 uppercase tracking-widest text-[10px] sm:text-xs font-medium">Your connection to the collective.</p>
        </header>

        {/* Hero Score */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative flex flex-col items-center justify-center p-10 md:p-24 rounded-[32px] md:rounded-[40px] mb-8 bg-[#0a0b12] border border-[rgba(255,255,255,0.03)] overflow-hidden"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-[rgba(142,132,173,0.1)] opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-[rgba(142,132,173,0.05)] opacity-30" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="text-xs uppercase tracking-[0.2em] text-[#8e84ad] mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Global Alignment
            </span>
            <div className="font-serif text-7xl md:text-[140px] leading-none text-white tracking-tighter mb-4 font-light">
              {loading ? '...' : postCount ?? 0}
            </div>
            <p className="text-[#e1e3ed]/60 max-w-md font-light text-base md:text-lg">
              {postCount === 0 || postCount === null 
                ? "The network is quiet. Be the first to share a thought."
                : "Thoughts shared the same emotional wavelength across the world. You are not alone in this feeling."}
            </p>
          </div>
        </motion.div>

        {/* Data sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mood Clusters */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-[32px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]"
          >
            <div className="flex items-center gap-3 mb-8">
              <Focus className="w-5 h-5 text-[#446475]" />
              <h3 className="font-medium text-white tracking-wide">Current Mood Clusters</h3>
            </div>
            
            <div className="space-y-6">
              {loading ? (
                <p className="text-white/20 italic animate-pulse">Analyzing clusters...</p>
              ) : moodClusters.length > 0 ? (
                moodClusters.map(cluster => (
                  <div key={cluster.name}>
                    <div className="flex justify-between text-xs uppercase tracking-widest text-[#e1e3ed]/60 mb-2">
                      <span>{cluster.name}</span>
                      <span className="font-mono">{cluster.percentage}% Match</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#14151a] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${cluster.percentage}%`, backgroundColor: cluster.color }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-white/20 italic">Not enough data yet</p>
              )}
            </div>
          </motion.div>

          {/* AI Insights */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-8 rounded-[32px] bg-[#0a0b12] border border-[#8e84ad]/20"
          >
             <div className="flex items-center gap-3 mb-8 text-[#8e84ad]">
              <Disc className="w-5 h-5 flex-shrink-0" />
              <h3 className="font-medium text-white tracking-wide">Internal Weather</h3>
            </div>
            
            <div className="space-y-6 font-serif">
              <p className="text-[#e1e3ed]/80 text-xl leading-relaxed italic border-l border-[#8e84ad]/30 pl-4">
                "Write more thoughts to unlock personal insights."
              </p>
              <p className="text-[#e1e3ed]/50 font-sans text-sm font-light">
                Your writing patterns are still being calibrated. Share your internal world to see how it shifts over time.
              </p>
            </div>
          </motion.div>
      </div>
    </div>
  );
}
