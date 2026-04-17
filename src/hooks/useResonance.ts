import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ai } from '../lib/ai'
import { buildTransformMatrix } from '../lib/steer'
import { initFHE, encryptVector } from '../lib/fhe'

export interface ResonanceMatch {
  user_id: string
  username: string
  avatar_url: string | null
  similarity: number
}

export function useResonance(userId: string | undefined) {
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
      const matrix = buildTransformMatrix(userId)
      const transformed = new Array(768).fill(0);
      for (let i = 0; i < 768; i++) {
        for (let j = 0; j < 768; j++) {
          transformed[i] += matrix[i][j] * rawVector[j];
        }
      }

      // Normalize transformed vector
      const mag = Math.sqrt(transformed.reduce((s, v) => s + v * v, 0));
      const normalizedTransformed = transformed.map(v => (mag === 0 ? 0 : v / mag));

      // 4. Encrypt with FHE
      const ciphertext = encryptVector(normalizedTransformed)

      // 5. Upsert to embeddings table
      await supabase
        .from('embeddings')
        .upsert({
          user_id: userId,
          embedding: normalizedTransformed,
          created_at: new Date().toISOString()
        })

      // 6. Match via Cloudflare Pages Function
      // Note: In development, this targets the relative path /functions/resonance-match
      // or the deployed URL. We'll use the relative path assuming proxying/local-dev.
      const response = await fetch('/functions/resonance-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, encryptedVector: ciphertext })
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
  }, [userId, fheReady])

  return { resonanceMatches, isComputing, computeResonance, fheReady }
}
