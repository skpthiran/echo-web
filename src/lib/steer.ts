import { encryptVector } from './fhe';

/**
 * STEER (Semantic Transformation for Encrypted Embedding Retrieval)
 * Applies a local, user-specific deterministic transformation to embeddings
 * to allow similarity matching without exposing raw semantic vectors.
 */

/**
 * Seeded PRNG (Mulberry32)
 */
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

/**
 * 32-bit left rotation helper
 */
function rotl32(x: number, r: number): number {
  return ((x << r) | (x >>> (32 - r))) >>> 0;
}

/**
 * Generates a stable hash num from a string (user_id)
 */
function cyrb128(str: string): number[] {
  let h1 = 1779033703, h2 = 3144134277,
      h3 = 1013904242, h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

/**
 * Builds a deterministic 768x768 transformation matrix seeded from userId
 */
export function buildTransformMatrix(seed: string): number[][] {
  const seeds = cyrb128(seed);
  // Combine all 4 outputs of cyrb128 into a stronger 32-bit seed
  const combined = (seeds[0] ^ rotl32(seeds[1], 7) ^
                    rotl32(seeds[2], 13) ^ rotl32(seeds[3], 19)) >>> 0;
  const rand = mulberry32(combined);
  const matrix: number[][] = [];
  
  for (let i = 0; i < 768; i++) {
    const row: number[] = [];
    for (let j = 0; j < 768; j++) {
      // Generate values between -1 and 1
      row.push(rand() * 2 - 1);
    }
    matrix.push(row);
  }
  return matrix;
}

/**
 * Applies the STEER transformation (v' = T · v)
 */
export function applySTEER(vector: number[], matrix: number[][]): number[] {
  const result: number[] = new Array(768).fill(0);
  
  for (let i = 0; i < 768; i++) {
    for (let j = 0; j < 768; j++) {
      result[i] += matrix[i][j] * vector[j];
    }
  }
  
  // Re-normalize for consistency
  const magnitude = Math.sqrt(result.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return result;
  
  return result.map(val => val / magnitude);
}

/**
 * Applies STEER and then encrypts the vector using FHE.
 * Safety guard: ensures FHE is initialized before encryption.
 */
export async function encryptedSTEERVector(
  vector: number[],
  matrix: number[][]
): Promise<string> {
  await initFHE();
  const transformed = applySTEER(vector, matrix);
  return encryptVector(transformed);
}
