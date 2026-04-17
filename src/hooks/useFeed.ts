import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Post } from '../lib/types'
import { useAuth } from '../context/AuthContext'

export function useFeed() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles(username, avatar_url),
          reactions(type),
          comments(count)
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      if (fetchError) throw fetchError

      const formatted: Post[] = (data || []).map((p: any) => {
        const reactionCounts = (p.reactions || []).reduce((acc: any, r: any) => {
          acc[r.type] = (acc[r.type] || 0) + 1
          return acc
        }, {})

        return {
          ...p,
          profiles: p.profiles || { username: 'Anonymous Echo', avatar_url: null },
          reactions: Object.entries(reactionCounts).map(([type, count]) => ({ type, count: count as number })),
          comment_count: p.comments?.[0]?.count ?? 0
        }
      })

      setPosts(formatted)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching feed:', err)
      setError(err.message || 'Failed to load feed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()

    // Real-time subscription for posts, reactions, and comments
    const channel = supabase
      .channel('feed_global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => fetchPosts())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchPosts, user])

  return { posts, loading, error, refetch: fetchPosts }
}
