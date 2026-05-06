import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ai } from '../lib/ai'
import { buildTransformMatrix, applySTEER } from '../lib/steer'
import { initFHE, encryptVector } from '../lib/fhe'

export interface ResonanceMatch {
  user_id: string
  username: string
  avatar_url: string | null
  similarity: number
}

export function useResonance(userId: string | undefined) {
  const { session } = useAuth()
  const [resonanceMatches, setResonanceMatches] = useState<ResonanceMatch[]>([])
  const [isComputing, setIsComputing] = useState(false)
  const [fheReady, setFheReady] = useState(false)

  // Initialize FHE once
  useEffect(() => {
    initFHE().then(() => setFheReady(true))
  }, [])

  const computeResonance = useCallback(async () => {
    if (!userId || !fheReady) return

    setIsComputing(true)
    try {
      // 1. Fetch user's profile context (recent thoughts)
      const { data: posts } = await supabase
        .from('posts')
        .select('content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3)

      const combinedText = posts?.map(p => p.content).join(' \n ') || ''
      if (!combinedText) {
        setResonanceMatches([])
        return
      }

      // 2. Generate Embedding via Cloud AI
      const rawVector = await ai.embed(combinedText)
      
      // 3. Apply Local STEER Transformation (768D)
      // This provides semantic anonymization before matching.
      const matrix = buildTransformMatrix(userId)
      const transformed = applySTEER(rawVector, matrix)

      // 4. Encrypt with AES-GCM for storage confidentiality
      // This ensures the server cannot read the stored vector without the client-side key.
      const encryptedBlob = await encryptVector(transformed)

      // 5. Upsert to embeddings table
      // We store the steered_vector for server-side matching and encrypted_blob for local retrieval.
      await supabase
        .from('embeddings')
        .upsert({
          user_id: userId,
          steered_vector: transformed,
          encrypted_blob: encryptedBlob,
          created_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      // 6. Match via Cloudflare Pages Function
      // We send the STEER-transformed vector (plaintext) for server-side similarity computation.
      // Retrieve session to provide Authorization token
      if (!session) throw new Error('No active session for resonance match.');

      const response = await fetch('/functions/resonance-match', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId, steeredVector: transformed })
      });

      if (!response.ok) throw new Error(`Worker match failed: ${response.statusText}`);
      
      const { matches: rawMatches } = await response.json() as { matches: { user_id: string, score: number }[] };

      // 7. Enrich matches with profile data
      const enrichedMatches: ResonanceMatch[] = []
      
      for (const match of rawMatches) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', match.user_id)
          .single()

        if (profile) {
          enrichedMatches.push({
            user_id: match.user_id,
            username: profile.username || 'Anonymous Echo',
            avatar_url: profile.avatar_url,
            similarity: match.score
          })
        }
      }

      setResonanceMatches(enrichedMatches)
    } catch (error) {
      console.error('Resonance computation failed:', error)
    } finally {
      setIsComputing(false)
    }
  }, [userId, fheReady, session])

  return { resonanceMatches, isComputing, computeResonance, fheReady }
}
