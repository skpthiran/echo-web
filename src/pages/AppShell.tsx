import React from 'react';
import { 
  Home, Edit3, Compass, Activity, Users, Aperture, 
  MessageSquare, User, Settings, Bell, Search, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../context/AuthContext';

// Page components
import { HomeDashboard } from './HomeDashboard';
import { WritePage } from './WritePage';
import { FeedPage } from './FeedPage';
import { ResonancePage } from './ResonancePage';
import { MatchesPage } from './MatchesPage';
import { ReflectionsPage } from './ReflectionsPage';
import { ChatPage } from './ChatPage';
import { ProfilePage } from './ProfilePage';
import { SettingsPage } from './SettingsPage';
import { PostDetailPage } from './PostDetailPage';
import { MobileHeader } from '../components/MobileHeader';
import { BottomNav } from '../components/BottomNav';
import { SearchPage } from './SearchPage';
import { InstallPrompt } from '../components/InstallPrompt';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationPanel } from '../components/NotificationPanel';

export type PageId = 'home' | 'write' | 'feed' | 'resonance' | 'matches' | 'reflections' | 'chat' | 'profile' | 'settings';

export function AppShell({ onLogout: ignoredOnLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [showNotifications, setShowNotifications] = React.useState(false);

  React.useEffect(() => {
    // Only redirect if profile is loaded, not completed, and we aren't already on onboarding
    if (!profileLoading && profile && profile.onboarding_complete === false && location.pathname !== '/onboarding') {
      navigate('/onboarding');
    }
  }, [profile, profileLoading, navigate, location.pathname]);

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#8e84ad]/20 border-t-[#8e84ad] rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'write', label: 'Write', icon: Edit3, path: '/write' },
    { id: 'feed', label: 'Feed', icon: Compass, path: '/feed' },
    { id: 'resonance', label: 'Resonance', icon: Activity, path: '/resonance' },
    { id: 'matches', label: 'Matches', icon: Users, path: '/matches' },
    { id: 'reflections', label: 'Reflections', icon: Aperture, path: '/reflections' },
    { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/chat' },
  ];

  const bottomNavItems = [
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const currentPath = location.pathname;

  return (
    <div className="flex h-screen bg-[#050508] text-[#e1e3ed] overflow-hidden selection:bg-[#8e84ad] selection:text-white">
      {/* Sidebar background noise */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      <MobileHeader />

      {/* Sidebar Navigation - Hidden on Mobile */}
      <nav className="relative z-20 w-20 lg:w-64 hidden md:flex flex-col border-r border-[rgba(255,255,255,0.05)] bg-[#050508]/80 backdrop-blur-xl">
        <div className="h-20 flex items-center justify-center lg:justify-start lg:px-8 border-b border-[rgba(255,255,255,0.05)]">
          <div className="font-outfit font-bold text-xl tracking-widest text-white">ECHO</div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 lg:px-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group
                  ${isActive ? 'text-white' : 'text-[#e1e3ed]/50 hover:text-[#e1e3ed]/80 hover:bg-[rgba(255,255,255,0.02)]'}`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-nav-pill"
                    className="absolute inset-0 bg-[rgba(255,255,255,0.04)] rounded-xl border border-[rgba(255,255,255,0.05)]"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-[#8e84ad] rounded-r-full shadow-[0_0_10px_rgba(142,132,173,0.5)]" />
                )}
                <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-[#e1e3ed]' : ''}`} />
                <span className="hidden lg:block relative z-10 text-sm font-medium tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-3 lg:px-4 pb-6 border-t border-[rgba(255,255,255,0.05)] flex flex-col gap-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300
                  ${isActive ? 'text-white bg-[rgba(255,255,255,0.04)]' : 'text-[#e1e3ed]/50 hover:text-[#e1e3ed]/80 hover:bg-[rgba(255,255,255,0.02)]'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden lg:block text-sm font-medium tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        {/* Top Bar - Hidden on Mobile */}
        <header className="h-20 flex-shrink-0 border-b border-[rgba(255,255,255,0.05)] bg-[#050508]/60 backdrop-blur-md px-8 hidden md:flex items-center justify-between z-20">
          <div className="flex bg-[#14151a] rounded-full border border-[rgba(255,255,255,0.05)] px-4 py-2 w-full max-w-sm items-center gap-3">
            <Search className="w-4 h-4 text-[#e1e3ed]/40" />
            <input 
              type="text" 
              placeholder="Search thoughts, feelings, patterns..." 
              className="bg-transparent border-none outline-none text-sm text-[#e1e3ed] placeholder:text-[#e1e3ed]/30 w-full"
              onFocus={() => navigate('/search')}
              onChange={(e) => navigate(`/search?q=${e.target.value}`)}
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-xs font-medium text-[#e1e3ed]/60 uppercase tracking-widest border-r border-[rgba(255,255,255,0.1)] pr-6">
              <span className="text-[#8e84ad]">Today feels like:</span>
              <span className="text-[#e1e3ed]">Quiet</span>
            </div>
            
            <div className="flex items-center gap-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-full pl-3 pr-4 py-1.5 hidden sm:flex" title="Reputation Score">
              <Flame className="w-4 h-4 text-[#b08d97]" />
              <span className="text-sm font-mono text-[#e1e3ed]/80">{profile?.reputation_score ?? 0}</span>
              <span className="text-[10px] text-[#e1e3ed]/40 uppercase tracking-tighter ml-1">rep</span>
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer"
              >
                <Bell className="w-5 h-5 text-[#e1e3ed]/70" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-purple-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center border border-[#050508] shadow-[0_0_10px_rgba(142,132,173,0.5)]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <NotificationPanel 
                    notifications={notifications}
                    onMarkRead={markRead}
                    onMarkAllRead={markAllRead}
                    onClose={() => setShowNotifications(false)}
                  />
                )}
              </AnimatePresence>
            </div>

            <button onClick={() => navigate('/profile')} className="w-9 h-9 rounded-full overflow-hidden border border-[rgba(255,255,255,0.1)] transition-transform hover:scale-105">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  onError={(e) => { e.currentTarget.style.display='none'; }} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white text-sm font-medium">
                  {profile?.username?.charAt(0).toUpperCase() ?? '?'}
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto relative scroll-smooth pt-16 md:pt-0 pb-20 md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="min-h-full"
            >
              <Routes>
                <Route path="/" element={<HomeDashboard onNavigate={(page) => navigate(`/${page}`)} />} />
                <Route path="/write" element={<WritePage onNavigate={(page) => navigate(`/${page}`)} />} />
                <Route path="/feed" element={<FeedPage />} />
                <Route path="/feed/:postId" element={<PostDetailPage />} />
                <Route path="/resonance" element={<ResonancePage />} />
                <Route path="/matches" element={<MatchesPage onNavigate={(page) => navigate(`/${page}`)} />} />
                <Route path="/reflections" element={<ReflectionsPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/settings" element={<SettingsPage onLogout={signOut} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <InstallPrompt />
      <BottomNav />
    </div>
  );
}
