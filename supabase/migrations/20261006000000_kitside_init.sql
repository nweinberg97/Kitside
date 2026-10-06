-- Kitside: initial database setup for Supabase.
--
-- NON-DESTRUCTIVE. This script never drops, truncates, deletes or rewrites rows.
--   * Tables are created only if they don't exist.
--   * Policies are created only if a policy with the same name doesn't exist.
--   * It runs as one transaction: if a preflight check fails, nothing changes.
-- Safe to run more than once.
--
-- How to run: Supabase dashboard → SQL Editor → New query → paste this whole file → Run.
-- (Or with the Supabase CLI: `supabase db push`.)

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Preflight: if a table with one of Kitside's names already exists but has a
-- different shape (for example a starter-template `profiles` table), stop
-- instead of guessing. Nothing is changed when this raises.
-- ---------------------------------------------------------------------------
do $$
declare
  expected jsonb := jsonb_build_object(
    'profiles',               jsonb_build_array('id','name','role','title','bio','neighbourhood','interests','looking_for','working_on','is_remote','linkedin_url','avatar_url','avatar_hue','is_demo','created_at'),
    'activities',             jsonb_build_array('id','host_id','title','description','category','location','starts_at','is_demo','created_at'),
    'announcements',          jsonb_build_array('id','author_id','title','details','category','location','happens_on','happens_at','hidden','is_demo','created_at'),
    'activity_interests',     jsonb_build_array('activity_id','profile_id','created_at'),
    'announcement_interests', jsonb_build_array('announcement_id','profile_id','created_at'),
    'blocks',                 jsonb_build_array('blocker_id','blocked_id','created_at'),
    'reports',                jsonb_build_array('id','reporter_id','target_type','target_id','reason','note','created_at')
  );
  t text;
  missing text;
begin
  for t in select jsonb_object_keys(expected) loop
    if to_regclass('public.' || t) is not null then
      select string_agg(col, ', ') into missing
        from jsonb_array_elements_text(expected -> t) as col
       where not exists (
         select 1 from information_schema.columns c
          where c.table_schema = 'public' and c.table_name = t and c.column_name = col);
      if missing is not null then
        raise exception 'Kitside setup stopped: table public.% already exists without column(s): %. Nothing was changed. Rename or migrate that table first.', t, missing;
      end if;
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- People. For real members, id = their auth user id (enforced by RLS below).
-- Demo profiles (is_demo = true) are fictional and have no auth user.
-- Only neighbourhood-level location is stored. Never an address.
create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 1 and 60),
  role          text not null default 'Other',
  title         text not null default '' check (char_length(title) <= 80),
  bio           text not null default '' check (char_length(bio) <= 280),
  neighbourhood text not null default 'Kitsilano' check (char_length(neighbourhood) <= 40),
  interests     text[] not null default '{}',
  looking_for   text[] not null default '{}',
  working_on    text not null default '' check (char_length(working_on) <= 140),
  is_remote     boolean not null default false,
  linkedin_url  text not null default '' check (linkedin_url = '' or linkedin_url ~* '^https://([a-z]+\.)?linkedin\.com/'),
  avatar_url    text not null default '',
  avatar_hue    int not null default 160,
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists public.activities (
  id          uuid primary key default gen_random_uuid(),
  host_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 80),
  description text not null default '' check (char_length(description) <= 400),
  category    text not null check (category in ('Build','Move','Work','Eat','Explore','Social')),
  location    text not null check (char_length(location) between 1 and 80),
  starts_at   timestamptz not null,
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists activities_starts_at_idx on public.activities (starts_at);
create index if not exists activities_host_id_idx on public.activities (host_id);

create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 140),
  details     text not null default '' check (char_length(details) <= 500),
  category    text check (category is null or category in ('Build','Move','Work','Eat','Explore','Social')),
  location    text not null default '' check (char_length(location) <= 80),
  happens_on  date,
  happens_at  time,
  hidden      boolean not null default false,   -- set true in Table Editor to take a post down
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists announcements_created_at_idx on public.announcements (created_at desc);
create index if not exists announcements_author_id_idx on public.announcements (author_id);

create table if not exists public.activity_interests (
  activity_id uuid not null references public.activities(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (activity_id, profile_id)
);
create index if not exists activity_interests_profile_idx on public.activity_interests (profile_id);

create table if not exists public.announcement_interests (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (announcement_id, profile_id)
);
create index if not exists announcement_interests_profile_idx on public.announcement_interests (profile_id);

create table if not exists public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- Write-only from the app. Review in Table Editor → reports.
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('profile','activity','announcement')),
  target_id   uuid not null,
  reason      text not null check (char_length(reason) <= 120),
  note        text not null default '' check (char_length(note) <= 500),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row-level security: every table is locked down, then opened only as needed.
-- ---------------------------------------------------------------------------
alter table public.profiles               enable row level security;
alter table public.activities             enable row level security;
alter table public.announcements          enable row level security;
alter table public.activity_interests     enable row level security;
alter table public.announcement_interests enable row level security;
alter table public.blocks                 enable row level security;
alter table public.reports                enable row level security;

-- Creates a policy only when no policy with that name exists on the table.
-- Never drops or replaces an existing policy.
create or replace function pg_temp.kitside_policy(tbl text, pol text, ddl text)
returns void language plpgsql as $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = tbl and policyname = pol) then
    execute ddl;
  end if;
end $$;

-- Profiles: visitors who haven't joined see only the fictional demo profiles.
-- Real members are visible to signed-in users only. You can only write your own.
do $d$ begin perform pg_temp.kitside_policy('profiles', 'kitside: profiles readable',
  $p$create policy "kitside: profiles readable" on public.profiles for select using (is_demo or auth.uid() is not null)$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('profiles', 'kitside: create own profile',
  $p$create policy "kitside: create own profile" on public.profiles for insert to authenticated with check (id = auth.uid() and not is_demo)$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('profiles', 'kitside: edit own profile',
  $p$create policy "kitside: edit own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and not is_demo)$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('profiles', 'kitside: delete own profile',
  $p$create policy "kitside: delete own profile" on public.profiles for delete to authenticated using (id = auth.uid())$p$); end $d$;

-- Activities: anyone can browse; only the host can create, edit or cancel.
do $d$ begin perform pg_temp.kitside_policy('activities', 'kitside: activities readable',
  $p$create policy "kitside: activities readable" on public.activities for select using (true)$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('activities', 'kitside: host creates',
  $p$create policy "kitside: host creates" on public.activities for insert to authenticated with check (host_id = auth.uid() and not is_demo)$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('activities', 'kitside: host edits',
  $p$create policy "kitside: host edits" on public.activities for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid() and not is_demo)$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('activities', 'kitside: host deletes',
  $p$create policy "kitside: host deletes" on public.activities for delete to authenticated using (host_id = auth.uid())$p$); end $d$;

-- Announcements: anyone can read posts that aren't hidden; authors post and delete their own.
do $d$ begin perform pg_temp.kitside_policy('announcements', 'kitside: posts readable',
  $p$create policy "kitside: posts readable" on public.announcements for select using (not hidden)$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('announcements', 'kitside: author posts',
  $p$create policy "kitside: author posts" on public.announcements for insert to authenticated with check (author_id = auth.uid() and not is_demo and not hidden)$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('announcements', 'kitside: author deletes',
  $p$create policy "kitside: author deletes" on public.announcements for delete to authenticated using (author_id = auth.uid())$p$); end $d$;

-- Interest ("I'm interested"): counts are public; you can only add or remove your own.
do $d$ begin perform pg_temp.kitside_policy('activity_interests', 'kitside: activity interest readable',
  $p$create policy "kitside: activity interest readable" on public.activity_interests for select using (true)$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('activity_interests', 'kitside: add own activity interest',
  $p$create policy "kitside: add own activity interest" on public.activity_interests for insert to authenticated with check (profile_id = auth.uid())$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('activity_interests', 'kitside: remove own activity interest',
  $p$create policy "kitside: remove own activity interest" on public.activity_interests for delete to authenticated using (profile_id = auth.uid())$p$); end $d$;

do $d$ begin perform pg_temp.kitside_policy('announcement_interests', 'kitside: post interest readable',
  $p$create policy "kitside: post interest readable" on public.announcement_interests for select using (true)$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('announcement_interests', 'kitside: add own post interest',
  $p$create policy "kitside: add own post interest" on public.announcement_interests for insert to authenticated with check (profile_id = auth.uid())$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('announcement_interests', 'kitside: remove own post interest',
  $p$create policy "kitside: remove own post interest" on public.announcement_interests for delete to authenticated using (profile_id = auth.uid())$p$); end $d$;

-- Blocks are private to the person who made them.
do $d$ begin perform pg_temp.kitside_policy('blocks', 'kitside: own blocks',
  $p$create policy "kitside: own blocks" on public.blocks for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid())$p$); end $d$;

-- Reports: members can file them; nobody can read them through the app.
do $d$ begin perform pg_temp.kitside_policy('reports', 'kitside: file a report',
  $p$create policy "kitside: file a report" on public.reports for insert to authenticated with check (reporter_id = auth.uid())$p$); end $d$;

-- Table privileges (RLS still decides which rows).
grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.activities, public.announcements,
  public.activity_interests, public.announcement_interests to anon, authenticated;
grant insert, update, delete on public.profiles, public.activities, public.announcements,
  public.activity_interests, public.announcement_interests to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant insert on public.reports to authenticated;

-- ---------------------------------------------------------------------------
-- Example activities repeat weekly. The app calls this before listing
-- activities so the example schedule never goes stale. It only moves the
-- start time of rows marked is_demo; it never touches members' activities.
-- ---------------------------------------------------------------------------
create or replace function public.roll_demo_activities()
returns void
language sql
security definer
set search_path = public
as $$
  update public.activities
     set starts_at = starts_at + ceil(extract(epoch from (now() - starts_at)) / 604800.0) * interval '7 days'
   where is_demo and starts_at < now() - interval '2 hours';
$$;

revoke all on function public.roll_demo_activities() from public;
grant execute on function public.roll_demo_activities() to anon, authenticated;

commit;
