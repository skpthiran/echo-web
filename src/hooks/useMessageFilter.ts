import { useState, useEffect, useRef, useCallback } from 'react';
import { FilterVerdict, analyzeMessage, getStrikes } from '../lib/messageFilter';

export function useMessageFilter(senderId: string, receiverId: string) {
  const [verdict, setVerdict] = useState<FilterVerdict | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const lastDistressText = useRef<string | null>(null);
  const pendingSendRef = useRef<(() => void) | null>(null);

  const conversationKey = `strikes:${[senderId, receiverId].sort().join(':')}`;

  useEffect(() => {
    if (senderId && receiverId) {
      const strikes = getStrikes(conversationKey);
      if (strikes >= 3) {
        setIsLocked(true);
      }
    }
  }, [conversationKey, senderId, receiverId]);

  const checkMessage = async (text: string, onAllowed?: () => void): Promise<boolean> => {
    // Distress bypass: same text re-submitted after "I'm okay, send anyway"
    if (lastDistressText.current === text) {
      lastDistressText.current = null;
      pendingSendRef.current = null;
      return true;
    }

    setIsChecking(true);
    try {
      const result = await analyzeMessage(text, conversationKey);
      setVerdict(result);

      if (result.shouldLock) {
        setIsLocked(true);
      }

      if (result.severity === 'distress') {
        lastDistressText.current = text;
        // Store the send callback so the banner can fire it directly
        pendingSendRef.current = onAllowed ?? null;
      } else {
        lastDistressText.current = null;
        pendingSendRef.current = null;
      }

      return result.allowed;
    } finally {
      setIsChecking(false);
    }
  };

  // Called when user clicks "I'm okay, send anyway" in the banner
  const dismissAndSend = useCallback(() => {
    setVerdict(null);
    const send = pendingSendRef.current;
    pendingSendRef.current = null;
    lastDistressText.current = null;
    if (send) send();
  }, []);

  // Called for "Edit message" — just clears the banner, no send
  const dismissWarning = useCallback(() => {
    setVerdict(null);
  }, []);

  return { checkMessage, dismissWarning, dismissAndSend, isChecking, verdict, isLocked };
}
