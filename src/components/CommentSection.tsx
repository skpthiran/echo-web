import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Send } from 'lucide-react'
import { useComments } from '../hooks/useComments'
import { useAuth } from '../context/AuthContext'

export function CommentSection({ postId, isOpen }: { postId: string; isOpen: boolean }) {
  const { user } = useAuth()
  const { comments, loading, submitting, addComment } = useComments(postId)
  const [text, setText] = useState('')

  const handleSend = async () => {
    if (!text.trim()) return
    await addComment(text)
    setText('')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="mt-4 rounded-xl bg-[#0a0a0f] border border-[rgba(255,255,255,0.05)] p-4 flex flex-col gap-3">
            {loading ? (
              <p className="text-xs text-[#e1e3ed]/20 text-center py-2">Listening...</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-[#e1e3ed]/20 text-center py-2">No echoes yet. Be the first.</p>
            ) : (
              <div className="flex flex-col gap-3 max-h-48 overflow-y-auto">
                {comments.map(comment => (
                  <div key={comment.id} className="flex flex-col gap-0.5">
                    <span className="text-xs text-[#8e84ad] font-medium">
                      {(comment as any).profiles?.username || 'Anonymous'}
                    </span>
                    <p className="text-sm text-[#e1e3ed]/70 leading-relaxed">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}

            {user && (
              <div className="flex gap-2 pt-2 border-t border-[rgba(255,255,255,0.05)]">
                <input
                  type="text"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Add your echo..."
                  className="flex-1 bg-transparent text-sm text-[#e1e3ed] placeholder:text-[#e1e3ed]/20 outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={submitting || !text.trim()}
                  className="text-[#8e84ad] hover:text-white disabled:opacity-30 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
