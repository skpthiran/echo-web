import { useState, useEffect, useRef } from 'react';
import { FilterVerdict, analyzeMessage, getStrikes } from '../lib/messageFilter';

export function useMessageFilter(senderId: string, receiverId: string) {
  const [verdict, setVerdict] = useState<FilterVerdict | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const lastDistressText = useRef<string | null>(null);

  const conversationKey = `strikes:${[senderId, receiverId].sort().join(':')}`;

  useEffect(() => {
    if (senderId && receiverId) {
      const strikes = getStrikes(conversationKey);
      if (strikes >= 3) {
        setIsLocked(true);
      }
    }
  }, [conversationKey, senderId, receiverId]);

  const checkMessage = async (text: string): Promise<boolean> => {
    if (lastDistressText.current === text) {
      lastDistressText.current = null;
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
      } else {
        lastDistressText.current = null;
      }
      
      return result.allowed;
    } finally {
      setIsChecking(false);
    }
  };

  const dismissWarning = () => {
    setVerdict(null);
  };

  return { checkMessage, dismissWarning, isChecking, verdict, isLocked };
}
