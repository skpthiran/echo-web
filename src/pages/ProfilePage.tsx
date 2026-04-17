import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Camera, Check, X, Loader2, ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { PostRow } from '../lib/types';

const ITEMS_PER_PAGE = 10;

export function ProfilePage() {
  const { user } = useAuth();
  const { profile, refreshProfile } = useProfile();
  
  // Profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Posts state
  const [userPosts, setUserPosts] = useState<PostRow[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'my' | 'saved'>('my');

  useEffect(() => {
    if (profile) {
      setEditName(profile.username || '');
      setEditBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  useEffect(() => {
    fetchUserPosts();
  }, [user, currentPage]);

  const fetchUserPosts = async () => {
    if (!user) return;
    setLoadingPosts(true);

    // Get count
    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    setTotalCount(count || 0);

    // Get page
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

    if (!error && data) {
      setUserPosts(data);
    }
    setLoadingPosts(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setStatusMessage(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        username: editName,
        bio: editBio,
        avatar_url: avatarUrl,
      })
      .eq('id', user.id);

    if (error) {
      setStatusMessage({ type: 'error', text: 'Update failed' });
    } else {
      setStatusMessage({ type: 'success', text: 'Profile updated' });
      await refreshProfile();
      setTimeout(() => {
        setIsEditing(false);
        setStatusMessage(null);
      }, 2000);
    }
    setSaving(false);
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Delete this thought? This cannot be undone.')) return;

    // Optimistic update
    const previousPosts = [...userPosts];
    setUserPosts(userPosts.filter(p => p.id !== postId));

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user?.id);

    if (error) {
      alert('Failed to delete post');
      setUserPosts(previousPosts);
    } else {
      // Logic for toast could go here if needed, but the prompt says 2 seconds inline
      // For now, simple removal is enough. 
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-24">
      <div className="w-full max-w-4xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="flex flex-col items-center justify-center text-center mb-16 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#446475] rounded-full mix-blend-screen filter blur-[100px] opacity-[0.15] pointer-events-none" />
          
          <div className="relative group mb-6 z-10">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-32 h-32 rounded-full overflow-hidden border border-[rgba(255,255,255,0.1)] shadow-[0_0_40px_rgba(255,255,255,0.05)] bg-[#0a0b12]"
            >
              <img 
                src={avatarUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${user?.id}`} 
                alt="Me" 
                className={`w-full h-full object-cover ${uploading ? 'opacity-30' : ''}`}
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </motion.div>
            
            {isEditing && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
              </label>
            )}
          </div>

          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div
                key="view-mode"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center relative z-10"
              >
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="font-serif text-3xl md:text-4xl font-light text-white">
                    {profile?.username || 'Echo User'}
                  </h1>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-[#e1e3ed]/60 text-lg font-light max-w-lg mb-8 italic">
                  "{profile?.bio || 'Silent observer of the human wavelength.'}"
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="edit-mode"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full max-w-sm flex flex-col items-center gap-4 relative z-10"
              >
                <input 
                  type="text"
                  maxLength={50}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Display Name"
                  className="w-full bg-[#14151a] border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#8e84ad] transition-colors"
                />
                <textarea 
                  maxLength={200}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell the collective something about your wavelength..."
                  className="w-full h-24 bg-[#14151a] border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#8e84ad] transition-colors resize-none"
                />
                
                <div className="flex gap-4 w-full mt-2">
                  <button 
                    onClick={handleSave}
                    disabled={saving || uploading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-[#e1e3ed] transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Changes
                  </button>
                  <button 
                    onClick={() => { setIsEditing(false); setStatusMessage(null); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>

                {statusMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 text-sm font-medium ${statusMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {statusMessage.text}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
             className="flex items-center gap-8 text-center relative z-10 border-t border-[rgba(255,255,255,0.05)] pt-8 w-full justify-center max-w-sm mt-8"
          >
             <div>
                <div className="text-[10px] uppercase tracking-widest text-[#e1e3ed]/40 mb-2">Streaks</div>
                <div className="font-serif text-2xl text-white font-light">{profile?.streak || 0}</div>
             </div>
             <div>
                <div className="text-[10px] uppercase tracking-widest text-[#e1e3ed]/40 mb-2">Reputation</div>
                <div className="font-serif text-2xl text-white font-light">{profile?.reputation_score || 0}</div>
             </div>
             <div>
                <div className="text-[10px] uppercase tracking-widest text-[#e1e3ed]/40 mb-2">Thoughts</div>
                <div className="font-serif text-2xl text-white font-light">{totalCount}</div>
             </div>
          </motion.div>
        </div>

        {/* Content Tabs */}
        <div className="my-12 flex justify-center">
          <div className="inline-flex p-1 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-full">
            <button 
              onClick={() => setActiveTab('my')}
              className={`px-6 py-2 rounded-full text-xs font-medium uppercase tracking-widest transition-all ${activeTab === 'my' ? 'bg-white text-black' : 'text-[#e1e3ed]/40 hover:text-white'}`}
            >
              Your Published Thoughts
            </button>
            <button 
              onClick={() => setActiveTab('saved')}
              className={`px-6 py-2 rounded-full text-xs font-medium uppercase tracking-widest transition-all ${activeTab === 'saved' ? 'bg-white text-black' : 'text-[#e1e3ed]/40 hover:text-white'}`}
            >
              Saved Echoes
            </button>
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-6">
          {activeTab === 'my' ? (
            <>
              {loadingPosts ? (
                <p className="text-center text-white/20 italic font-serif">Loading your echoes...</p>
              ) : userPosts.length > 0 ? (
                <div className="space-y-4">
                  {userPosts.map((thought, i) => (
                    <motion.div
                      key={thought.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group relative p-6 bg-[#0a0b12] border border-white/5 rounded-2xl hover:border-white/10 transition-all"
                    >
                      <button 
                        onClick={() => handleDeletePost(thought.id)}
                        className="absolute top-4 right-4 p-2 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-3 mb-4">
                        <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                          <span className="text-[10px] uppercase tracking-widest text-white/60">{thought.mood || 'Quiet'}</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-white/20">
                          {new Date(thought.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <p className="text-[#e1e3ed]/80 font-light leading-relaxed line-clamp-3 italic">
                        "{thought.content.slice(0, 120)}..."
                      </p>
                    </motion.div>
                  ))}

                  {/* Pagination */}
                  {totalCount > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-center gap-4 mt-12 pt-8 border-t border-white/5">
                      <button 
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white disabled:opacity-20 transition-all"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-xs font-mono text-white/40 uppercase tracking-widest">
                        Page {currentPage + 1} of {Math.ceil(totalCount / ITEMS_PER_PAGE)}
                      </span>
                      <button 
                        disabled={(currentPage + 1) * ITEMS_PER_PAGE >= totalCount}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white disabled:opacity-20 transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-white/20 italic font-serif py-12">You haven't shared any thoughts yet.</p>
              )}
            </>
          ) : (
            <p className="text-center text-white/20 italic font-serif py-12">Saved echoes feature coming soon.</p>
          )}
        </div>
      </div>
    </div>
  );
}
