-- SlackClone Phase 2: Database Schema
-- Run this entire file in Supabase SQL Editor

-- ============================================
-- 1. TABLES
-- ============================================

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  avatar_url text,
  status text default 'Hey there! I''m using Slack Clone',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Channels
create table public.channels (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text,
  is_private boolean default false not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Channel Members
create table public.channel_members (
  id uuid default gen_random_uuid() primary key,
  channel_id uuid references public.channels(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member' not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz default now() not null,
  unique (channel_id, user_id)
);

-- Messages
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  channel_id uuid references public.channels(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  parent_id uuid references public.messages(id) on delete cascade,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Reactions
create table public.reactions (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz default now() not null,
  unique (message_id, user_id, emoji)
);

-- ============================================
-- 2. INDEXES
-- ============================================

create index idx_messages_channel_id on public.messages(channel_id, created_at);
create index idx_messages_parent_id on public.messages(parent_id);
create index idx_channel_members_user_id on public.channel_members(user_id);
create index idx_channel_members_channel_id on public.channel_members(channel_id);
create index idx_reactions_message_id on public.reactions(message_id);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

alter table public.profiles enable row level security;
alter table public.channels enable row level security;
alter table public.channel_members enable row level security;
alter table public.messages enable row level security;
alter table public.reactions enable row level security;

-- ============================================
-- 4. RLS POLICIES
-- ============================================

-- Profiles: any authenticated user can read, users can update their own
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Channels: public channels visible to all, private channels to members only
create policy "Public channels are viewable by authenticated users"
  on public.channels for select
  to authenticated
  using (
    is_private = false
    or exists (
      select 1 from public.channel_members
      where channel_members.channel_id = channels.id
      and channel_members.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create channels"
  on public.channels for insert
  to authenticated
  with check (auth.uid() = created_by);

-- Channel Members: visible to authenticated users, users can join public channels
create policy "Channel members are viewable by authenticated users"
  on public.channel_members for select
  to authenticated
  using (true);

create policy "Users can join public channels"
  on public.channel_members for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (
      exists (
        select 1 from public.channels
        where channels.id = channel_id and channels.is_private = false
      )
    )
  );

create policy "Users can leave channels"
  on public.channel_members for delete
  to authenticated
  using (auth.uid() = user_id);

-- Messages: readable by channel members, users can CRUD their own
create policy "Messages are viewable by channel members"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.channel_members
      where channel_members.channel_id = messages.channel_id
      and channel_members.user_id = auth.uid()
    )
  );

create policy "Channel members can send messages"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.channel_members
      where channel_members.channel_id = messages.channel_id
      and channel_members.user_id = auth.uid()
    )
  );

create policy "Users can update their own messages"
  on public.messages for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own messages"
  on public.messages for delete
  to authenticated
  using (auth.uid() = user_id);

-- Reactions: readable by channel members, users can add/remove their own
create policy "Reactions are viewable by channel members"
  on public.reactions for select
  to authenticated
  using (
    exists (
      select 1 from public.messages
      join public.channel_members on channel_members.channel_id = messages.channel_id
      where messages.id = reactions.message_id
      and channel_members.user_id = auth.uid()
    )
  );

create policy "Users can add reactions"
  on public.reactions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can remove their own reactions"
  on public.reactions for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger on_channels_updated
  before update on public.channels
  for each row execute function public.handle_updated_at();

create trigger on_messages_updated
  before update on public.messages
  for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  general_channel_id uuid;
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Auto-join #general
  select id into general_channel_id from public.channels where name = 'general';
  if general_channel_id is not null then
    insert into public.channel_members (channel_id, user_id, role)
    values (general_channel_id, new.id, 'member');
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- 6. SEED DATA
-- ============================================

insert into public.channels (name, description)
values
  ('general', 'Company-wide announcements and work-based matters'),
  ('random', 'Non-work banter and water cooler conversation');

-- ============================================
-- 7. ENABLE REALTIME
-- ============================================

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.channels;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.reactions;
