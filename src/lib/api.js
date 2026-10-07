/*
 * The one data API the UI talks to. It picks a backend:
 *   - live:    Supabase (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY set). The real, shared community.
 *   - demo:    a visitor pressed "See the demo". Sample neighbours in this browser only.
 *   - preview: no Supabase configured (local development). Also browser-only.
 * In live mode, VITE_SHOW_DEMO=false keeps any example rows in the database out of sight.
 */
import { MODE, SHOW_DEMO } from './config.js';
import { localBackend } from './backend/local.js';

let backendPromise;
const backend = () =>
  (backendPromise ||= MODE === 'live'
    ? import('./backend/supabase.js').then((m) => m.supabaseBackend)
    : Promise.resolve(localBackend));

const call = (name) => async (...args) => (await backend())[name](...args);
const withoutDemo = (rows) => (MODE !== 'live' || SHOW_DEMO ? rows : rows.filter((r) => !r.isDemo));

export const api = {
  mode: MODE,
  getUser: call('getUser'),
  onAuthChange: (fn) => {
    let off = () => {};
    let cancelled = false;
    backend().then((b) => { if (!cancelled) off = b.onAuthChange(fn); });
    return () => { cancelled = true; off(); };
  },
  signUp: call('signUp'),
  signIn: call('signIn'),
  signInWithProvider: call('signInWithProvider'),
  signOut: call('signOut'),
  getMyProfile: call('getMyProfile'),
  saveProfile: call('saveProfile'),
  listProfiles: async () => withoutDemo(await (await backend()).listProfiles()),
  getProfile: call('getProfile'),
  listActivities: async () => withoutDemo(await (await backend()).listActivities()),
  createActivity: call('createActivity'),
  deleteActivity: call('deleteActivity'),
  setActivityInterest: call('setActivityInterest'),
  listAnnouncements: async () => withoutDemo(await (await backend()).listAnnouncements()),
  createAnnouncement: call('createAnnouncement'),
  deleteAnnouncement: call('deleteAnnouncement'),
  setAnnouncementInterest: call('setAnnouncementInterest'),
  listBlocks: call('listBlocks'),
  setBlocked: call('setBlocked'),
  report: call('report'),
  resetPreview: () => localBackend.resetPreview(),
};
