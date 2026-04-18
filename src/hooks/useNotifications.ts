import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface Notification {
  id: string
  user_id: string
  type: string
  message: string
  post_id: string | null
  from_user_id: string | null
  is_read: boolean
  created_at: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setLoading(true)
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) throw error

        const safe = data ?? []
        setNotifications(safe)
        setUnreadCount(safe.filter(n => !n.is_read).length)

        channel = supabase
          .channel(`notifications:${user.id}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          }, payload => {
            setNotifications(prev => [payload.new as Notification, ...prev])
            setUnreadCount(prev => prev + 1)
          })
          .subscribe()

      } catch (err) {
        console.error('useNotifications error:', err)
        setNotifications([])
        setUnreadCount(0)
      } finally {
        setLoading(false)
      }
    }

    init()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const markAllRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('markAllRead error:', err)
    }
  }

  const markRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('markRead error:', err)
    }
  }

  return { notifications, unreadCount, loading, markAllRead, markRead }
}
