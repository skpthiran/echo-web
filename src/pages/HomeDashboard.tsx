import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { PenTool, Activity, ArrowRight, Wind } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useProfile } from '../hooks/useProfile';
import { PostRow } from '../lib/types';
import { PageId } from './AppShell';

export function HomeDashboard({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const { profile } = useProfile();
  const [recentPosts, setRecentPosts] = useState<PostRow[]>([]);
  const [stats, setStats] = useState({ resonanceCount: 0 });

  useEffect(() => {
    async function fetchData() {
      // Fetch stats
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });
      
      setStats({ resonanceCount: count || 0 });

      // Fetch recent posts (general feed preview)
      const { data } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (data) setRecentPosts(data);
    }

    fetchData();
  }, []);

  return (
    <div className="h-full flex justify-center pb-24">
      <div className="w-full max-w-5xl px-4 py-8 lg:py-12">
        {/* Welcome Section */}
        <section className="mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-3xl md:text-5xl font-light text-[#e1e3ed] mb-4"
          >
            Good evening. <br className="md:hidden" /> <span className="text-[#e1e3ed]/50">The world is quiet here.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[#e1e3ed]/60 text-lg font-light max-w-2xl"
          >
            Your emotional resonance is strong today. There are currently {stats.resonanceCount} thoughts shared on the wavelength.
          </motion.p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Daily Prompt (Large Hero Card) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-8 group relative rounded-[32px] bg-[#0a0b12] border border-[rgba(255,255,255,0.05)] overflow-hidden cursor-pointer"
            onClick={() => onNavigate('write')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(142,132,173,0.1)] to-transparent opacity-50" />
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#8e84ad] rounded-full mix-blend-screen filter blur-[100px] opacity-[0.15] group-hover:opacity-[0.25] transition-opacity duration-1000 pointer-events-none" />
            
            <div className="relative p-10 md:p-12 h-full flex flex-col justify-between min-h-[320px]">
              <div className="flex items-center gap-3 mb-8">
                <div className="px-3 py-1 bg-[rgba(255,255,255,0.05)] rounded-full text-[10px] uppercase tracking-[0.15em] text-[#e1e3ed]/50 backdrop-blur-md">
                  Daily Prompt
                </div>
              </div>
              
              <div>
                <h3 className="font-serif text-3xl md:text-4xl text-white font-light leading-tight mb-8 group-hover:text-[#e1e3ed] transition-colors">
                  "What is a boundary you set today <br/> that you're proud of?"
                </h3>
                
                <div className="flex items-center gap-4 text-[#e1e3ed]/60">
                  <div className="w-10 h-10 rounded-full border border-[rgba(255,255,255,0.1)] flex items-center justify-center bg-[rgba(255,255,255,0.02)] group-hover:bg-white group-hover:text-black transition-all">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium tracking-wide uppercase">Begin Reflection</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Column */}
          <div className="md:col-span-4 flex flex-col gap-6">
            {/* Streak */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex-1 rounded-[32px] bg-[#0a0b12] border border-[rgba(255,255,255,0.03)] p-8 flex flex-col justify-center"
            >
              <div className="flex justify-between items-start mb-6">
                <Wind className="w-5 h-5 text-[#b08d97]" />
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#e1e3ed]/40">Continuity</span>
              </div>
              <div className="font-serif text-5xl text-white font-light mb-2">{profile?.streak || 0}</div>
              <div className="text-sm text-[#e1e3ed]/50">Days of quiet reflection</div>
            </motion.div>

            {/* Resonance */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              onClick={() => onNavigate('resonance')}
              className="flex-1 rounded-[32px] bg-[#0a0b12] border border-[rgba(255,255,255,0.03)] p-8 flex flex-col justify-center cursor-pointer hover:border-[rgba(255,255,255,0.1)] transition-colors group"
            >
              <div className="flex justify-between items-start mb-6">
                <Activity className="w-5 h-5 text-[#446475]" />
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#e1e3ed]/40">Reputation</span>
              </div>
              <div className="font-serif text-5xl text-white font-light mb-2">{profile?.reputation_score || 0}</div>
              <div className="text-sm text-[#e1e3ed]/50 flex items-center gap-2">
                Shared wavelength <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          </div>
          
          {/* Recent Reflections Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="md:col-span-12 mt-8"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-serif text-2xl text-white">Recent Echoes</h3>
              <button 
                onClick={() => onNavigate('feed')}
                className="text-xs uppercase tracking-widest text-[#e1e3ed]/50 hover:text-white transition-colors"
              >
                View Feed
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPosts.length > 0 ? recentPosts.map((thought, i) => (
                <div 
                  key={thought.id} 
                  className="p-8 rounded-[24px] bg-[#14151a]/50 border border-[rgba(255,255,255,0.02)] hover:bg-[#14151a] transition-colors cursor-pointer group"
                  onClick={() => onNavigate('feed')}
                >
                  <div className="text-[10px] uppercase tracking-widest text-[#e1e3ed]/30 mb-4">
                    {new Date(thought.created_at).toLocaleDateString()}
                  </div>
                  <p className="font-serif text-lg leading-snug text-[#e1e3ed]/80 group-hover:text-white transition-colors line-clamp-4">
                    "{thought.content}"
                  </p>
                </div>
              )) : (
                <div className="md:col-span-3 text-center py-12 border border-dashed border-white/5 rounded-3xl">
                  <p className="text-white/20 italic font-serif">The feed is waiting for your voice.</p>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
