/// <reference types="@cloudflare/workers-types" />
import { createClient } from '@supabase/supabase-js'

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, encryptedVector } = await request.json() as { userId: string, encryptedVector: string };

    if (!userId || !encryptedVector) {
      return new Response(JSON.stringify({ error: 'Missing userId or encryptedVector' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Fetch all other encrypted vectors
    const { data: others, error } = await supabase
      .from('embeddings')
      .select('user_id, encrypted_vector')
      .neq('user_id', userId);

    if (error) throw error;
    if (!others || others.length === 0) {
      return new Response(JSON.stringify({ matches: [] }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Helper to decode mock FHE vector (base64 -> number[])
    const decodeVector = (base64: string): number[] => {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return Array.from(new Float32Array(bytes.buffer));
    };

    const targetVector = decodeVector(encryptedVector);

    // TODO: Replace with real Homomorphic Encryption dot-product computation
    // For now, we decode and compute in plaintext on the worker.
    const matches = others.map(other => {
      const otherVector = decodeVector(other.encrypted_vector);
      let score = 0;
      // Handle 768-dimensional vectors
      for (let i = 0; i < 768; i++) {
        score += targetVector[i] * (otherVector[i] || 0);
      }
      return {
        user_id: other.user_id,
        score: (score + 1) / 2 // Normalize -1..1 to 0..1
      };
    });

    // Sort and take top 3
    const topMatches = matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return new Response(JSON.stringify({ matches: topMatches }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error('Matching Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}
