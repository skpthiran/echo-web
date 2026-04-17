import React, { useState } from 'react'
import { motion } from 'motion/react'
import { signIn, signUp } from '../lib/auth'

export function AuthPage({ onEnter }: { onEnter: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }
      onEnter()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-full text-xs uppercase tracking-widest font-medium transition-all duration-300
                ${mode === m ? 'bg-[rgba(255,255,255,0.06)] text-white' : 'text-[#e1e3ed]/40'}`}
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
            {loading ? '...' : mode === 'signin' ? 'Enter Echo' : 'Create Account'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
