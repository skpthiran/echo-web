import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Heart, Clock, ChevronDown, ChevronUp, Hand, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Post } from '../lib/types';
import { useAuth } from '../context/AuthContext';
import { useReactions, ReactionType } from '../hooks/useReactions';
import { HumanGate } from './HumanGate';

interface PostCardProps {
  post: Post;
  onReactionUpdate?: () => void;
  isDetailView?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onReactionUpdate, isDetailView = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const { counts, userReaction, toggleReaction } = useReactions(post.id);

  const lines = post.content.split('\n');
  const needsTruncation = !isDetailView && (lines.length > 4 || post.content.length > 280);
  const displayContent = (isExpanded || isDetailView) ? post.content : post.content.slice(0, 280);

  const reactions: { type: ReactionType; icon: any; color: string; label: string }[] = [
    { type: 'resonate', icon: Heart, color: 'text-red-400', label: 'Resonate' },
    { type: 'holding', icon: Hand, color: 'text-blue-400', label: 'Holding' },
    { type: 'witnessed', icon: Eye, color: 'text-emerald-400', label: 'Witnessed' },
  ];

  return (
    <motion.div
      initial={isDetailView ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative bg-[#14151a] border border-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden transition-all duration-500 shadow-lg ${!isDetailView ? 'hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]' : ''}`}
    >
      {/* Visual background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#8e84ad]/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-[#8e84ad]/10 transition-colors duration-700" />
      
      <div className="p-4 md:p-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-[rgba(255,255,255,0.1)] overflow-hidden bg-gradient-to-br from-[#1a1b23] to-[#0a0a0f]">
              <img 
                src={post.profiles.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${post.user_id}`} 
                alt={post.profiles.username}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h4 className="text-sm font-medium text-white/90 font-serif tracking-wide">{post.profiles.username}</h4>
              <div className="flex items-center gap-1.5 text-[10px] text-white/40 uppercase tracking-widest">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(post.created_at))} ago
              </div>
            </div>
          </div>

          {post.mood && (
            <div className="px-3 py-1 rounded-full bg-[rgba(142,132,173,0.1)] border border-[rgba(142,132,173,0.2)] text-[10px] font-medium text-[#c4bdd6] tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(142,132,173,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8e84ad] animate-pulse" />
              {post.mood}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className={`text-[#e1e3ed]/80 leading-relaxed text-sm lg:text-base whitespace-pre-wrap font-sans transition-all duration-300 ${!isExpanded && !isDetailView && needsTruncation ? 'line-clamp-4' : ''}`}>
            {displayContent}
            {!isExpanded && !isDetailView && needsTruncation && '...'}
          </p>
          
          {needsTruncation && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-[#8e84ad] hover:text-[#a59bc8] transition-colors uppercase tracking-widest"
            >
              {isExpanded ? (
                <>Collapse <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Read more <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.03)]">
          <div className="flex items-center gap-4">
            <HumanGate fallback={<div className="flex items-center gap-4 opacity-50 pointer-events-none"><span className="text-[10px] uppercase tracking-widest text-white/20">Verify to React</span></div>}>
              <div className="flex items-center gap-4">
                {reactions.map((r) => {
                  const Icon = r.icon;
                  const isActive = userReaction === r.type;
                  const count = counts[r.type] || 0;
                  return (
                    <button
                      key={r.type}
                      onClick={() => toggleReaction(r.type)}
                      className={`flex items-center gap-1.5 group/btn transition-all duration-300`}
                      title={r.label}
                    >
                      <div className={`p-2 rounded-full transition-all duration-300 ${isActive ? 'bg-white/10 ' + r.color : 'text-white/40 group-hover/btn:bg-white/5 group-hover/btn:text-white/70'}`}>
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'fill-current' : ''}`} />
                      </div>
                      <span className={`text-[10px] font-mono tracking-tighter ${isActive ? 'text-white' : 'text-white/30'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </HumanGate>
          </div>

          <button 
            onClick={() => !isDetailView && navigate(`/feed/${post.id}`)}
            className={`flex items-center gap-2 group/btn transition-all duration-300 ${isDetailView ? 'cursor-default opacity-50' : 'hover:scale-105 active:scale-95'}`}
          >
            <div className="p-2 rounded-full text-white/40 group-hover/btn:bg-[#8e84ad]/10 group-hover/btn:text-[#8e84ad] transition-all">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono tracking-tighter text-white/40 group-hover/btn:text-[#8e84ad]">
              {post.comment_count}
            </span>
            {!isDetailView && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/10 group-hover/btn:text-[#8e84ad]/50 ml-1">
                View Thread
              </span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
