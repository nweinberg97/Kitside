/*
 * Preview backend: used when no Supabase project is configured.
 * Everything lives in this browser's localStorage, so it is perfect for
 * trying Kitside out and for local development, but nothing is shared
 * between people. Passwords are hashed, but this is NOT a secure auth system;
 * it only ever protects data that already sits on the same device.
 */
import { MODE } from '../config.js';
import { DEMO_PROFILES, DEMO_ACTIVITIES, DEMO_ANNOUNCEMENTS, nextOccurrence } from '../seed.js';

// The demo sandbox and local preview keep separate copies.
const KEY = MODE === 'demo' ? 'kitside:demo:v1' : 'kitside:preview:v1';
const listeners = new Set();
const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms)); // makes loading states visible, like a network would

function freshDb() {
  const now = Date.now();
  return {
    users: [],
    session: null,
    profiles: DEMO_PROFILES,
    activities: DEMO_ACTIVITIES.map((a) => ({
      id: a.id, hostId: a.hostId, title: a.title, description: a.description, category: a.category,
      location: a.location, startsAt: nextOccurrence(a.weekday, a.time).toISOString(), isDemo: true,
    })),
    announcements: DEMO_ANNOUNCEMENTS.map((a) => ({
      id: a.id, authorId: a.authorId, title: a.title, details: a.details, category: a.category,
      location: a.location || '', happensOn: null, happensAt: a.time || null,
      createdAt: new Date(now - a.hoursAgo * 3600e3).toISOString(), isDemo: true,
    })),
    activityInterests: DEMO_ACTIVITIES.flatMap((a) => a.interested.map((p) => ({ activityId: a.id, profileId: p }))),
    announcementInterests: DEMO_ANNOUNCEMENTS.flatMap((a) => a.interested.map((p) => ({ announcementId: a.id, profileId: p }))),
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

// Demo activities repeat weekly, so move any that have passed to next week.
function rollDemoActivities(db) {
  const cutoff = Date.now() - 2 * 3600e3;
  const week = 7 * 24 * 3600e3;
  for (const a of db.activities) {
    if (!a.isDemo) continue;
    let t = new Date(a.startsAt).getTime();
    while (t < cutoff) t += week;
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

function requireProfile() {
  const user = requireUser();
  if (!getDb().profiles.some((p) => p.id === user.id)) throw new Error('Finish your profile first.');
  return user;
}

const profileById = (pid) => getDb().profiles.find((p) => p.id === pid) || null;

function hydrateActivity(a) {
  const d = getDb();
  return {
    ...a,
    host: profileById(a.hostId),
    interestedIds: d.activityInterests.filter((i) => i.activityId === a.id).map((i) => i.profileId),
  };
}

function hydrateAnnouncement(a) {
  const d = getDb();
  return {
    ...a,
    author: profileById(a.authorId),
    interestedIds: d.announcementInterests.filter((i) => i.announcementId === a.id).map((i) => i.profileId),
  };
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
    const next = {
      avatarHue: Math.floor(Math.random() * 360), avatarUrl: '', linkedinUrl: '',
      ...existing, ...fields, id: user.id, isDemo: false,
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

  // ---------- activities ----------
  async listActivities() {
    await wait();
    const since = Date.now() - 2 * 3600e3;
    return getDb().activities
      .filter((a) => new Date(a.startsAt).getTime() >= since)
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
      .map(hydrateActivity);
  },

  async createActivity(fields) {
    await wait();
    const user = requireProfile();
    const a = { id: uid(), hostId: user.id, isDemo: false, ...fields };
    getDb().activities.push(a);
    getDb().activityInterests.push({ activityId: a.id, profileId: user.id });
    commit();
    return hydrateActivity(a);
  },

  async deleteActivity(aid) {
    const user = requireUser();
    const d = getDb();
    d.activities = d.activities.filter((a) => !(a.id === aid && a.hostId === user.id));
    commit();
  },

  async setActivityInterest(aid, on) {
    const user = requireProfile();
    const d = getDb();
    d.activityInterests = d.activityInterests.filter((i) => !(i.activityId === aid && i.profileId === user.id));
    if (on) d.activityInterests.push({ activityId: aid, profileId: user.id });
    commit();
  },

  // ---------- announcements ----------
  async listAnnouncements() {
    await wait();
    return [...getDb().announcements]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(hydrateAnnouncement);
  },

  async createAnnouncement(fields) {
    const user = requireProfile();
    const a = { id: uid(), authorId: user.id, isDemo: false, createdAt: new Date().toISOString(), ...fields };
    getDb().announcements.push(a);
    commit();
    return hydrateAnnouncement(a);
  },

  async deleteAnnouncement(aid) {
    const user = requireUser();
    const d = getDb();
    d.announcements = d.announcements.filter((a) => !(a.id === aid && a.authorId === user.id));
    commit();
  },

  async setAnnouncementInterest(aid, on) {
    const user = requireProfile();
    const d = getDb();
    d.announcementInterests = d.announcementInterests.filter((i) => !(i.announcementId === aid && i.profileId === user.id));
    if (on) d.announcementInterests.push({ announcementId: aid, profileId: user.id });
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
    d.blocks = d.blocks.filter((b) => !(b.blockerId === user.id && b.blockedId === profileId));
    if (on) d.blocks.push({ blockerId: user.id, blockedId: profileId });
    commit();
  },

  async report({ targetType, targetId, reason, note }) {
    await wait();
    const user = requireUser();
    getDb().reports.push({ id: uid(), reporterId: user.id, targetType, targetId, reason, note, createdAt: new Date().toISOString() });
    commit();
  },

  /** Preview-only: wipe the browser copy and start again from the demo data. */
  async resetPreview() {
    db = freshDb();
    commit(); emit();
  },
};
