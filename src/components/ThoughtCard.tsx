import React, { useState } from 'react';
import { MoreHorizontal, MessageCircle, Bookmark, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useReactions } from '../hooks/useReactions';
import { useAuth } from '../context/AuthContext';
import { CommentSection } from './CommentSection';

export interface ThoughtCardProps {
  postId: string;
  author: string;
  timestamp: string;
  content: string;
  mood: string;
  resonanceCount: number;
  repliesCount: number;
  isSaved?: boolean;
  hasResonated?: boolean;
  refetch?: () => void;
}

export function ThoughtCard({ 
  postId, author, timestamp, content, mood, 
  resonanceCount, repliesCount, isSaved = false, hasResonated = false,
  refetch
}: ThoughtCardProps) {
  const { user } = useAuth();
  const { toggleReaction, loading: reactionLoading } = useReactions(postId);
  const [resonate, setResonate] = useState(hasResonated);
  const [save, setSave] = useState(isSaved);
  const [localResCount, setLocalResCount] = useState(resonanceCount);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const handleResonate = async () => {
    if (!user) return;
    const nextState = !resonate;
    setResonate(nextState);
    setLocalResCount(prev => nextState ? prev + 1 : prev - 1);
    
    try {
      await toggleReaction('resonate');
    } catch (err) {
      // Revert on error
      setResonate(!nextState);
      setLocalResCount(prev => nextState ? prev - 1 : prev + 1);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className="group relative flex flex-col p-8 md:p-10 mb-8 rounded-[32px] bg-[#0a0b12] border border-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.08)] transition-all duration-500 overflow-hidden"
    >
      {/* Background glowing effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0.02)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#8e84ad] rounded-full mix-blend-screen filter blur-[100px] opacity-0 group-hover:opacity-[0.07] transition-opacity duration-1000 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#14151a] to-[#201a2b] flex items-center justify-center border border-[rgba(255,255,255,0.05)]">
            <span className="font-serif italic text-sm text-[#e1e3ed]/60">A</span>
          </div>
          <div>
            <div className="text-sm font-medium text-[#e1e3ed]/90">{author}</div>
            <div className="text-xs text-[#e1e3ed]/40 tracking-wide">{timestamp}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex px-3 py-1 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-full text-[10px] uppercase tracking-[0.15em] text-[#e1e3ed]/50">
            {mood}
          </div>
          <button className="text-[#e1e3ed]/30 hover:text-[#e1e3ed]/80 transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 mb-10 pl-2 border-l-2 border-[#201a2b] group-hover:border-[#446475] transition-colors duration-500">
        <p className="font-serif text-2xl md:text-3xl lg:text-4xl leading-[1.3] text-[#e1e3ed] font-light">
          "{content}"
        </p>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-[rgba(255,255,255,0.04)] relative z-10">
        <div className="flex flex-wrap items-center gap-2 sm:gap-6">
          <button 
            onClick={handleResonate}
            disabled={reactionLoading === postId}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-full border transition-all duration-300
              ${resonate 
                ? 'bg-[rgba(142,132,173,0.1)] border-[rgba(142,132,173,0.3)] text-[#8e84ad]' 
                : 'bg-transparent border-[rgba(255,255,255,0.05)] text-[#e1e3ed]/50 hover:bg-[rgba(255,255,255,0.02)] hover:text-[#e1e3ed]/80'}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor] ${reactionLoading === postId ? 'animate-ping' : ''}`} />
            <span className="text-xs font-medium tracking-wide">Felt This</span>
            <span className="text-xs font-mono ml-1 opacity-70">{localResCount}</span>
          </button>

          <button 
            onClick={() => setCommentsOpen(!commentsOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full bg-transparent border transition-all duration-300
              ${commentsOpen 
                ? 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] text-white' 
                : 'border-transparent text-[#e1e3ed]/50 hover:border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] hover:text-[#e1e3ed]/80'}`}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs font-medium tracking-wide">Reply</span>
            <span className="text-xs font-mono ml-1 opacity-70">{repliesCount}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSave(!save)}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors 
              ${save ? 'text-[#e1e3ed]' : 'text-[#e1e3ed]/30 hover:text-[#e1e3ed]/80'}`}
          >
            <Bookmark className="w-4 h-4" fill={save ? 'currentColor' : 'none'} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-[#e1e3ed]/30 hover:text-[#e1e3ed]/80 transition-colors">
            <Share className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-time Comment Section */}
      <CommentSection postId={postId} isOpen={commentsOpen} />

    </motion.div>
  );
}
