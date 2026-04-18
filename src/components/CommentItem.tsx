import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Reply, Send, CornerDownRight } from 'lucide-react';
import { Comment } from '../lib/types';

interface CommentItemProps {
  comment: Comment;
  replies?: Comment[];
  onReply: (content: string, parentId: string) => Promise<void>;
  isReply?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, replies = [], onReply, isReply = false }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    try {
      await onReply(replyContent, comment.id);
      setReplyContent('');
      setIsReplying(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`group ${isReply ? 'ml-8 mt-4 border-l-2 border-[rgba(142,132,173,0.1)] pl-6' : 'mb-8'}`}>
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          {comment.profiles.avatar_url ? (
            <img 
              src={comment.profiles.avatar_url} 
              alt={comment.profiles.username}
              onError={(e) => { e.currentTarget.style.display='none'; }}
              className="w-8 h-8 rounded-full object-cover border border-white/10"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold border border-white/10">
              {comment.profiles.username?.charAt(0).toUpperCase() ?? '?'}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white/90">
              {comment.profiles.username}
            </span>
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">
              {formatDistanceToNow(new Date(comment.created_at))} ago
            </span>
          </div>
          
          <p className="text-sm text-white/70 leading-relaxed mb-3">
            {comment.content}
          </p>
          
          {!isReply && (
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-1.5 text-[10px] font-semibold text-[#8e84ad] hover:text-[#a59bc8] transition-colors uppercase tracking-widest"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>
          )}

          <AnimatePresence>
            {isReplying && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="flex bg-[#1a1b23] rounded-xl border border-[rgba(255,255,255,0.05)] p-2 gap-2">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-white/80 px-3 placeholder:text-white/20"
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitReply()}
                  />
                  <button
                    onClick={handleSubmitReply}
                    disabled={isSubmitting || !replyContent.trim()}
                    className="p-2 text-[#8e84ad] hover:text-white transition-colors disabled:opacity-30"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Render Replies */}
      {replies.length > 0 && (
        <div className="mt-2">
          {replies.map((reply) => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              onReply={onReply} 
              isReply={true} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
