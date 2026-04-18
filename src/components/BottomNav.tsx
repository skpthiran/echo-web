import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Rss, Activity, Sparkles, MessageCircle } from 'lucide-react'
import { motion } from 'motion/react'

export const BottomNav: React.FC = () => {
  const location = useLocation()
  const path = location.pathname

  const navItems = [
    { icon: Home, label: 'Home', route: '/' },
    { icon: Rss, label: 'Feed', route: '/feed' },
    { icon: Activity, label: 'Resonance', route: '/resonance' },
    { icon: Sparkles, label: 'Reflections', route: '/reflections' },
    { icon: MessageCircle, label: 'Chat', route: '/chat' }
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-white/5 z-50 px-6 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-between items-center h-16">
        {navItems.map((item) => {
          const isActive = path === item.route || (item.route !== '/' && path.startsWith(item.route))
          
          return (
            <Link
              key={item.route}
              to={item.route}
              className="flex flex-col items-center justify-center relative w-12"
            >
              <item.icon 
                className={`w-6 h-6 transition-all duration-300 ${
                  isActive ? 'text-indigo-400' : 'text-white/40'
                }`} 
              />
              <span className={`text-[10px] mt-1 font-medium transition-all duration-300 ${
                isActive ? 'text-indigo-400' : 'text-white/40'
              }`}>
                {item.label}
              </span>
              
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute -top-1 w-8 h-1 bg-indigo-500 rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
