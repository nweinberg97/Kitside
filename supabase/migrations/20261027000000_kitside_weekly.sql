-- Kitside v2: invite-only membership, hosts, the weekly rhythm.
--
-- Adds: invites, hosts and an organizer, contact links, "working on" and
-- "needs help" updates, Our Spots, Takeaways, sessions with an optional dinner.
--
-- NON-DESTRUCTIVE, like the first migration:
--   * Only adds tables, columns, functions and policies. Never drops a table,
--     column or row, and never rewrites existing data.
--   * Four existing access rules are tightened in place with ALTER POLICY
--     (members-only reading, invite required to join, hosts-only events).
--     That changes who can read or write, not what is stored.
--   * One transaction: if anything fails, nothing changes. Safe to re-run.
--
-- Run AFTER 20261006000000_kitside_init.sql (SQL Editor → New query → paste → Run).
--
-- The first person to finish a profile becomes the organizer (admin + host).
-- Everyone after that needs an invite code from a member.

begin;

do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'Run supabase/migrations/20261006000000_kitside_init.sql first. Nothing was changed.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- New columns (all with defaults, so existing rows stay valid)
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists is_host       boolean not null default false;
alter table public.profiles add column if not exists is_admin      boolean not null default false;
alter table public.profiles add column if not exists invited_by    uuid references public.profiles(id) on delete set null;
alter table public.profiles add column if not exists contact_email text not null default '';
alter table public.profiles add column if not exists instagram     text not null default '';
alter table public.profiles add column if not exists weekly_note   boolean not null default true;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_contact_email_check') then
    alter table public.profiles add constraint profiles_contact_email_check
      check (contact_email = '' or contact_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_instagram_check') then
    alter table public.profiles add constraint profiles_instagram_check
      check (instagram ~ '^[A-Za-z0-9._]{0,30}$') not valid;
  end if;
end $$;

-- Sessions (the weekly build session) can carry an optional dinner. Every event can pick a banner photo.
alter table public.activities add column if not exists is_session   boolean not null default false;
alter table public.activities add column if not exists dinner_place text not null default '';
alter table public.activities add column if not exists dinner_time  time;
alter table public.activities add column if not exists dinner_min   int not null default 3;
alter table public.activities add column if not exists cover        text not null default '';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'activities_dinner_place_check') then
    alter table public.activities add constraint activities_dinner_place_check check (char_length(dinner_place) <= 80) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'activities_cover_check') then
    alter table public.activities add constraint activities_cover_check check (cover ~ '^[a-z-]{0,20}$') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'activities_dinner_min_check') then
    alter table public.activities add constraint activities_dinner_min_check check (dinner_min between 2 and 12) not valid;
  end if;
end $$;

-- "I'm in" can also say "staying for dinner".
alter table public.activity_interests add column if not exists dinner boolean not null default false;

-- ---------------------------------------------------------------------------
-- New tables
-- ---------------------------------------------------------------------------

-- Invite codes. Created and redeemed only through the functions below.
create table if not exists public.invites (
  code       text primary key check (code ~ '^[A-Z0-9-]{4,24}$'),
  created_by uuid references public.profiles(id) on delete cascade,
  used_by    uuid references auth.users(id) on delete set null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists invites_created_by_idx on public.invites (created_by);
create unique index if not exists invites_used_by_idx on public.invites (used_by) where used_by is not null;

-- One-line weekly updates: what you're working on, or what you need help with.
create table if not exists public.updates (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  kind       text not null check (kind in ('working_on', 'ask')),
  body       text not null check (
               (kind = 'working_on' and char_length(body) between 1 and 90)
            or (kind = 'ask'        and char_length(body) between 1 and 120)),
  resolved   boolean not null default false,
  is_demo    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists updates_created_at_idx on public.updates (created_at desc);
create index if not exists updates_author_idx on public.updates (author_id);

-- "I can help" on an ask.
create table if not exists public.update_helpers (
  update_id  uuid not null references public.updates(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (update_id, profile_id)
);

-- Our Spots: places in and around Kits that members like.
create table if not exists public.spots (
  id         uuid primary key default gen_random_uuid(),
  added_by   uuid not null references public.profiles(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 60),
  area       text not null default '' check (char_length(area) <= 40),
  note       text not null default '' check (char_length(note) <= 140),
  tags       text[] not null default '{}',
  is_demo    boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.spots add column if not exists photo_url text not null default '';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'spots_photo_url_check') then
    alter table public.spots add constraint spots_photo_url_check
      check (photo_url = '' or (photo_url ~ '^https://[^[:space:]]+$' and char_length(photo_url) <= 400) or photo_url ~ '^cover:[a-z-]{1,20}$') not valid;
  end if;
end $$;

-- "I go here."
create table if not exists public.spot_regulars (
  spot_id    uuid not null references public.spots(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (spot_id, profile_id)
);

-- Takeaways: a useful insight worth keeping. Optional, never a procedure.
create table if not exists public.takeaways (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 80),
  body       text not null default '' check (char_length(body) <= 280),
  is_demo    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helpers. SECURITY DEFINER so policies can ask "is this person a member?"
-- without tripping over the profiles table's own policies.
-- ---------------------------------------------------------------------------
create or replace function public.kitside_is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and not is_demo);
$$;

create or replace function public.kitside_is_host() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and not is_demo and (is_host or is_admin));
$$;

create or replace function public.kitside_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and not is_demo and is_admin);
$$;

-- Has anyone joined yet? (Before the first member, no invite is needed.)
create or replace function public.kitside_community_started() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where not is_demo);
$$;

create or replace function public.kitside_has_invite() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from invites where used_by = auth.uid());
$$;

-- Lets the join page check a code before an account is created. Reveals only yes/no.
create or replace function public.kitside_invite_valid(p_code text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from invites where code = upper(trim(p_code)) and used_by is null);
$$;

-- Members get 2 invites, hosts 5, the organizer as many as they like.
create or replace function public.kitside_create_invite() returns text
language plpgsql volatile security definer set search_path = public as $$
declare
  me profiles%rowtype;
  made int;
  cap int;
  new_code text;
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  select * into me from profiles where id = auth.uid() and not is_demo;
  if not found then raise exception 'Only members can invite people.'; end if;
  select count(*) into made from invites where created_by = me.id;
  cap := case when me.is_admin then null when me.is_host then 5 else 2 end;
  if cap is not null and made >= cap then
    raise exception 'You''ve used all % of your invites.', cap;
  end if;
  loop
    new_code := 'KITS-' || (select string_agg(substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1), '') from generate_series(1, 5));
    exit when not exists (select 1 from invites where code = new_code);
  end loop;
  insert into invites (code, created_by) values (new_code, me.id);
  return new_code;
end $$;

create or replace function public.kitside_redeem_invite(p_code text) returns boolean
language plpgsql volatile security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Log in first.'; end if;
  if exists (select 1 from invites where used_by = auth.uid()) then return true; end if;
  update invites set used_by = auth.uid(), used_at = now()
   where code = upper(trim(p_code)) and used_by is null;
  if not found then
    raise exception 'That invite code isn''t valid, or it''s already been used.';
  end if;
  return true;
end $$;

-- The organizer makes (or unmakes) hosts. Hosts can create events.
create or replace function public.kitside_set_host(p_profile uuid, p_on boolean) returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  if not public.kitside_is_admin() then raise exception 'Only the organizer can change hosts.'; end if;
  perform set_config('kitside.trusted', 'on', true);
  update profiles set is_host = p_on where id = p_profile and not is_demo;
end $$;

-- Members can't make themselves hosts or organizers, or change who invited them.
-- Requests made outside the app (SQL Editor, service role) have no auth.uid()
-- and are left alone, so you can still fix things by hand.
create or replace function public.kitside_profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or new.is_demo or coalesce(current_setting('kitside.trusted', true), '') = 'on' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.is_admin := not exists (select 1 from profiles where not is_demo);
    new.is_host := new.is_admin;
    new.invited_by := (select created_by from invites where used_by = new.id limit 1);
  else
    new.is_admin := old.is_admin;
    new.is_host := old.is_host;
    new.invited_by := old.invited_by;
  end if;
  return new;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'kitside_profiles_guard') then
    create trigger kitside_profiles_guard before insert or update on public.profiles
      for each row execute function public.kitside_profiles_guard();
  end if;
end $$;

revoke all on function public.kitside_create_invite(), public.kitside_redeem_invite(text),
  public.kitside_set_host(uuid, boolean) from public;
grant execute on function public.kitside_is_member(), public.kitside_is_host(), public.kitside_is_admin(),
  public.kitside_community_started(), public.kitside_has_invite(), public.kitside_invite_valid(text) to anon, authenticated;
grant execute on function public.kitside_create_invite(), public.kitside_redeem_invite(text),
  public.kitside_set_host(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Tighten existing rules in place (no policy is dropped)
-- ---------------------------------------------------------------------------
do $$ begin
  -- Profiles: members only (plus your own row while you set it up).
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'kitside: profiles readable') then
    alter policy "kitside: profiles readable" on public.profiles
      using (is_demo or id = auth.uid() or public.kitside_is_member());
  end if;
  -- Joining needs a redeemed invite, except for the very first member.
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'kitside: create own profile') then
    alter policy "kitside: create own profile" on public.profiles
      with check (id = auth.uid() and not is_demo and (public.kitside_has_invite() or not public.kitside_community_started()));
  end if;
  -- Events: members see them; only hosts create them.
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'activities' and policyname = 'kitside: activities readable') then
    alter policy "kitside: activities readable" on public.activities
      using (is_demo or public.kitside_is_member());
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'activities' and policyname = 'kitside: host creates') then
    alter policy "kitside: host creates" on public.activities
      with check (host_id = auth.uid() and not is_demo and public.kitside_is_host());
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'activity_interests' and policyname = 'kitside: activity interest readable') then
    alter policy "kitside: activity interest readable" on public.activity_interests
      using (public.kitside_is_member() or exists (select 1 from activities a where a.id = activity_id and a.is_demo));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Row-level security for the new tables
-- ---------------------------------------------------------------------------
alter table public.invites        enable row level security;
alter table public.updates        enable row level security;
alter table public.update_helpers enable row level security;
alter table public.spots          enable row level security;
alter table public.spot_regulars  enable row level security;
alter table public.takeaways      enable row level security;

create or replace function pg_temp.kitside_policy(tbl text, pol text, ddl text)
returns void language plpgsql as $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = tbl and policyname = pol) then
    execute ddl;
  end if;
end $$;

-- Staying for dinner: you can change your own RSVP.
do $d$ begin perform pg_temp.kitside_policy('activity_interests', 'kitside: update own activity interest',
  $p$create policy "kitside: update own activity interest" on public.activity_interests for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid())$p$); end $d$;

-- Invites: you see the ones you made and the one you used. Writes go through the functions.
do $d$ begin perform pg_temp.kitside_policy('invites', 'kitside: own invites',
  $p$create policy "kitside: own invites" on public.invites for select to authenticated using (created_by = auth.uid() or used_by = auth.uid())$p$); end $d$;

-- Updates
do $d$ begin perform pg_temp.kitside_policy('updates', 'kitside: updates readable',
  $p$create policy "kitside: updates readable" on public.updates for select using (is_demo or public.kitside_is_member())$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('updates', 'kitside: post own update',
  $p$create policy "kitside: post own update" on public.updates for insert to authenticated with check (author_id = auth.uid() and not is_demo and public.kitside_is_member())$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('updates', 'kitside: edit own update',
  $p$create policy "kitside: edit own update" on public.updates for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid() and not is_demo)$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('updates', 'kitside: delete own update',
  $p$create policy "kitside: delete own update" on public.updates for delete to authenticated using (author_id = auth.uid())$p$); end $d$;

do $d$ begin perform pg_temp.kitside_policy('update_helpers', 'kitside: helpers readable',
  $p$create policy "kitside: helpers readable" on public.update_helpers for select using (public.kitside_is_member() or exists (select 1 from updates u where u.id = update_id and u.is_demo))$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('update_helpers', 'kitside: offer help',
  $p$create policy "kitside: offer help" on public.update_helpers for insert to authenticated with check (profile_id = auth.uid() and public.kitside_is_member())$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('update_helpers', 'kitside: withdraw help',
  $p$create policy "kitside: withdraw help" on public.update_helpers for delete to authenticated using (profile_id = auth.uid())$p$); end $d$;

-- Spots
do $d$ begin perform pg_temp.kitside_policy('spots', 'kitside: spots readable',
  $p$create policy "kitside: spots readable" on public.spots for select using (is_demo or public.kitside_is_member())$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('spots', 'kitside: add a spot',
  $p$create policy "kitside: add a spot" on public.spots for insert to authenticated with check (added_by = auth.uid() and not is_demo and public.kitside_is_member())$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('spots', 'kitside: remove own spot',
  $p$create policy "kitside: remove own spot" on public.spots for delete to authenticated using (added_by = auth.uid() or public.kitside_is_admin())$p$); end $d$;

do $d$ begin perform pg_temp.kitside_policy('spot_regulars', 'kitside: regulars readable',
  $p$create policy "kitside: regulars readable" on public.spot_regulars for select using (public.kitside_is_member() or exists (select 1 from spots s where s.id = spot_id and s.is_demo))$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('spot_regulars', 'kitside: say I go here',
  $p$create policy "kitside: say I go here" on public.spot_regulars for insert to authenticated with check (profile_id = auth.uid() and public.kitside_is_member())$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('spot_regulars', 'kitside: take it back',
  $p$create policy "kitside: take it back" on public.spot_regulars for delete to authenticated using (profile_id = auth.uid())$p$); end $d$;

-- Takeaways
do $d$ begin perform pg_temp.kitside_policy('takeaways', 'kitside: takeaways readable',
  $p$create policy "kitside: takeaways readable" on public.takeaways for select using (is_demo or public.kitside_is_member())$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('takeaways', 'kitside: add a takeaway',
  $p$create policy "kitside: add a takeaway" on public.takeaways for insert to authenticated with check (author_id = auth.uid() and not is_demo and public.kitside_is_member())$p$); end $d$;
do $d$ begin perform pg_temp.kitside_policy('takeaways', 'kitside: remove own takeaway',
  $p$create policy "kitside: remove own takeaway" on public.takeaways for delete to authenticated using (author_id = auth.uid() or public.kitside_is_admin())$p$); end $d$;

-- Table privileges (RLS still decides which rows).
grant select on public.invites, public.updates, public.update_helpers, public.spots,
  public.spot_regulars, public.takeaways to anon, authenticated;
grant insert, update, delete on public.updates to authenticated;
grant insert, delete on public.update_helpers, public.spots, public.spot_regulars, public.takeaways to authenticated;

commit;
