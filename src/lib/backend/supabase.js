/*
 * Live backend: Supabase (Postgres + Auth), free tier.
 * Schema, row-level security and seed live in /supabase.
 */
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const returnUrl = () => `${window.location.origin}${window.location.pathname}`;

function fail(error, fallback = 'Something went wrong. Try again in a moment.') {
  if (!error) return;
  console.error(error);
  throw new Error(error.message || fallback);
}

function mapUser(u) {
  if (!u) return null;
  const meta = u.user_metadata || {};
  return {
    id: u.id,
    email: u.email,
    name: meta.name || meta.full_name || '',
    avatarUrl: meta.avatar_url || meta.picture || '',
  };
}

const toProfile = (r) => r && ({
  id: r.id, name: r.name, role: r.role, title: r.title || '', bio: r.bio || '',
  neighbourhood: r.neighbourhood, interests: r.interests || [], lookingFor: r.looking_for || [],
  workingOn: r.working_on || '', isRemote: !!r.is_remote, linkedinUrl: r.linkedin_url || '',
  instagram: r.instagram || '', contactEmail: r.contact_email || '', weeklyNote: r.weekly_note !== false,
  isHost: !!r.is_host, isAdmin: !!r.is_admin, invitedBy: r.invited_by || null,
  avatarUrl: r.avatar_url || '', avatarHue: r.avatar_hue ?? 160, isDemo: !!r.is_demo, createdAt: r.created_at,
});

// is_host / is_admin / invited_by are never sent: the database sets them.
const fromProfile = (p) => ({
  name: p.name, role: p.role, title: p.title, bio: p.bio, neighbourhood: p.neighbourhood,
  interests: p.interests, looking_for: p.lookingFor, working_on: p.workingOn, is_remote: p.isRemote,
  linkedin_url: p.linkedinUrl, instagram: p.instagram, contact_email: p.contactEmail, weekly_note: p.weeklyNote,
  avatar_url: p.avatarUrl, avatar_hue: p.avatarHue,
});

const toActivity = (r) => ({
  id: r.id, hostId: r.host_id, host: toProfile(r.host), title: r.title, description: r.description || '',
  category: r.category, location: r.location, startsAt: r.starts_at, isDemo: !!r.is_demo,
  cover: r.cover || '', isSession: !!r.is_session, dinnerPlace: r.dinner_place || '', dinnerTime: r.dinner_time?.slice(0, 5) || null, dinnerMin: r.dinner_min ?? 3,
  interestedIds: (r.activity_interests || []).map((i) => i.profile_id),
  dinnerIds: (r.activity_interests || []).filter((i) => i.dinner).map((i) => i.profile_id),
});

const toUpdate = (r) => ({
  id: r.id, authorId: r.author_id, author: toProfile(r.author), kind: r.kind, body: r.body,
  resolved: !!r.resolved, isDemo: !!r.is_demo, createdAt: r.created_at,
  helperIds: (r.update_helpers || []).map((h) => h.profile_id),
});

const toSpot = (r) => ({
  id: r.id, addedBy: r.added_by, addedByProfile: toProfile(r.adder), name: r.name, area: r.area || '', note: r.note || '',
  tags: r.tags || [], photo: r.photo_url || '', isDemo: !!r.is_demo, createdAt: r.created_at,
  regularIds: (r.spot_regulars || []).map((x) => x.profile_id),
});

const toTakeaway = (r) => ({
  id: r.id, authorId: r.author_id, author: toProfile(r.author), title: r.title, body: r.body || '', context: r.context || '',
  isDemo: !!r.is_demo, createdAt: r.created_at,
});

const ACTIVITY_SELECT = '*, host:profiles!activities_host_id_fkey(*), activity_interests(profile_id, dinner)';
const UPDATE_SELECT = '*, author:profiles!updates_author_id_fkey(*), update_helpers(profile_id)';

async function requireUser() {
  const { data } = await sb.auth.getSession();
  const user = data.session?.user;
  if (!user) throw new Error('Log in to do that.');
  return user;
}

export const supabaseBackend = {
  mode: 'live',

  // ---------- auth ----------
  async getUser() {
    const { data } = await sb.auth.getSession();
    return mapUser(data.session?.user);
  },

  onAuthChange(fn) {
    const { data } = sb.auth.onAuthStateChange((_event, session) => fn(mapUser(session?.user)));
    return () => data.subscription.unsubscribe();
  },

  async signUp({ name, email, password }) {
    const { data, error } = await sb.auth.signUp({
      email: email.trim(), password,
      options: { data: { name: name.trim() }, emailRedirectTo: returnUrl() },
    });
    fail(error);
    return { needsConfirmation: !data.session };
  },

  async signIn({ email, password }) {
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (error?.message?.toLowerCase().includes('invalid')) throw new Error('That email and password don’t match.');
    if (error?.message?.toLowerCase().includes('not confirmed')) throw new Error('Confirm your email first. The link is in your inbox.');
    fail(error);
  },

  async signInWithProvider(provider) {
    const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: returnUrl() } });
    fail(error);
  },

  async signOut() {
    await sb.auth.signOut();
  },

  // ---------- profiles ----------
  async getMyProfile() {
    const { data: s } = await sb.auth.getSession();
    const user = s.session?.user;
    if (!user) return null;
    const { data, error } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
    fail(error);
    return toProfile(data);
  },

  async saveProfile(fields) {
    const user = await requireUser();
    const row = { id: user.id, ...fromProfile(fields) };
    Object.keys(row).forEach((k) => row[k] === undefined && delete row[k]);
    const { data, error } = await sb.from('profiles').upsert(row).select().single();
    if (error?.message?.includes('row-level security')) throw new Error('Kitside is invite-only. Add the invite code a member sent you.');
    fail(error);
    return toProfile(data);
  },

  async listProfiles() {
    const { data, error } = await sb.from('profiles').select('*').order('created_at', { ascending: false }).limit(500);
    fail(error);
    return data.map(toProfile);
  },

  async getProfile(id) {
    const { data, error } = await sb.from('profiles').select('*').eq('id', id).maybeSingle();
    fail(error);
    return toProfile(data);
  },

  // ---------- invites ----------
  async communityStarted() {
    const { data, error } = await sb.rpc('kitside_community_started');
    fail(error);
    return !!data;
  },

  async inviteValid(code) {
    const { data, error } = await sb.rpc('kitside_invite_valid', { p_code: code });
    fail(error);
    return !!data;
  },

  async redeemInvite(code) {
    const { error } = await sb.rpc('kitside_redeem_invite', { p_code: code });
    fail(error);
    return true;
  },

  async createInvite() {
    const { data, error } = await sb.rpc('kitside_create_invite');
    fail(error);
    return data;
  },

  async listMyInvites() {
    const user = await requireUser();
    const { data, error } = await sb.from('invites').select('code, created_at, used_by').eq('created_by', user.id).order('created_at', { ascending: false });
    fail(error);
    const ids = data.map((i) => i.used_by).filter(Boolean);
    let people = [];
    if (ids.length) {
      const res = await sb.from('profiles').select('*').in('id', ids);
      people = (res.data || []).map(toProfile);
    }
    return data.map((i) => ({
      code: i.code, createdAt: i.created_at,
      usedBy: i.used_by ? people.find((p) => p.id === i.used_by) || { id: i.used_by, name: 'Someone (setting up)' } : null,
    }));
  },

  async setHost(profileId, on) {
    const { error } = await sb.rpc('kitside_set_host', { p_profile: profileId, p_on: on });
    fail(error);
  },

  // ---------- events ----------
  async listActivities() {
    await sb.rpc('roll_demo_activities'); // keeps weekly demo events current; harmless if it fails
    const since = new Date(Date.now() - 2 * 3600e3).toISOString();
    const { data, error } = await sb.from('activities').select(ACTIVITY_SELECT).gte('starts_at', since).order('starts_at').limit(200);
    fail(error);
    return data.map(toActivity);
  },

  async createActivity(f) {
    const user = await requireUser();
    const { data, error } = await sb
      .from('activities')
      .insert({
        host_id: user.id, title: f.title, description: f.description, category: f.category, location: f.location, starts_at: f.startsAt,
        cover: f.cover || '', is_session: !!f.isSession, dinner_place: f.dinnerPlace || '', dinner_time: f.dinnerTime || null, dinner_min: f.dinnerMin || 3,
      })
      .select(ACTIVITY_SELECT)
      .single();
    if (error?.message?.includes('row-level security')) throw new Error('Only hosts can create events.');
    fail(error);
    const dinner = !!f.isSession && !!f.dinnerPlace;
    await sb.from('activity_interests').insert({ activity_id: data.id, profile_id: user.id, dinner });
    return { ...toActivity(data), interestedIds: [user.id], dinnerIds: dinner ? [user.id] : [] };
  },

  async deleteActivity(id) {
    const { error } = await sb.from('activities').delete().eq('id', id);
    fail(error);
  },

  async setActivityInterest(activityId, on, { dinner = false } = {}) {
    const user = await requireUser();
    const q = sb.from('activity_interests');
    const { error } = on
      ? await q.upsert({ activity_id: activityId, profile_id: user.id, dinner }, { onConflict: 'activity_id,profile_id' })
      : await q.delete().eq('activity_id', activityId).eq('profile_id', user.id);
    fail(error);
  },

  // ---------- updates: working on / needs help ----------
  async listUpdates({ days = 7 } = {}) {
    const since = new Date(Date.now() - days * 24 * 3600e3).toISOString();
    const { data, error } = await sb.from('updates').select(UPDATE_SELECT).gte('created_at', since).order('created_at', { ascending: false }).limit(300);
    fail(error);
    return data.map(toUpdate);
  },

  async listUpdatesBy(profileId) {
    const { data, error } = await sb.from('updates').select(UPDATE_SELECT).eq('author_id', profileId).order('created_at', { ascending: false }).limit(20);
    fail(error);
    return data.map(toUpdate);
  },

  async createUpdate({ kind, body }) {
    const user = await requireUser();
    const { data, error } = await sb.from('updates').insert({ author_id: user.id, kind, body: body.trim() }).select(UPDATE_SELECT).single();
    fail(error);
    if (kind === 'working_on') await sb.from('profiles').update({ working_on: body.trim() }).eq('id', user.id);
    return toUpdate(data);
  },

  async resolveUpdate(id) {
    const { error } = await sb.from('updates').update({ resolved: true }).eq('id', id);
    fail(error);
  },

  async deleteUpdate(id) {
    const { error } = await sb.from('updates').delete().eq('id', id);
    fail(error);
  },

  async setHelping(updateId, on) {
    const user = await requireUser();
    const q = sb.from('update_helpers');
    const { error } = on
      ? await q.upsert({ update_id: updateId, profile_id: user.id }, { onConflict: 'update_id,profile_id', ignoreDuplicates: true })
      : await q.delete().eq('update_id', updateId).eq('profile_id', user.id);
    fail(error);
  },

  // ---------- spots ----------
  async listSpots() {
    const { data, error } = await sb.from('spots').select('*, adder:profiles!spots_added_by_fkey(*), spot_regulars(profile_id)').limit(300);
    fail(error);
    return data.map(toSpot).sort((a, b) => b.regularIds.length - a.regularIds.length || a.name.localeCompare(b.name));
  },

  async createSpot(f) {
    const user = await requireUser();
    const { data, error } = await sb.from('spots')
      .insert({ added_by: user.id, name: f.name, area: f.area || '', note: f.note || '', tags: f.tags || [], photo_url: f.photo || '' })
      .select('*, adder:profiles!spots_added_by_fkey(*), spot_regulars(profile_id)').single();
    fail(error);
    await sb.from('spot_regulars').insert({ spot_id: data.id, profile_id: user.id });
    return { ...toSpot(data), regularIds: [user.id] };
  },

  async deleteSpot(id) {
    const { error } = await sb.from('spots').delete().eq('id', id);
    fail(error);
  },

  async setRegular(spotId, on) {
    const user = await requireUser();
    const q = sb.from('spot_regulars');
    const { error } = on
      ? await q.upsert({ spot_id: spotId, profile_id: user.id }, { onConflict: 'spot_id,profile_id', ignoreDuplicates: true })
      : await q.delete().eq('spot_id', spotId).eq('profile_id', user.id);
    fail(error);
  },

  // ---------- takeaways ----------
  async listTakeaways() {
    const { data, error } = await sb.from('takeaways').select('*, author:profiles!takeaways_author_id_fkey(*)').order('created_at', { ascending: false }).limit(200);
    fail(error);
    return data.map(toTakeaway);
  },

  async createTakeaway({ title, body, context = '' }) {
    const user = await requireUser();
    const { data, error } = await sb.from('takeaways').insert({ author_id: user.id, title: title.trim(), body: body.trim(), context: context.trim() })
      .select('*, author:profiles!takeaways_author_id_fkey(*)').single();
    fail(error);
    return toTakeaway(data);
  },

  async deleteTakeaway(id) {
    const { error } = await sb.from('takeaways').delete().eq('id', id);
    fail(error);
  },

  // ---------- trust & safety ----------
  async listBlocks() {
    const { data: s } = await sb.auth.getSession();
    if (!s.session) return [];
    const { data, error } = await sb.from('blocks').select('blocked_id');
    fail(error);
    return data.map((b) => b.blocked_id);
  },

  async setBlocked(profileId, on) {
    const user = await requireUser();
    const q = sb.from('blocks');
    const { error } = on
      ? await q.upsert({ blocker_id: user.id, blocked_id: profileId }, { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true })
      : await q.delete().eq('blocker_id', user.id).eq('blocked_id', profileId);
    fail(error);
  },

  async report({ targetType, targetId, reason, note }) {
    const user = await requireUser();
    const { error } = await sb.from('reports').insert({ reporter_id: user.id, target_type: targetType, target_id: targetId, reason, note });
    fail(error);
  },
};
