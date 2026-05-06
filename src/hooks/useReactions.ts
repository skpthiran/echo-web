import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export type ReactionType = 'resonate' | 'holding' | 'witnessed'

interface ReactionCounts {
  [key: string]: number
}

export function useReactions(postId: string) {
  const { user } = useAuth()
  const [counts, setCounts] = useState<ReactionCounts>({
    resonate: 0,
    holding: 0,
    witnessed: 0
  })
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchReactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reactions')
        .select('type, user_id')
        .eq('post_id', postId)

      if (error) throw error

      const newCounts: ReactionCounts = { resonate: 0, holding: 0, witnessed: 0 }
      let currentUserReaction: ReactionType | null = null

      data?.forEach(r => {
        newCounts[r.type] = (newCounts[r.type] || 0) + 1
        if (user && r.user_id === user.id) {
          currentUserReaction = r.type as ReactionType
        }
      })

      setCounts(newCounts)
      setUserReaction(currentUserReaction)
    } finally {
      setLoading(false)
    }
  }, [postId, user])

  useEffect(() => {
    fetchReactions()

    const channel = supabase
      .channel(`reactions:${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reactions',
        filter: `post_id=eq.${postId}`
      }, () => fetchReactions())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [postId, fetchReactions])

  const toggleReaction = async (type: ReactionType) => {
    if (!user) return

    try {
      // If clicking the same reaction, remove it
      if (userReaction === type) {
        await supabase
          .from('reactions')
          .delete()
          .match({ post_id: postId, user_id: user.id, type })
      } else {
        // If clicking a different reaction, we first delete any existing one for this user on this post
        // (Ensures one reaction per user)
        if (userReaction) {
          await supabase
            .from('reactions')
            .delete()
            .match({ post_id: postId, user_id: user.id })
        }
        
        await supabase
          .from('reactions')
          .insert({ post_id: postId, user_id: user.id, type })

        // Create notification for resonance
        if (type === 'resonate') {
          const { data: post } = await supabase
            .from('posts')
            .select('user_id')
            .eq('id', postId)
            .single()

          if (post && post.user_id && post.user_id !== user.id) {
            const { error: notifError } = await supabase.from('notifications').insert({
              user_id: post.user_id,
              type: 'resonance',
              message: 'Someone resonated with your thought.',
              post_id: postId,
              from_user_id: user.id
            })
            
            if (notifError) console.error('Notification failed:', notifError)
            else console.log('Notification recorded')
          }
        }
      }
      // fetchReactions will be triggered by the realtime subscription
    } catch (error) {
      console.error('Error toggling reaction:', error)
    }
  }

  return { counts, userReaction, loading, toggleReaction }
}
