import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScanFace, ShieldCheck, AlertCircle } from 'lucide-react';
import { isVerified, startHumanCheck } from '../lib/didit';

interface HumanGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function HumanGate({ children, fallback }: HumanGateProps) {
  const [verified, setVerified] = useState(isVerified());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await startHumanCheck();
      if (result === 'verified') {
        setVerified(true);
      } else if (result === 'failed') {
        setError('Verification failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full p-8 rounded-3xl bg-[#14151a] border border-[rgba(255,255,255,0.05)] flex flex-col items-center text-center gap-6 relative overflow-hidden group"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(142,132,173,0.05)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center relative">
        <ScanFace className={`w-8 h-8 text-[#8e84ad] ${loading ? 'animate-pulse' : ''}`} />
        {loading && (
          <div className="absolute inset-0 border-2 border-[#8e84ad] border-t-transparent rounded-2xl animate-spin" />
        )}
      </div>

      <div className="space-y-2 relative z-10">
        <h3 className="text-lg font-medium text-white">Prove you're human</h3>
        <p className="text-sm text-[#e1e3ed]/40 max-w-[280px] mx-auto leading-relaxed">
          Echo uses a one-time face scan to keep the feed free from bots. No identity data is stored.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-[200px] relative z-10">
        <button
          onClick={handleVerify}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold text-sm hover:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] disabled:opacity-50"
        >
          {loading ? 'Verifying...' : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Verify with Didit
            </>
          )}
        </button>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-center gap-1.5 text-xs text-red-400"
            >
              <AlertCircle className="w-3 h-3" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
