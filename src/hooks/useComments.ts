import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Comment } from '../lib/types'
import { useAuth } from '../context/AuthContext'

export function useComments(postId: string) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(id, username, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    
    setComments(data || [])
    setLoading(false)
  }, [postId])

  useEffect(() => {
    fetchComments()

    const channel = supabase
      .channel(`comments:${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          fetchComments()
        } else if (payload.eventType === 'DELETE') {
          setComments(prev => prev.filter(c => c.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [postId, fetchComments])

  const addComment = async (content: string, parentId: string | null = null) => {
    if (!user || !content.trim()) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId
      })
      if (error) throw error

      // Notify post owner
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single()

      if (post && post.user_id && post.user_id !== user.id) {
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: post.user_id,
          type: 'comment',
          message: 'Someone commented on your thought.',
          post_id: postId,
          from_user_id: user.id
        })
        
        if (notifError) console.error('Notification failed:', notifError)
        else console.log('Notification recorded')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return { comments, loading, submitting, addComment }
}
