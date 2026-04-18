import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  bio: string | null
  reputation_score: number
  onboarding_intent: string | null
  onboarding_complete: boolean
}

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchProfile()
  }, [user])

  return { profile, loading, refreshProfile: fetchProfile }
}
