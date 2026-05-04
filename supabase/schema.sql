-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- Profiles: public-facing user metadata
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  bio text,
  reputation_score int default 0,
  created_at timestamptz default now()
);

-- Posts: thoughts shared to the public feed
create table posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  content text not null,
  embedding vector(768), -- LEGACY: Raw semantic embedding (do not use for new posts)
  steered_vector vector(768), -- STEER-transformed vector for matching
  encrypted_blob text, -- AES-GCM encrypted blob for storage confidentiality
  mood text,
  is_anonymous bool default true,
  created_at timestamptz default now()
);

-- Reactions: user engagement on posts
create table reactions (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  type text not null default 'resonate',
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- Comments: threaded discussion
create table comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- Messages: Peer-to-peer communication
create table messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid references profiles(id) on delete cascade,
  receiver_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- Embeddings: Resonance infrastructure
create table embeddings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  embedding vector(768), -- LEGACY: Raw semantic embedding
  steered_vector vector(768), -- STEER-transformed vector for matching
  encrypted_blob text, -- AES-GCM encrypted blob for storage confidentiality
  created_at timestamptz default now()
);

-- Enable Row Level Security on all tables
alter table profiles enable row level security;
alter table posts enable row level security;
alter table reactions enable row level security;
alter table comments enable row level security;
alter table messages enable row level security;
alter table embeddings enable row level security;

-- Policies
create policy "Profiles are publicly readable" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

create policy "Posts are publicly readable" on posts for select using (true);
create policy "Users can insert own posts" on posts for insert with check (auth.uid() = user_id);
create policy "Users can delete own posts" on posts for delete using (auth.uid() = user_id);

create policy "Reactions are publicly readable" on reactions for select using (true);
create policy "Users can insert own reactions" on reactions for insert with check (auth.uid() = user_id);
create policy "Users can delete own reactions" on reactions for delete using (auth.uid() = user_id);

create policy "Comments are publicly readable" on comments for select using (true);
create policy "Authenticated users can comment" on comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments" on comments for delete using (auth.uid() = user_id);

create policy "Users can manage their own messages" on messages
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send messages" on messages
  for insert with check (auth.uid() = sender_id);

create policy "Users can manage their own embeddings" on embeddings
  using (auth.uid() = user_id);

-- Steered vectors readable by service role only (for Cloudflare Workers)
create policy "Steered vectors readable by service only"
on embeddings for select
using (auth.role() = 'service_role');

create policy "Steered vectors in posts readable by service only"
on posts for select
using (auth.role() = 'service_role');

-- match_posts function
create or replace function match_posts(query_embedding vector(768), match_count int, exclude_user_id uuid)
returns table(id uuid, user_id uuid, content text, mood text, created_at timestamptz, similarity float)
language sql stable as $$
  select id, user_id, content, mood, created_at,
    1 - (steered_vector <=> query_embedding) as similarity
  from posts
  where user_id != exclude_user_id and steered_vector is not null
  order by steered_vector <=> query_embedding
  limit match_count;
$$;

-- match_users function  
create or replace function match_users(query_embedding vector(768), match_count int, exclude_user_id uuid)
returns table(user_id uuid, similarity float)
language sql stable as $$
  select user_id,
    1 - (avg(steered_vector) <=> query_embedding) as similarity
  from posts
  where user_id != exclude_user_id and steered_vector is not null
  group by user_id
  order by avg(steered_vector) <=> query_embedding
  limit match_count;
$$;

-- Auto-create a profile
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    split_part(new.email, '@', 1),
    'https://api.dicebear.com/7.x/shapes/svg?seed=' || new.id
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Notifications: in-app alerts for reactions, comments, and resonance matches
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null, -- 'reaction' | 'comment' | 'resonance' | 'system'
  message text not null,
  post_id uuid references posts(id) on delete set null,
  from_user_id uuid references profiles(id) on delete set null,
  is_read bool default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

create policy "Users can read own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on notifications for update
  using (auth.uid() = user_id);

create policy "Service role can insert notifications"
  on notifications for insert
  with check (true);
