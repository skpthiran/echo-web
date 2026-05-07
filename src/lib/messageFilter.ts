import { ai } from './ai';

export type FilterVerdict = {
  allowed: boolean;
  severity: 'safe' | 'distress' | 'mild' | 'severe';
  message: string;
  shouldLock: boolean;
};

const HARMFUL_PATTERNS = [
  /\bkill\s+you\b/i,
  /\bi\s+will\s+hurt\b/i,
  /\bbitch\b/i,
  /\byour\s+address\s+is\b/i,
  /\bi\s+know\s+where\s+you\s+live\b/i,
  /n[i1]gg[e3]r/i,
  /\bf[a@]gg?[o0]ts?\b/i,
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
