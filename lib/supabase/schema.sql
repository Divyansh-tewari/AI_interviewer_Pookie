-- Supabase SQL migration for Pookie
-- Run this in your Supabase SQL editor to create all required tables

-- Sessions table
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  question_type text not null default 'ai_system_design',
  role text not null default 'sr_pm',
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  generated_question text not null,
  timer_minutes integer not null default 45,
  hints_used integer not null default 0,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

-- Messages table
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  message_type text not null default 'response' check (message_type in ('response', 'hint', 'nudge', 'follow_up', 'system')),
  created_at timestamptz not null default now()
);

-- Evaluations table
create table if not exists evaluations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade not null,
  rubric_scores jsonb not null default '{}',
  rubric_feedback jsonb not null default '{}',
  overall_score numeric(4,1) not null default 0,
  strengths text[] not null default '{}',
  gaps text[] not null default '{}',
  sample_answer text not null default '',
  feedback_summary text not null default '',
  sources_cited text[] not null default '{}',
  confidence_scores jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Indexes for common query patterns
create index if not exists sessions_user_id_idx on sessions(user_id);
create index if not exists sessions_status_idx on sessions(status);
create index if not exists messages_session_id_idx on messages(session_id);
create index if not exists evaluations_session_id_idx on evaluations(session_id);

-- Row Level Security
alter table sessions enable row level security;
alter table messages enable row level security;
alter table evaluations enable row level security;

-- RLS policies: users can only see their own data
create policy "Users can view own sessions"
  on sessions for select using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on sessions for insert with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on sessions for update using (auth.uid() = user_id);

create policy "Users can view messages for own sessions"
  on messages for select
  using (exists (select 1 from sessions where sessions.id = messages.session_id and sessions.user_id = auth.uid()));

create policy "Users can insert messages for own sessions"
  on messages for insert
  with check (exists (select 1 from sessions where sessions.id = messages.session_id and sessions.user_id = auth.uid()));

create policy "Users can view evaluations for own sessions"
  on evaluations for select
  using (exists (select 1 from sessions where sessions.id = evaluations.session_id and sessions.user_id = auth.uid()));

create policy "Users can insert evaluations for own sessions"
  on evaluations for insert
  with check (exists (select 1 from sessions where sessions.id = evaluations.session_id and sessions.user_id = auth.uid()));
