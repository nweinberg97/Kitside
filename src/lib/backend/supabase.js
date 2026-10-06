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
  avatarUrl: r.avatar_url || '', avatarHue: r.avatar_hue ?? 160, isDemo: !!r.is_demo, createdAt: r.created_at,
});

const fromProfile = (p) => ({
  name: p.name, role: p.role, title: p.title, bio: p.bio, neighbourhood: p.neighbourhood,
  interests: p.interests, looking_for: p.lookingFor, working_on: p.workingOn, is_remote: p.isRemote,
  linkedin_url: p.linkedinUrl, avatar_url: p.avatarUrl, avatar_hue: p.avatarHue,
});

const toActivity = (r) => ({
  id: r.id, hostId: r.host_id, host: toProfile(r.host), title: r.title, description: r.description || '',
  category: r.category, location: r.location, startsAt: r.starts_at, isDemo: !!r.is_demo,
  interestedIds: (r.activity_interests || []).map((i) => i.profile_id),
});

const toAnnouncement = (r) => ({
  id: r.id, authorId: r.author_id, author: toProfile(r.author), title: r.title, details: r.details || '',
  category: r.category, location: r.location || '', happensOn: r.happens_on, happensAt: r.happens_at?.slice(0, 5) || null,
  createdAt: r.created_at, isDemo: !!r.is_demo,
  interestedIds: (r.announcement_interests || []).map((i) => i.profile_id),
});

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

  // ---------- activities ----------
  async listActivities() {
    await sb.rpc('roll_demo_activities'); // keeps weekly demo activities current; harmless if it fails
    const since = new Date(Date.now() - 2 * 3600e3).toISOString();
    const { data, error } = await sb
      .from('activities')
      .select('*, host:profiles(*), activity_interests(profile_id)')
      .gte('starts_at', since)
      .order('starts_at')
      .limit(200);
    fail(error);
    return data.map(toActivity);
  },

  async createActivity(f) {
    const user = await requireUser();
    const { data, error } = await sb
      .from('activities')
      .insert({ host_id: user.id, title: f.title, description: f.description, category: f.category, location: f.location, starts_at: f.startsAt })
      .select('*, host:profiles(*), activity_interests(profile_id)')
      .single();
    fail(error);
    await sb.from('activity_interests').insert({ activity_id: data.id, profile_id: user.id });
    return { ...toActivity(data), interestedIds: [user.id] };
  },

  async deleteActivity(id) {
    const { error } = await sb.from('activities').delete().eq('id', id);
    fail(error);
  },

  async setActivityInterest(activityId, on) {
    const user = await requireUser();
    const q = sb.from('activity_interests');
    const { error } = on
      ? await q.upsert({ activity_id: activityId, profile_id: user.id }, { onConflict: 'activity_id,profile_id', ignoreDuplicates: true })
      : await q.delete().eq('activity_id', activityId).eq('profile_id', user.id);
    fail(error);
  },

  // ---------- announcements ----------
  async listAnnouncements() {
    const { data, error } = await sb
      .from('announcements')
      .select('*, author:profiles(*), announcement_interests(profile_id)')
      .order('created_at', { ascending: false })
      .limit(100);
    fail(error);
    return data.map(toAnnouncement);
  },

  async createAnnouncement(f) {
    const user = await requireUser();
    const { data, error } = await sb
      .from('announcements')
      .insert({
        author_id: user.id, title: f.title, details: f.details, category: f.category || null,
        location: f.location, happens_on: f.happensOn || null, happens_at: f.happensAt || null,
      })
      .select('*, author:profiles(*), announcement_interests(profile_id)')
      .single();
    fail(error);
    return toAnnouncement(data);
  },

  async deleteAnnouncement(id) {
    const { error } = await sb.from('announcements').delete().eq('id', id);
    fail(error);
  },

  async setAnnouncementInterest(announcementId, on) {
    const user = await requireUser();
    const q = sb.from('announcement_interests');
    const { error } = on
      ? await q.upsert({ announcement_id: announcementId, profile_id: user.id }, { onConflict: 'announcement_id,profile_id', ignoreDuplicates: true })
      : await q.delete().eq('announcement_id', announcementId).eq('profile_id', user.id);
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
