import React from 'react'
import { Bell, Search, PenLine } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
// import { useNotifications } from '../hooks/useNotifications'
// import { NotificationPanel } from './NotificationPanel'
import { AnimatePresence } from 'motion/react'

export const MobileHeader: React.FC = () => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  // const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  // const [showNotifications, setShowNotifications] = React.useState(false)

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 z-50 px-6 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-black text-xl italic tracking-tighter">E</span>
        </div>
        <h1 className="text-white font-bold tracking-[0.2em] text-sm font-outfit">ECHO</h1>
      </Link>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/search')}
          className="p-2 text-white/60 hover:text-white transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>

        <button 
          onClick={() => navigate('/write')}
          className="p-2 text-white/60 hover:text-white transition-colors"
        >
          <PenLine className="w-5 h-5" />
        </button>

        <div className="relative">
          <button 
            disabled
            className="relative p-2 text-white/20 cursor-not-allowed"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
        
        <button 
          onClick={() => navigate('/profile')} 
          className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        >
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              onError={(e) => { e.currentTarget.style.display='none'; }} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white text-xs font-medium">
              {profile?.username?.charAt(0).toUpperCase() ?? '?'}
            </div>
          )}
        </button>
      </div>
    </header>
  )
}
