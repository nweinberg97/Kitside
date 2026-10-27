/*
 * Browser-only backend, used for the demo sandbox and for local preview
 * (no Supabase configured). Everything lives in this browser's localStorage,
 * so nothing is shared between people. Passwords are hashed, but this is NOT
 * a secure auth system; it only protects data already on the same device.
 *
 * It mirrors the rules the real database enforces (see supabase/migrations):
 * invite-only joining, the first member becomes the organizer, only hosts
 * create events, and you can only change your own things.
 */
import { MODE } from '../config.js';
import {
  DEMO_ACTIVITIES, DEMO_INVITE, DEMO_PROFILES, DEMO_SPOTS, DEMO_TAKEAWAYS, DEMO_UPDATES, nextOccurrence,
} from '../seed.js';
import { LIMITS, inviteCap } from '../constants.js';

// The demo sandbox and local preview keep separate copies.
const KEY = MODE === 'demo' ? 'kitside:demo:v2' : 'kitside:preview:v2';
const listeners = new Set();
const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms)); // makes loading states visible, like a network would
const HOUR = 3600e3;
const DAY = 24 * HOUR;

function freshDb() {
  const now = Date.now();
  return {
    users: [],
    session: null,
    invites: [{ code: DEMO_INVITE, createdBy: null, usedBy: null, reusable: true, createdAt: new Date(now).toISOString() }],
    redeemed: [], // user ids that redeemed DEMO_INVITE
    profiles: DEMO_PROFILES,
    activities: DEMO_ACTIVITIES.map((a) => ({
      id: a.id, hostId: a.hostId, title: a.title, description: a.description, category: a.category,
      location: a.location, startsAt: nextOccurrence(a.weekday, a.time).toISOString(), isDemo: true,
      isSession: a.isSession, dinnerPlace: a.dinnerPlace, dinnerTime: a.dinnerTime, dinnerMin: a.dinnerMin,
    })),
    activityInterests: DEMO_ACTIVITIES.flatMap((a) => a.interested.map((p) => ({ activityId: a.id, profileId: p, dinner: a.dinner.includes(p) }))),
    updates: DEMO_UPDATES.map((u) => ({
      id: u.id, authorId: u.authorId, kind: u.kind, body: u.body, resolved: false, isDemo: true,
      createdAt: new Date(now - u.hoursAgo * HOUR).toISOString(),
    })),
    updateHelpers: DEMO_UPDATES.flatMap((u) => u.helpers.map((p) => ({ updateId: u.id, profileId: p }))),
    spots: DEMO_SPOTS.map((s) => ({
      id: s.id, addedBy: s.addedBy, name: s.name, area: s.area, note: s.note, tags: s.tags, isDemo: true,
      createdAt: new Date(now - 20 * DAY + Number(s.id.slice(-3)) * HOUR).toISOString(),
    })),
    spotRegulars: DEMO_SPOTS.flatMap((s) => s.regulars.map((p) => ({ spotId: s.id, profileId: p }))),
    takeaways: DEMO_TAKEAWAYS.map((t) => ({
      id: t.id, authorId: t.authorId, title: t.title, body: t.body, isDemo: true,
      createdAt: new Date(now - t.daysAgo * DAY).toISOString(),
    })),
    blocks: [],
    reports: [],
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return rollDemoActivities(JSON.parse(raw));
  } catch { /* storage unavailable or corrupt: start fresh */ }
  const db = freshDb();
  save(db);
  return db;
}

function save(db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* private mode: keep in memory */ }
}

// Demo events repeat weekly, so move any that have passed to next week.
function rollDemoActivities(db) {
  const cutoff = Date.now() - 2 * HOUR;
  for (const a of db.activities) {
    if (!a.isDemo) continue;
    let t = new Date(a.startsAt).getTime();
    while (t < cutoff) t += 7 * DAY;
    a.startsAt = new Date(t).toISOString();
  }
  return db;
}

let db = null;
const getDb = () => (db ||= load());
const commit = () => save(db);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));

async function hash(text) {
  if (!crypto.subtle) return `plain:${text}`;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`kitside:${text}`));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function currentUser() {
  const d = getDb();
  if (!d.session) return null;
  const u = d.users.find((x) => x.id === d.session.userId);
  return u ? { id: u.id, email: u.email, name: u.name } : null;
}

function emit() {
  const user = currentUser();
  listeners.forEach((fn) => fn(user));
}

function requireUser() {
  const user = currentUser();
  if (!user) throw new Error('Log in to do that.');
  return user;
}

const profileById = (pid) => getDb().profiles.find((p) => p.id === pid) || null;
const realMembers = () => getDb().profiles.filter((p) => !p.isDemo);

function requireMember() {
  const user = requireUser();
  const me = profileById(user.id);
  if (!me) throw new Error('Finish your profile first.');
  return me;
}

function hasInvite(userId) {
  const d = getDb();
  return d.redeemed.includes(userId) || d.invites.some((i) => i.usedBy === userId);
}

function hydrateActivity(a) {
  const ints = getDb().activityInterests.filter((i) => i.activityId === a.id);
  return {
    ...a,
    host: profileById(a.hostId),
    interestedIds: ints.map((i) => i.profileId),
    dinnerIds: ints.filter((i) => i.dinner).map((i) => i.profileId),
  };
}

function hydrateUpdate(u) {
  return {
    ...u,
    author: profileById(u.authorId),
    helperIds: getDb().updateHelpers.filter((h) => h.updateId === u.id).map((h) => h.profileId),
  };
}

function hydrateSpot(s) {
  return {
    ...s,
    addedByProfile: profileById(s.addedBy),
    regularIds: getDb().spotRegulars.filter((r) => r.spotId === s.id).map((r) => r.profileId),
  };
}

const hydrateTakeaway = (t) => ({ ...t, author: profileById(t.authorId) });

function toggleRow(list, match, on, row) {
  const rest = list.filter((x) => !match(x));
  if (on) rest.push(row);
  return rest;
}

export const localBackend = {
  mode: 'preview',

  // ---------- auth ----------
  async getUser() { return currentUser(); },
  onAuthChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  async signUp({ name, email, password }) {
    await wait();
    const d = getDb();
    const clean = email.trim().toLowerCase();
    if (d.users.some((u) => u.email === clean)) throw new Error('There’s already an account with that email. Try logging in.');
    const user = { id: uid(), email: clean, name: name.trim(), passwordHash: await hash(password) };
    d.users.push(user);
    d.session = { userId: user.id };
    commit(); emit();
    return { needsConfirmation: false };
  },

  async signIn({ email, password }) {
    await wait();
    const d = getDb();
    const u = d.users.find((x) => x.email === email.trim().toLowerCase());
    if (!u || u.passwordHash !== (await hash(password))) throw new Error('That email and password don’t match.');
    d.session = { userId: u.id };
    commit(); emit();
  },

  async signInWithProvider() {
    throw new Error('Social sign-in needs a connected Supabase project.');
  },

  async signOut() {
    getDb().session = null;
    commit(); emit();
  },

  // ---------- invites ----------
  async communityStarted() {
    return MODE === 'demo' ? true : realMembers().length > 0;
  },

  async inviteValid(code) {
    const c = code.trim().toUpperCase();
    return getDb().invites.some((i) => i.code === c && (i.reusable || !i.usedBy));
  },

  async redeemInvite(code) {
    await wait();
    const user = requireUser();
    const d = getDb();
    if (hasInvite(user.id)) return true;
    const c = code.trim().toUpperCase();
    const inv = d.invites.find((i) => i.code === c && (i.reusable || !i.usedBy));
    if (!inv) throw new Error('That invite code isn’t valid, or it’s already been used.');
    if (inv.reusable) d.redeemed.push(user.id);
    else Object.assign(inv, { usedBy: user.id, usedAt: new Date().toISOString() });
    commit();
    return true;
  },

  async createInvite() {
    await wait();
    const me = requireMember();
    const d = getDb();
    const made = d.invites.filter((i) => i.createdBy === me.id).length;
    const cap = inviteCap(me);
    if (cap !== null && made >= cap) throw new Error(`You’ve used all ${cap} of your invites.`);
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    do {
      code = `KITS-${Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')}`;
    } while (d.invites.some((i) => i.code === code));
    d.invites.push({ code, createdBy: me.id, usedBy: null, createdAt: new Date().toISOString() });
    commit();
    return code;
  },

  async listMyInvites() {
    const user = currentUser();
    if (!user) return [];
    return getDb().invites
      .filter((i) => i.createdBy === user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((i) => ({ code: i.code, createdAt: i.createdAt, usedBy: i.usedBy ? profileById(i.usedBy) || { id: i.usedBy, name: 'Someone (setting up)' } : null }));
  },

  async setHost(profileId, on) {
    const me = requireMember();
    if (!me.isAdmin) throw new Error('Only the organizer can change hosts.');
    const d = getDb();
    d.profiles = d.profiles.map((p) => (p.id === profileId ? { ...p, isHost: on } : p));
    commit();
  },

  // ---------- profiles ----------
  async getMyProfile() {
    const user = currentUser();
    return user ? profileById(user.id) : null;
  },

  async saveProfile(fields) {
    await wait();
    const user = requireUser();
    const d = getDb();
    const existing = profileById(user.id);
    if (!existing && !hasInvite(user.id) && (await this.communityStarted())) {
      throw new Error('Kitside is invite-only. Add the invite code a member sent you.');
    }
    const first = !existing && realMembers().length === 0;
    const inviter = d.invites.find((i) => i.usedBy === user.id)?.createdBy || null;
    const next = {
      avatarHue: Math.floor(Math.random() * 360), avatarUrl: '', linkedinUrl: '', instagram: '', contactEmail: user.email,
      weeklyNote: true, interests: [], lookingFor: [], bio: '', title: '', workingOn: '',
      ...existing, ...fields,
      // Never trust these from the form (the database enforces the same).
      isHost: existing ? existing.isHost : first,
      isAdmin: existing ? existing.isAdmin : first,
      invitedBy: existing ? existing.invitedBy : inviter,
      id: user.id, isDemo: false,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    d.profiles = existing ? d.profiles.map((p) => (p.id === user.id ? next : p)) : [next, ...d.profiles];
    commit();
    return next;
  },

  async listProfiles() {
    await wait();
    return [...getDb().profiles];
  },

  async getProfile(pid) {
    await wait(60);
    return profileById(pid);
  },

  // ---------- events ----------
  async listActivities() {
    await wait();
    const since = Date.now() - 2 * HOUR;
    return getDb().activities
      .filter((a) => new Date(a.startsAt).getTime() >= since)
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
      .map(hydrateActivity);
  },

  async createActivity(fields) {
    await wait();
    const me = requireMember();
    if (!me.isHost && !me.isAdmin) throw new Error('Only hosts can create events.');
    const a = {
      id: uid(), hostId: me.id, isDemo: false, isSession: false, dinnerPlace: '', dinnerTime: null, dinnerMin: 3, ...fields,
    };
    getDb().activities.push(a);
    getDb().activityInterests.push({ activityId: a.id, profileId: me.id, dinner: !!a.isSession && !!a.dinnerPlace });
    commit();
    return hydrateActivity(a);
  },

  async deleteActivity(aid) {
    const user = requireUser();
    const d = getDb();
    d.activities = d.activities.filter((a) => !(a.id === aid && a.hostId === user.id));
    commit();
  },

  async setActivityInterest(aid, on, { dinner = false } = {}) {
    const me = requireMember();
    const d = getDb();
    d.activityInterests = toggleRow(
      d.activityInterests, (i) => i.activityId === aid && i.profileId === me.id, on,
      { activityId: aid, profileId: me.id, dinner: on && dinner },
    );
    commit();
  },

  // ---------- updates: working on / needs help ----------
  async listUpdates({ days = 7 } = {}) {
    await wait();
    const since = Date.now() - days * DAY;
    return getDb().updates
      .filter((u) => new Date(u.createdAt).getTime() >= since)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(hydrateUpdate);
  },

  async listUpdatesBy(profileId) {
    await wait(60);
    return getDb().updates
      .filter((u) => u.authorId === profileId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20)
      .map(hydrateUpdate);
  },

  async createUpdate({ kind, body }) {
    await wait();
    const me = requireMember();
    const text = body.trim();
    const max = LIMITS[kind];
    if (!max) throw new Error('Unknown update type.');
    if (!text) throw new Error('Write a line first.');
    if (text.length > max) throw new Error(`Keep it to ${max} characters.`);
    const u = { id: uid(), authorId: me.id, kind, body: text, resolved: false, isDemo: false, createdAt: new Date().toISOString() };
    getDb().updates.push(u);
    if (kind === 'working_on') {
      const d = getDb();
      d.profiles = d.profiles.map((p) => (p.id === me.id ? { ...p, workingOn: text } : p));
    }
    commit();
    return hydrateUpdate(u);
  },

  async resolveUpdate(id) {
    const user = requireUser();
    const d = getDb();
    d.updates = d.updates.map((u) => (u.id === id && u.authorId === user.id ? { ...u, resolved: true } : u));
    commit();
  },

  async deleteUpdate(id) {
    const user = requireUser();
    const d = getDb();
    d.updates = d.updates.filter((u) => !(u.id === id && u.authorId === user.id));
    commit();
  },

  async setHelping(updateId, on) {
    const me = requireMember();
    const d = getDb();
    d.updateHelpers = toggleRow(d.updateHelpers, (h) => h.updateId === updateId && h.profileId === me.id, on, { updateId, profileId: me.id });
    commit();
  },

  // ---------- spots ----------
  async listSpots() {
    await wait();
    return getDb().spots.map(hydrateSpot).sort((a, b) => b.regularIds.length - a.regularIds.length || a.name.localeCompare(b.name));
  },

  async createSpot(fields) {
    await wait();
    const me = requireMember();
    const s = { id: uid(), addedBy: me.id, isDemo: false, createdAt: new Date().toISOString(), tags: [], area: '', note: '', ...fields };
    getDb().spots.push(s);
    getDb().spotRegulars.push({ spotId: s.id, profileId: me.id });
    commit();
    return hydrateSpot(s);
  },

  async deleteSpot(id) {
    const me = requireMember();
    const d = getDb();
    d.spots = d.spots.filter((s) => !(s.id === id && (s.addedBy === me.id || me.isAdmin)));
    commit();
  },

  async setRegular(spotId, on) {
    const me = requireMember();
    const d = getDb();
    d.spotRegulars = toggleRow(d.spotRegulars, (r) => r.spotId === spotId && r.profileId === me.id, on, { spotId, profileId: me.id });
    commit();
  },

  // ---------- takeaways ----------
  async listTakeaways() {
    await wait();
    return [...getDb().takeaways].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(hydrateTakeaway);
  },

  async createTakeaway({ title, body }) {
    await wait();
    const me = requireMember();
    const t = { id: uid(), authorId: me.id, title: title.trim(), body: body.trim(), isDemo: false, createdAt: new Date().toISOString() };
    getDb().takeaways.push(t);
    commit();
    return hydrateTakeaway(t);
  },

  async deleteTakeaway(id) {
    const me = requireMember();
    const d = getDb();
    d.takeaways = d.takeaways.filter((t) => !(t.id === id && (t.authorId === me.id || me.isAdmin)));
    commit();
  },

  // ---------- trust & safety ----------
  async listBlocks() {
    const user = currentUser();
    return user ? getDb().blocks.filter((b) => b.blockerId === user.id).map((b) => b.blockedId) : [];
  },

  async setBlocked(profileId, on) {
    const user = requireUser();
    const d = getDb();
    d.blocks = toggleRow(d.blocks, (b) => b.blockerId === user.id && b.blockedId === profileId, on, { blockerId: user.id, blockedId: profileId });
    commit();
  },

  async report({ targetType, targetId, reason, note }) {
    await wait();
    const user = requireUser();
    getDb().reports.push({ id: uid(), reporterId: user.id, targetType, targetId, reason, note, createdAt: new Date().toISOString() });
    commit();
  },

  /** Browser-only: wipe this copy and start again from the demo data. */
  async resetPreview() {
    db = freshDb();
    commit(); emit();
  },
};
