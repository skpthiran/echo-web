import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Notification } from '../lib/types'
import { useAuth } from '../context/AuthContext'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*, from_profile:profiles!from_user_id(username, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    setNotifications((data as any) || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchNotifications()

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => { 
      supabase.removeChannel(channel) 
    }
  }, [user, fetchNotifications])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const markRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    }
  }

  const markAllRead = async () => {
    if (!user) return
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    }
  }

  return { notifications, unreadCount, loading, markRead, markAllRead }
}
