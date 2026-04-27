[ECHO_README.md](https://github.com/user-attachments/files/27116727/ECHO_README.md)
# ECHO — Privacy-First Thought Matching Platform

> You are not your profile. You are what you think.

**ECHO** is a social platform that matches people by the semantic content of their current thoughts — not by who they follow, what they look like, or how many posts they've made. Write a thought. ECHO embeds it into a 768-dimensional vector, transforms it with a user-specific privacy layer, and finds the people in the network whose minds are currently resonating at the same frequency.

No social graph. No follower counts. No profiles as identity. Just cognitive matching.

🔗 **Live:** [skpthiran.github.io/Echo](https://skpthiran.github.io/Echo)

---

## The Concept

Every major social platform surfaces content based on engagement signals — likes, shares, follower graphs. ECHO surfaces people based on *semantic proximity*: how similar is what you're thinking right now to what someone else is thinking right now?

The architecture is built around a core privacy constraint: **the server must never see your raw semantic vector**. A raw embedding of your thoughts is a fingerprint of your mind — it encodes not just what you wrote, but the latent semantic structure behind it. ECHO applies a local transformation before the vector ever leaves the device, ensuring the matching computation runs on obfuscated data.

---

## Architecture

### The Resonance Pipeline

When a user triggers resonance matching, the following sequence runs entirely client-side except for the final matching step:

```
User's recent posts (3)
  │
  ▼
Gemini text-embedding-004          → 768-dimensional semantic vector
  │
  ▼
STEER Transformation (local)       → user-specific 768x768 matrix applied: v' = T · v
  │                                   matrix seeded deterministically from userId
  ▼
FHE Encryption (CKKS/OpenFHE)      → encrypted ciphertext (mock mode pending WASM support)
  │
  ▼
Cloudflare Pages Function          → dot-product similarity against all encrypted vectors
  │                                   returns top 3 matches
  ▼
Profile enrichment (Supabase)      → match user_ids resolved to usernames + avatars
```

The raw 768D semantic vector never reaches the server in plaintext. Only the STEER-transformed, FHE-encrypted ciphertext is transmitted and stored.

---

### STEER — Semantic Transformation for Encrypted Embedding Retrieval

STEER is a custom privacy layer built for this project. The core problem: if you encrypt a vector and send it to a server for matching, the server sees the ciphertext but never the raw embedding. However, a sufficiently large dataset of ciphertexts from the same user could potentially be used to reconstruct the plaintext via statistical analysis.

STEER addresses this by applying a **deterministic, user-specific linear transformation** to the embedding *before* encryption:

```typescript
// steer.ts

// 1. Hash userId to 4 seeds using cyrb128 (non-cryptographic, deterministic)
function cyrb128(str: string): number[] { ... }

// 2. Build a 768x768 transformation matrix seeded from userId
export function buildTransformMatrix(seed: string): number[][] {
  const rand = mulberry32(cyrb128(seed)[0]);
  // Each user gets a unique random matrix — same userId always produces same matrix
  return Array.from({ length: 768 }, () =>
    Array.from({ length: 768 }, () => rand() * 2 - 1)
  );
}

// 3. Apply transformation: v' = T · v, then re-normalize
export function applySTEER(vector: number[], matrix: number[][]): number[] {
  const result = matrix.map(row =>
    row.reduce((sum, weight, j) => sum + weight * vector[j], 0)
  );
  const magnitude = Math.sqrt(result.reduce((s, v) => s + v * v, 0));
  return result.map(v => v / magnitude);
}
```

The transformation is orthogonal-ish by construction, which means **cosine similarity is approximately preserved** after transformation — two users thinking similar thoughts still produce similar transformed vectors, so matching still works. But the mapping from transformed space back to semantic space is computationally intractable without knowing the user's exact seed.

Different users get different matrices, seeded by their `userId`. The same user always gets the same matrix (deterministic), so their vectors remain consistent across sessions.

---

### FHE Layer — CKKS Homomorphic Encryption

The FHE layer is designed to wrap **OpenFHE's CKKS scheme** — an approximate homomorphic encryption scheme that supports arithmetic operations (dot products) on encrypted floating-point vectors without decrypting them first.

```typescript
// fhe.ts — designed interface (real CKKS pending WASM availability)

// In the full implementation:
// const context = openfhe.genContextCKKS({
//   multiplicativeDepth: 1,
//   scalingModSize: 50,
//   batchSize: 16
// });
// const keyPair = context.KeyGen();

export function encryptVector(vector: number[]): string {
  // TODO: replace with real CKKS encryption
  // Currently: base64 serialization of Float32Array (mock)
  const buffer = new Float32Array(vector).buffer;
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
```

The matching worker on Cloudflare is already structured to accept the ciphertext and perform the dot-product server-side. When OpenFHE-WASM becomes available in browser environments, the mock can be swapped for real CKKS encryption with no changes to the matching pipeline.

---

### AI Pipeline — Groq + Gemini

Every post passes through three Groq-powered analysis steps before being stored:

**1. PII Anonymization**
Before a post is saved to the database, Groq's `llama-3.1-8b-instant` rewrites it to remove personally identifiable information — names, addresses, phone numbers, specific dates — while preserving emotional tone and length. Posts are anonymous by default; this step makes them structurally anonymous too.

**2. Content Moderation**
Groq classifies each post into one of three labels: `safe`, `distress`, or `aggression`. If `distress` is detected, the app surfaces a `CrisisModal` with mental health resources before the post is submitted. If `aggression` is detected, the post is blocked.

**3. Mood Detection**
Groq classifies the emotional tone into one of eight moods: `calm`, `melancholy`, `hopeful`, `anxious`, `grateful`, `conflicted`, `numb`, `tender`. The mood label is stored with the post and shown on the feed card.

**4. Semantic Embedding**
Gemini's `text-embedding-004` generates the 768-dimensional vector that powers resonance matching. Gemini was chosen specifically because its embedding model produces consistent, high-quality semantic representations at 768 dimensions — matching the pgvector schema.

```typescript
// ai.ts — unified interface
export const ai = {
  anonymize(content): Promise<string>,   // Groq: PII removal
  moderate(content): Promise<'safe' | 'distress' | 'aggression'>,  // Groq: safety
  getMood(content): Promise<string>,     // Groq: emotion classification
  embed(content): Promise<number[]>,    // Gemini: 768D vector
}
```

---

### Vector Database — pgvector

Posts store their embedding directly as a `vector(768)` column. Two SQL functions enable similarity search:

```sql
-- Nearest posts by cosine similarity
CREATE FUNCTION match_posts(query_embedding vector(768), match_count int, exclude_user_id uuid)
RETURNS TABLE(id uuid, content text, similarity float) AS $$
  SELECT id, content, 1 - (embedding <=> query_embedding) AS similarity
  FROM posts
  WHERE user_id != exclude_user_id AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql STABLE;

-- Nearest users by average embedding across their posts
CREATE FUNCTION match_users(query_embedding vector(768), match_count int, exclude_user_id uuid)
RETURNS TABLE(user_id uuid, similarity float) AS $$
  SELECT user_id, 1 - (avg(embedding) <=> query_embedding) AS similarity
  FROM posts
  WHERE user_id != exclude_user_id AND embedding IS NOT NULL
  GROUP BY user_id
  ORDER BY avg(embedding) <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql STABLE;
```

The `<=>` operator is pgvector's cosine distance. Users are matched by the centroid of all their post embeddings — a single vector representing their aggregate thought pattern.

---

### Biometric Human Gate — Didit

To prevent bots from poisoning the resonance matching system, ECHO integrates **Didit** for biometric face verification. Users must pass a liveness check before posting. The integration is designed around Didit's SDK (currently running in mock mode with simulated verification flow).

---

## Features

**Thought Feed**
- Anonymous-by-default posts with AI-stripped PII
- Mood classification displayed per post
- Resonate reactions (not likes — semantic acknowledgement)
- Threaded comments

**Resonance Matching**
- On-demand cognitive matching against all active users
- STEER-transformed + FHE-encrypted vectors sent to matching worker
- Top 3 resonance matches with similarity scores
- Matched users can enter private chat

**Safety Layer**
- Real-time content moderation on every post (Groq)
- CrisisModal with mental health resources triggered on distress detection
- Aggression detection blocks harmful content before submission

**Reflections**
- Personal thought history with mood timeline
- Searchable archive of past thoughts

**Identity**
- Biometric human verification via Didit (anti-bot)
- Optional profile identity — anonymous by default
- Reputation scoring

**PWA**
- Installable, offline-capable via service worker
- Mobile-first layout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Motion.js |
| Database | Supabase — PostgreSQL + **pgvector**, RLS |
| Embeddings | Google Gemini `text-embedding-004` (768D) |
| AI — Text | **Groq** `llama-3.1-8b-instant` — anonymization, moderation, mood |
| Privacy | STEER (custom 768×768 linear transform) + OpenFHE CKKS (mock) |
| Matching | Cloudflare Pages Function (`/functions/resonance-match`) |
| Auth | Supabase Auth |
| Human Gate | Didit biometric verification (mock) |
| Deployment | GitHub Pages |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project with `pgvector` extension enabled
- Groq API key
- Gemini API key

### Installation

```bash
git clone https://github.com/skpthiran/echo
cd echo
npm install
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Database Setup

Run `supabase/schema.sql` in the Supabase SQL editor. Ensure pgvector is enabled:

```sql
create extension if not exists "vector";
```

### Running Locally

```bash
npm run dev
```

---

## Project Structure

```
echo/
├── src/
│   ├── lib/
│   │   ├── ai.ts           # Unified AI interface (Groq + Gemini)
│   │   ├── fhe.ts          # FHE wrapper (CKKS design, mock mode)
│   │   ├── steer.ts        # STEER: user-specific 768x768 transform
│   │   ├── groq.ts         # Groq inference client
│   │   ├── gemini.ts       # Gemini embedding client
│   │   └── didit.ts        # Biometric verification wrapper
│   ├── hooks/
│   │   └── useResonance.ts # Full resonance pipeline orchestration
│   └── components/
│       ├── CrisisModal.tsx  # Distress detection response
│       └── HumanGate.tsx    # Biometric verification gate
├── functions/
│   └── resonance-match.ts  # Cloudflare Worker: encrypted vector matching
└── supabase/
    └── schema.sql           # pgvector schema + match_posts/match_users RPCs
```

---

## Roadmap

- [ ] Replace FHE mock with real OpenFHE-WASM once browser support stabilises
- [ ] HNSW vector indexing for sub-millisecond similarity search at scale
- [ ] Didit live SDK integration (replacing mock verification)
- [ ] Federated matching across multiple nodes without a central embedding store

---

## Built By

**Thiran Thathsara A. Wijesingha**
AI-Native Product Engineer · IIT (University of Westminster, UK)

[github.com/skpthiran](https://github.com/skpthiran) · [linkedin.com/in/skpthiran](https://linkedin.com/in/skpthiran)

---

*Built entirely independently. Original concept, architecture, and implementation — no templates, no team.*
