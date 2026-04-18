import React from 'react'
import { Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export const MobileHeader: React.FC = () => {
  const { user, profile } = useAuth()

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 z-50 px-6 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-black text-xl italic tracking-tighter">E</span>
        </div>
        <h1 className="text-white font-bold tracking-[0.2em] text-sm font-outfit">ECHO</h1>
      </Link>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-white/60 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#0a0a0a]" />
        </button>
        
        <Link to="/profile" className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {profile?.username?.charAt(0).toUpperCase() ?? '?'}
            </div>
          )}
        </Link>
      </div>
    </header>
  )
}
