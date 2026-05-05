import React, { useState } from 'react'
import { motion } from 'motion/react'
import { signIn, signUp } from '../lib/auth'
import { supabase } from '../lib/supabase'

export function AuthPage({ onEnter }: { onEnter: () => void }) {
  const [view, setView] = useState<'signin' | 'signup' | 'check-email'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      if (view === 'signup') {
        await signUp(email, password)
        setView('check-email')
      } else {
        await signIn(email, password)
        // Do nothing — App.tsx route guard will redirect automatically
        // once onAuthStateChange fires and sets the user
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendStatus('sending')
    try {
      const { error } = await supabase.auth.resend({ 
        type: 'signup', 
        email 
      })
      if (error) throw error
      setResendStatus('sent')
      setTimeout(() => setResendStatus('idle'), 3000)
    } catch (err: any) {
      setError(err.message)
      setResendStatus('idle')
    }
  }

  if (view === 'check-email') {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center"
        >
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white text-4xl font-serif mb-6 mx-auto shadow-xl shadow-purple-900/20">E</div>
          <h1 className="font-serif text-4xl tracking-[0.2em] text-white mb-2">ECHO</h1>
          <p className="text-sm text-[#e1e3ed]/40 tracking-widest uppercase mb-10">A sanctuary for thought</p>

          <h2 className="text-xl text-white mb-4">Check your inbox.</h2>
          <p className="text-[#e1e3ed]/60 mb-10 leading-relaxed text-sm">
            We've sent a confirmation link to <span className="text-indigo-400 font-medium">{email}</span>.
            Open it to activate your Echo account and begin your sanctuary.
          </p>

          <div className="flex flex-col gap-3">
            <a 
              href="https://mail.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-[#8e84ad] hover:bg-[#a096c4] text-white rounded-xl py-4 text-sm font-medium tracking-wide transition-all shadow-lg shadow-purple-900/10 active:scale-[0.98]"
            >
              Open Gmail →
            </a>
            <button 
              onClick={handleResend}
              disabled={resendStatus !== 'idle'}
              className="text-[#e1e3ed]/40 hover:text-white text-xs uppercase tracking-widest py-3 transition-colors"
            >
              {resendStatus === 'sending' ? 'Sending...' : resendStatus === 'sent' ? 'Confirmation Sent' : 'Check again'}
            </button>
            <button 
              onClick={() => setView('signup')}
              className="text-[#e1e3ed]/20 hover:text-[#e1e3ed]/40 text-xs mt-4 transition-colors"
            >
              Back to sign up
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-400/80 mt-6">{error}</p>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl tracking-widest text-white mb-2">ECHO</h1>
          <p className="text-sm text-[#e1e3ed]/40 tracking-widest uppercase">A sanctuary for thought</p>
        </div>

        <div className="flex bg-[#0d0d12] rounded-full border border-[rgba(255,255,255,0.06)] p-1 mb-8">
          {(['signin', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => setView(m)}
              className={`flex-1 py-2 rounded-full text-xs uppercase tracking-widest font-medium transition-all duration-300
                ${view === m ? 'bg-[rgba(255,255,255,0.06)] text-white' : 'text-[#e1e3ed]/40'}`}
            >
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="bg-[#0d0d12] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm text-[#e1e3ed] placeholder:text-[#e1e3ed]/30 outline-none focus:border-[#8e84ad]/50 transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="bg-[#0d0d12] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm text-[#e1e3ed] placeholder:text-[#e1e3ed]/30 outline-none focus:border-[#8e84ad]/50 transition-colors"
          />

          {error && (
            <p className="text-xs text-red-400/80 text-center">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-2 bg-[#8e84ad] hover:bg-[#a096c4] disabled:opacity-50 text-white rounded-xl py-3 text-sm font-medium tracking-wide transition-colors"
          >
            {loading ? '...' : view === 'signin' ? 'Enter Echo' : 'Create Account'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
