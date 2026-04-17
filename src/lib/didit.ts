/**
 * Didit Client Wrapper
 * Implements a mock for biometric human verification since SDK is unavailable.
 */

let isInitialized = false;

export function initDidit(clientId: string): void {
  if (isInitialized) return;
  console.log(`[Didit] Initialized in mock mode with Client ID: ${clientId}`);
  isInitialized = true;
}

export async function startHumanCheck(): Promise<'verified' | 'failed' | 'cancelled'> {
  console.log('[Didit] Launching face scan flow (mock)');
  
  // Simulate network/processing delay
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('[Didit] Face scan successful');
      sessionStorage.setItem('didit_verification_token', 'mock_token_' + Date.now());
      resolve('verified');
    }, 1500);
  });
}

export function isVerified(): boolean {
  return !!sessionStorage.getItem('didit_verification_token');
}
