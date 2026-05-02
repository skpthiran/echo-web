// ARCHITECTURE NOTE:
// The server receives STEER-transformed vectors, not raw embeddings.
// STEER applies a user-specific 768x768 linear transform (seeded from userId)
// that makes semantic reconstruction computationally hard without the seed.
// AES-GCM encrypted blobs are stored separately in Supabase for confidentiality.
// Designed for CKKS homomorphic swap-in: with real HE, the dot-product
// computation would run on ciphertexts server-side, eliminating even this
// trusted-server requirement.

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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    const { userId, steeredVector } = await request.json() as { userId: string, steeredVector: number[] };

    if (!userId || !steeredVector) {
      return new Response(JSON.stringify({ error: 'Missing userId or steeredVector' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // JWT Verification
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || user.id !== userId) {
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }

    // Fetch all other steered vectors
    const { data: others, error } = await supabase
      .from('embeddings')
      .select('user_id, steered_vector')
      .neq('user_id', userId);

    if (error) throw error;
    if (!others || others.length === 0) {
      return new Response(JSON.stringify({ matches: [] }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Compute cosine similarity on steered vectors
    const matches = others.map(other => {
      const otherVector = other.steered_vector;
      if (!otherVector || !Array.isArray(otherVector)) {
        return { user_id: other.user_id, score: 0 };
      }

      let dotProduct = 0;
      for (let i = 0; i < 768; i++) {
        dotProduct += steeredVector[i] * (otherVector[i] || 0);
      }
      
      return {
        user_id: other.user_id,
        score: (dotProduct + 1) / 2 // Normalize -1..1 to 0..1
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
