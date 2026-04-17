import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useCreatePost() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createPost = async (content: string, mood: string) => {
    if (!user) throw new Error('Not authenticated')
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content,
          mood,
          is_anonymous: true
        })
      if (error) throw error
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createPost, loading, error }
}
