/**
 * FHE (Functional Homomorphic Encryption) Wrapper
 * Designed for CKKS swap-in when OpenFHE-WASM gains stable browser support.
 * Currently uses real AES-GCM for storage confidentiality.
 */

let fheKey: CryptoKey | null = null;
let isInitialized = false;

const KEY_ALIAS = 'echo_fhe_key';

/**
 * Safe conversion from Uint8Array to Base64 string
 * Avoids stack overflow issues with large arrays
 */
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary);
}

/**
 * Generates a new AES-GCM 256-bit key
 */
async function generateFHEKey(): Promise<CryptoKey> {
  const key = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  // Export and save to localStorage
  const exported = await window.crypto.subtle.exportKey('raw', key);
  const base64Key = uint8ToBase64(new Uint8Array(exported));
  localStorage.setItem(KEY_ALIAS, base64Key);
  
  return key;
}

/**
 * Initializes the FHE layer by loading or generating the AES key
 */
export async function initFHE(): Promise<void> {
  if (isInitialized) return;

  try {
    const savedKey = localStorage.getItem(KEY_ALIAS);
    if (savedKey) {
      const binaryKey = Uint8Array.from(atob(savedKey), c => c.charCodeAt(0));
      fheKey = await window.crypto.subtle.importKey(
        'raw',
        binaryKey,
        'AES-GCM',
        true,
        ['encrypt', 'decrypt']
      );
    } else {
      fheKey = await generateFHEKey();
    }
    isInitialized = true;
  } catch (error) {
    console.error('[FHE] Initialization failed:', error);
    throw error;
  }
}

/**
 * Encrypts a float array using AES-GCM and returns a base64 string.
 * Format: base64(iv + ciphertext)
 */
export async function encryptVector(vector: number[]): Promise<string> {
  if (!isInitialized || !fheKey) {
    throw new Error('FHE not initialized. Call initFHE() first.');
  }

  const data = new Float32Array(vector).buffer;
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    fheKey,
    data
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return uint8ToBase64(combined);
}

/**
 * Decrypts a base64-encoded AES-GCM string back to a float array.
 */
export async function decryptVector(ciphertext: string): Promise<number[]> {
  if (!isInitialized || !fheKey) {
    throw new Error('FHE not initialized. Call initFHE() first.');
  }

  const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    fheKey,
    data
  );

  return Array.from(new Float32Array(decrypted));
}

/**
 * Helper to check if FHE is initialized
 */
export function isFHEReady(): boolean {
  return isInitialized && fheKey !== null;
}
