import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, Waves, MessageCircle, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Post } from '../lib/types';
import { PageId } from './AppShell';

export function MatchesPage({ onNavigate }: { onNavigate: (page: PageId, params?: any) => void }) {
  const { user } = useAuth();
  const [matches, setMatches] = useState<(Post & { similarity: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatches() {
      if (!user) return;
      
      try {
        setLoading(true);

        // 1. Get user's latest post embedding
        const { data: latestPost, error: latestError } = await supabase
          .from('posts')
          .select('embedding')
          .eq('user_id', user.id)
          .not('embedding', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latestError || !latestPost) {
          setLoading(false);
          return;
        }

        // 2. Query for top 3 similar posts (using RPC for safety with vector math)
        const { data, error } = await supabase.rpc('match_posts', {
          query_embedding: latestPost.embedding as number[],
          exclude_user_id: user.id,
          match_count: 3
        });

        if (error) {
           console.error('RPC Error:', error);
           // Fallback to raw query if RPC fails
           const { data: rawData, error: rawError } = await supabase
            .from('posts')
            .select(`
              *,
              similarity:embedding <=> '[${(latestPost.embedding as number[]).join(',')}]'
            `)
            .neq('user_id', user.id)
            .order('embedding', { ascending: true }) 
            .limit(3);
           
           if (!rawError && rawData) {
             setMatches(rawData.map((p: any) => ({
               ...p,
               similarity: Math.round((1 - (p as any).similarity) * 100)
             })));
           }
        } else {
          setMatches(data.map((p: any) => ({
            ...p,
            similarity: Math.round(p.similarity * 100)
          })));
        }
      } catch (err) {
        console.error('Failed to fetch matches:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12 pb-32">
      <header className="mb-8 md:mb-12">
        <h1 className="font-serif text-3xl md:text-5xl font-light text-white mb-4">Aligned Souls</h1>
        <p className="text-[#e1e3ed]/50 text-xs md:text-sm font-light max-w-lg">
          Individuals whose emotional wavelength matches yours based on your recent thoughts.
        </p>
      </header>

        {loading ? (
          <div className="py-20 text-center">
            <p className="text-white/40 font-serif italic text-lg animate-pulse">Searching for resonances...</p>
          </div>
        ) : matches.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center flex flex-col items-center gap-6"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-[#e1e3ed]/40 text-lg font-serif italic max-w-md">
              No aligned souls yet. Share a thought to find your wavelength.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match, i) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-8 rounded-[32px] bg-[#0a0b12] border border-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.1)] transition-all overflow-hidden"
              >
                <div 
                  className="absolute -right-12 -top-12 w-32 h-32 rounded-full filter blur-[40px] opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity"
                  style={{ backgroundColor: ['#8e84ad', '#446475', '#b08d97'][i % 3] }}
                />

                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-white/60">{match.mood ?? 'Quiet'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-full">
                    <Waves className="w-3 h-3 text-white" />
                    <span className="text-xs font-mono text-white">{match.similarity}%</span>
                  </div>
                </div>

                <div className="relative z-10 mb-8">
                  <h3 className="text-xs uppercase tracking-[0.15em] text-[#e1e3ed]/40 mb-2">Shared Theme</h3>
                  <p className="font-serif text-xl text-white font-light line-clamp-2">
                    {match.content.slice(0, 40)}...
                  </p>
                </div>

                <div className="relative z-10 mb-8 border-l-2 border-[rgba(255,255,255,0.05)] pl-4">
                  <p className="text-sm font-light text-[#e1e3ed]/60 italic leading-relaxed line-clamp-3">
                    "{match.content.slice(0, 120)}..."
                  </p>
                </div>

                <button 
                  onClick={() => onNavigate('chat', { with: match.user_id })}
                  className="relative z-10 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] border border-transparent hover:border-[rgba(255,255,255,0.05)] transition-all text-xs font-medium uppercase tracking-widest text-[#e1e3ed]/80 hover:text-white"
                >
                  <MessageCircle className="w-4 h-4" /> Connect
                </button>
              </motion.div>
            ))}
          </div>
        )}
    </div>
  );
}
