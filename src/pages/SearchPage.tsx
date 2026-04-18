import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearch } from '../hooks/useSearch';
import { PostCard } from '../components/PostCard';

const MOOD_FILTERS = [
  'reflective', 'anxious', 'hopeful', 'melancholic', 
  'excited', 'angry', 'peaceful', 'confused'
];

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const { query, setQuery, results, isLoading, hasSearched } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Sync URL param to hook state once on mount
    if (initialQuery && query === '') {
      setQuery(initialQuery);
    }
    
    // Autofocus on mount
    inputRef.current?.focus();
  }, []);

  // Sync state back to URL
  useEffect(() => {
    if (query) {
      setSearchParams({ q: query }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [query, setSearchParams]);

  const handleMoodClick = (mood: string) => {
    setQuery(mood);
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12 pb-32">
      <div className="relative mb-12">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-white/20" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search thoughts, moods, feelings..."
          className="w-full bg-[#14151a] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50 transition-all shadow-2xl"
        />
      </div>

      <AnimatePresence mode="wait">
        {!hasSearched && !isLoading ? (
          <motion.div
            key="initial-state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="font-serif text-xl text-white/40 italic">How does your internal world feel today?</h2>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {MOOD_FILTERS.map((mood) => (
                  <button
                    key={mood}
                    onClick={() => handleMoodClick(mood)}
                    className="px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[#e1e3ed]/60 text-xs font-medium uppercase tracking-widest hover:bg-white/10 hover:text-white hover:border-white/10 transition-all"
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : isLoading ? (
          <motion.div
            key="loading-state"
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </motion.div>
        ) : results.length > 0 ? (
          <motion.div
            key="results-state"
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-medium">
                {results.length} Resonance{results.length === 1 ? '' : 's'} Found
              </span>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {results.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center"
          >
            <p className="text-white/20 italic font-serif text-lg">No thoughts found for that feeling.</p>
            <button 
              onClick={() => setQuery('')}
              className="mt-4 text-xs uppercase tracking-widest text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
            >
              Clear Search
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
