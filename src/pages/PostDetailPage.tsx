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
        <div className="mb-12">
          {user ? (
            <div className="space-y-4">
              <textarea 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your resonance..."
                rows={3}
                className="w-full bg-[#111] border border-[#222] rounded-xl p-4 text-white resize-none focus:outline-none focus:border-purple-600 transition-colors placeholder:text-white/20 text-sm"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleAddComment}
                  disabled={submitting || !commentText.trim()}
                  className="px-6 py-2.5 bg-[#8e84ad] text-white text-sm font-bold rounded-full hover:bg-[#a59bc8] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {submitting ? 'Posting...' : 'Post Response'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#14151a] border border-dashed border-white/5 text-center">
              <p className="text-white/40 text-sm mb-4">Sign in to join the discussion.</p>
              <button 
                onClick={() => navigate('/auth')}
                className="px-6 py-2 bg-white text-black rounded-full font-bold text-xs hover:scale-95 transition-all"
              >
                Sign In
              </button>
            </div>
          )}
        </div>

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
