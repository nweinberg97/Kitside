/*
 * The one data API the UI talks to. It picks a backend:
 *   - Supabase when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set (live, shared)
 *   - localStorage otherwise (preview mode, this browser only)
 * and applies the VITE_SHOW_DEMO switch so demo content can be hidden at launch.
 */
import { IS_LIVE, SHOW_DEMO } from './config.js';
import { localBackend } from './backend/local.js';

let backendPromise;
const backend = () =>
  (backendPromise ||= IS_LIVE
    ? import('./backend/supabase.js').then((m) => m.supabaseBackend)
    : Promise.resolve(localBackend));

const call = (name) => async (...args) => (await backend())[name](...args);
const withoutDemo = (rows) => (SHOW_DEMO ? rows : rows.filter((r) => !r.isDemo));

export const api = {
  mode: IS_LIVE ? 'live' : 'preview',
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
