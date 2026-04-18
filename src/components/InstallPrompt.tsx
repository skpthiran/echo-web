import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('echo-install-dismissed');
    
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('echo-install-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-20 left-4 right-4 z-[100] md:left-auto md:right-8 md:bottom-8 md:w-80"
        >
          <div className="bg-[#14151a]/90 backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 shadow-2xl relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-[#8e84ad]/10 blur-3xl rounded-full" />
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center border border-[rgba(255,255,255,0.05)] shadow-inner">
                <span className="font-outfit font-bold text-xl text-white">E</span>
              </div>
              
              <div className="flex-1">
                <h3 className="text-white font-medium text-sm mb-1">Install Echo</h3>
                <p className="text-[#e1e3ed]/60 text-xs leading-relaxed">
                  Add Echo to your home screen for a seamless, full-screen experience.
                </p>
                
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={handleInstall}
                    className="flex-1 bg-white text-black text-xs font-semibold py-2 px-4 rounded-lg hover:bg-[#e1e3ed] transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-3 h-3" />
                    Install
                  </button>
                </div>
              </div>

              <button 
                onClick={handleDismiss}
                className="p-1 text-[#e1e3ed]/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
