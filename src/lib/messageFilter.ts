import { ai } from './ai';

export type FilterVerdict = {
  allowed: boolean;
  severity: 'safe' | 'distress' | 'mild' | 'severe';
  message: string;
  shouldLock: boolean;
};

const HARMFUL_PATTERNS = [
  /kill you/i,
  /i will hurt/i,
  /(?:bitch.*){3,}/i,
  /your address is/i,
  /i know where you live/i,
  /n[i1]gg[e3]r/i,
  /f[a@]g/i
];

export function quickFilter(text: string): boolean {
  return HARMFUL_PATTERNS.some(pattern => pattern.test(text));
}

export function getStrikes(conversationKey: string): number {
  const strikes = sessionStorage.getItem(conversationKey);
  return strikes ? parseInt(strikes, 10) : 0;
}

export function addStrike(conversationKey: string): number {
  const current = getStrikes(conversationKey);
  const next = current + 1;
  sessionStorage.setItem(conversationKey, next.toString());
  return next;
}

export function resetStrikes(conversationKey: string): void {
  sessionStorage.removeItem(conversationKey);
}

export async function analyzeMessage(text: string, conversationKey: string): Promise<FilterVerdict> {
  if (text.trim().length === 0) {
    return { allowed: true, severity: 'safe', message: '', shouldLock: false };
  }

  if (quickFilter(text)) {
    const strikes = addStrike(conversationKey);
    if (strikes >= 3) {
      return { allowed: false, severity: 'severe', message: 'Your chat has been locked due to repeated violations.', shouldLock: true };
    }
    return { allowed: false, severity: 'severe', message: `This message violates community guidelines. Strike ${strikes}/3.`, shouldLock: false };
  }

  const result = await ai.moderate(text);

  if (result === 'safe') {
    return { allowed: true, severity: 'safe', message: '', shouldLock: false };
  }

  if (result === 'distress') {
    return { 
      allowed: false, 
      severity: 'distress', 
      message: 'It sounds like you may be going through something difficult. We want to make sure you\'re safe.', 
      shouldLock: false 
    };
  }

  const strikes = addStrike(conversationKey);
  if (strikes < 3) {
    return { 
      allowed: false, 
      severity: 'mild', 
      message: `Please keep conversations respectful. Strike ${strikes}/3.`, 
      shouldLock: false 
    };
  }

  return { allowed: false, severity: 'severe', message: 'Chat locked: three violations recorded.', shouldLock: true };
}
