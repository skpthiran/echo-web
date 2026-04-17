import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Post, Comment } from '../lib/types';
import { PostCard } from '../components/PostCard';
import { CommentItem } from '../components/CommentItem';
import { useComments } from '../hooks/useComments';
import { useAuth } from '../context/AuthContext';
import { HumanGate } from '../components/HumanGate';

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [postLoading, setPostLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  
  const { comments, loading: commentsLoading, submitting, addComment } = useComments(postId || '');

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      setPostLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles(username, avatar_url),
          reactions(type),
          comments(count)
        `)
        .eq('id', postId)
        .single() as any;

      if (error) {
        console.error('Error fetching post:', error);
        navigate('/feed');
        return;
      }

      // Aggregate reactions
      const reactionCounts = (data.reactions || []).reduce((acc: any, r: any) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      }, {});

      setPost({
        ...data,
        profiles: data.profiles,
        reactions: Object.entries(reactionCounts).map(([type, count]) => ({ type, count: count as number })),
        comment_count: data.comments?.[0]?.count ?? 0
      });
      setPostLoading(false);
    };

    fetchPost();
  }, [postId, navigate]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await addComment(commentText);
    setCommentText('');
  };

  // Group comments into threads (one level deep)
  const topLevelComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  if (postLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050508]">
        <div className="w-8 h-8 border-2 border-[#8e84ad]/20 border-t-[#8e84ad] rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-[#050508] pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center gap-4 px-6 h-16 bg-[#050508]/80 backdrop-blur-md border-b border-[rgba(255,255,255,0.05)]">
        <button 
          onClick={() => navigate('/feed')}
          className="p-2 -ml-2 rounded-full hover:bg-white/5 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-medium uppercase tracking-widest text-white/90">Post Thread</h2>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Main Post */}
        <div className="mb-12">
          <PostCard post={post} onReactionUpdate={() => {}} />
        </div>

        {/* Comment Section Header */}
        <div className="flex items-center gap-3 mb-8 text-white/40">
          <MessageSquare className="w-4 h-4" />
          <h3 className="text-xs font-semibold uppercase tracking-widest">
            {comments.length} Discussion{comments.length !== 1 ? 's' : ''}
          </h3>
        </div>

        {/* Comment Input */}
        {user && (
          <div className="mb-12">
            <HumanGate fallback={<div className="p-8 rounded-2xl bg-[#14151a] border border-dashed border-white/5 text-center text-white/20 text-xs italic">A face scan is required to join the discussion.</div>}>
              <div className="flex bg-[#14151a] rounded-2xl border border-[rgba(255,255,255,0.05)] p-3 gap-3 focus-within:border-[rgba(142,132,173,0.3)] transition-all">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add to the resonance..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-white/80 px-4 placeholder:text-white/20"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button
                  onClick={handleAddComment}
                  disabled={submitting || !commentText.trim()}
                  className="px-4 py-2 bg-[#8e84ad] text-white text-xs font-bold rounded-xl hover:bg-[#a59bc8] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {submitting ? 'Sending...' : (
                    <>Send <Send className="w-3 h-3" /></>
                  )}
                </button>
              </div>
            </HumanGate>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-2">
          {commentsLoading ? (
            <div className="py-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-[#8e84ad]/10 border-t-[#8e84ad] rounded-full animate-spin" />
            </div>
          ) : topLevelComments.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {topLevelComments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <CommentItem 
                    comment={comment} 
                    replies={getReplies(comment.id)}
                    onReply={async (content, pId) => { await addComment(content, pId); }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-white/20 italic">No one has spoken yet. Be the first to resonate.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
