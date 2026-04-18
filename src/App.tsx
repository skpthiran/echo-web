import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AuthPage } from './pages/AuthPage'
import { AppShell } from './pages/AppShell'
import { OnboardingPage } from './pages/OnboardingPage'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="font-serif text-xl tracking-widest text-white/20">ECHO</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route 
        path="/auth" 
        element={!user ? <AuthPage onEnter={() => {}} /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/onboarding" 
        element={user ? <OnboardingPage /> : <Navigate to="/auth" replace />} 
      />
      <Route 
        path="/*" 
        element={user ? <AppShell onLogout={() => {}} /> : <Navigate to="/auth" replace />} 
      />
    </Routes>
  )
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}
