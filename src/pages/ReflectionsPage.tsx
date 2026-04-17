import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Search, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { PostRow } from '../lib/types';
import { ai } from '../lib/ai';

type WeeklyReflection = {
  id: string;
  week: string;
  title: string;
  summary: string;
  insight: string;
  posts: PostRow[];
}

export function ReflectionsPage() {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReflections() {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data: posts, error } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error || !posts || posts.length === 0) {
          setReflections([]);
          return;
        }

        // Group by week
        const groups: Record<string, PostRow[]> = {};
        posts.forEach(post => {
          const date = new Date(post.created_at);
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay());
          const weekKey = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          
          if (!groups[weekKey]) groups[weekKey] = [];
          groups[weekKey].push(post);
        });

        // Generate insights for each week
        const reflectionData: WeeklyReflection[] = await Promise.all(
          Object.entries(groups).map(async ([week, weekPosts]) => {
            const combinedContent = weekPosts.map(p => p.content).join(' ');
            const dominantMood = await ai.getMood(combinedContent);
            
            return {
              id: week,
              week: `Week of ${week}`,
              title: `A week of ${dominantMood}`,
              summary: weekPosts[0].content.slice(0, 150) + (weekPosts[0].content.length > 150 ? '...' : ''),
              insight: dominantMood.charAt(0).toUpperCase() + dominantMood.slice(1),
              posts: weekPosts
            };
          })
        );

        setReflections(reflectionData);
      } catch (err) {
        console.error('Failed to fetch reflections:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchReflections();
  }, [user]);

  return (
    <div className="h-full overflow-y-auto pb-24">
      <div className="w-full max-w-4xl mx-auto px-6 py-12">
        <header className="mb-16">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-white mb-4">The Mirror</h1>
          <p className="text-[#e1e3ed]/50 text-sm font-light max-w-xl leading-relaxed">
            AI-synthesized reflections of your past writings. See how your internal weather changes over time.
          </p>
        </header>

        {loading ? (
          <div className="py-20 text-center">
            <p className="text-white/40 font-serif italic text-lg animate-pulse">Mirroring your thoughts...</p>
          </div>
        ) : reflections.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center flex flex-col items-center gap-6"
          >
             <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-[#e1e3ed]/40 text-lg font-serif italic max-w-md">
              Your mirror is empty. Write your first thought to begin.
            </p>
          </motion.div>
        ) : (
          <div className="relative border-l border-[rgba(255,255,255,0.05)] pl-8 md:pl-12 ml-4">
            {reflections.map((ref, i) => (
              <motion.div 
                key={ref.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className="relative mb-16 last:mb-0"
              >
                <div className="absolute left-[-41px] top-0 md:left-[-57px] w-4 h-4 rounded-full bg-[#14151a] border-2 border-[#8e84ad] shadow-[0_0_15px_rgba(142,132,173,0.5)]" />
                
                <div className="text-xs uppercase tracking-[0.2em] text-[#8e84ad] mb-3 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> {ref.week}
                </div>
                
                <div className="p-8 md:p-10 rounded-[32px] bg-[#0a0b12] border border-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.08)] transition-all">
                  <h3 className="font-serif text-3xl font-light text-white mb-6">
                    {ref.title}
                  </h3>
                  
                  <p className="text-[#e1e3ed]/80 font-light leading-relaxed mb-8">
                    {ref.summary}
                  </p>
                  
                  <div className="p-6 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
                    <div className="flex items-start gap-3">
                      <Search className="w-4 h-4 text-[#e1e3ed]/40 mt-1 shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#e1e3ed]/40 block mb-1">Synthesized Insight</span>
                        <p className="font-serif text-xl text-white italic font-light">
                          "Currently experiencing a trend of {ref.insight.toLowerCase()}."
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.03)]">
                    <div className="text-[10px] uppercase tracking-widest text-white/20 mb-4">Underlying Threads</div>
                    <div className="space-y-4">
                      {ref.posts.slice(0, 3).map(post => (
                        <div key={post.id} className="text-xs text-white/40 font-light border-l border-white/10 pl-4 py-1">
                          {post.content.slice(0, 100)}...
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
