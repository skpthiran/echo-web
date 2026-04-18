export type Profile = {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  reputation_score?: number
  onboarding_intent?: string | null
  onboarding_complete?: boolean
}

// Database Rows (exactly what's in the table)
export type PostRow = {
  id: string
  user_id: string
  content: string
  mood: string | null
  is_anonymous: boolean
  embedding?: number[]
  created_at: string
}

export type ReactionRow = {
  id: string
  post_id: string
  user_id: string
  type: string
  created_at: string
}

export type CommentRow = {
  id: string
  post_id: string
  user_id: string
  parent_id: string | null
  content: string
  created_at: string
}

export type MessageRow = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

// Entity Types (with joins and aggregations)
export type Post = PostRow & {
  profiles: { username: string; avatar_url: string | null }
  reactions: { type: string; count: number }[]
  comment_count: number
}

export type Comment = CommentRow & {
  profiles: { username: string; avatar_url: string | null }
}

export type Message = MessageRow & {
  profiles?: { username: string; avatar_url: string | null }
}

export type Reaction = ReactionRow;

export type EmbeddingRow = {
  id: string
  user_id: string
  post_id: string | null
  embedding: number[]
  created_at: string
}
