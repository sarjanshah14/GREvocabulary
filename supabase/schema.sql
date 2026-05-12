-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.profiles enable row level security;
create policy "Users can view own profile." on profiles for select using (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile." on profiles for insert with check (auth.uid() = id);

-- 2. User Stats Table (Streak, Daily Goal)
create table public.user_stats (
  user_id uuid references public.profiles(id) not null primary key,
  streak_current integer default 0,
  streak_last_date date,
  daily_goal integer default 30,
  daily_count integer default 0,
  daily_last_date date,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.user_stats enable row level security;
create policy "Users can view own stats." on user_stats for select using (auth.uid() = user_id);
create policy "Users can update own stats." on user_stats for update using (auth.uid() = user_id);
create policy "Users can insert own stats." on user_stats for insert with check (auth.uid() = user_id);

-- 3. User Words Table (Progress for each word)
create table public.user_words (
  user_id uuid references public.profiles(id) not null,
  word text not null,
  score integer default 0,
  correct_count integer default 0,
  incorrect_count integer default 0,
  review_count integer default 0,
  last_reviewed date,
  next_review date,
  interval integer default 1,
  learning_stage text default 'new',
  is_bookmarked boolean default false,
  is_favourite boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, word)
);
alter table public.user_words enable row level security;
create policy "Users can view own words." on user_words for select using (auth.uid() = user_id);
create policy "Users can update own words." on user_words for update using (auth.uid() = user_id);
create policy "Users can insert own words." on user_words for insert with check (auth.uid() = user_id);
create policy "Users can delete own words." on user_words for delete using (auth.uid() = user_id);

-- 4. Daily Words Table (per-day goal progress for calendar UI)
create table public.user_daily_words (
  user_id uuid references public.profiles(id) not null,
  day_date date not null,
  words_done integer default 0,
  daily_goal integer default 30,
  practiced_words text[] default '{}',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, day_date)
);
alter table public.user_daily_words enable row level security;
create policy "Users can view own daily words." on user_daily_words for select using (auth.uid() = user_id);
create policy "Users can update own daily words." on user_daily_words for update using (auth.uid() = user_id);
create policy "Users can insert own daily words." on user_daily_words for insert with check (auth.uid() = user_id);
create policy "Users can delete own daily words." on user_daily_words for delete using (auth.uid() = user_id);

-- 5. Notebook Words Table (Personal vocabulary notebook)
create table if not exists public.notebook_words (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  word text not null,
  meaning text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, word)
);

alter table public.notebook_words enable row level security;

create policy "Users can view own notebook words." on notebook_words
for select using (auth.uid() = user_id);

create policy "Users can insert own notebook words." on notebook_words
for insert with check (auth.uid() = user_id);

create policy "Users can update own notebook words." on notebook_words
for update using (auth.uid() = user_id);

create policy "Users can delete own notebook words." on notebook_words
for delete using (auth.uid() = user_id);
