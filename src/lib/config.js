const env = import.meta.env || {};

export const SUPABASE_URL = (env.VITE_SUPABASE_URL || '').trim();
export const SUPABASE_ANON_KEY = (env.VITE_SUPABASE_ANON_KEY || '').trim();

/** True when a Supabase project is configured. Otherwise Kitside runs in browser-only preview mode. */
export const IS_LIVE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Whether the live site also shows the fictional example rows from the database seed. */
export const SHOW_DEMO = String(env.VITE_SHOW_DEMO ?? 'true').toLowerCase() !== 'false';

/*
 * Demo mode: a visitor pressed "See the demo". The whole app switches to a
 * sandbox filled with sample neighbours, stored only in their browser, so the
 * real community stays untouched. Turned on and off with a reload so nothing
 * from one world leaks into the other.
 */
const DEMO_FLAG = 'kitside:demo';

function readDemoFlag() {
  try { return window.localStorage.getItem(DEMO_FLAG) === '1'; } catch { return false; }
}

export const IN_DEMO = IS_LIVE && readDemoFlag();

/** Which world the app is in: the real community, the demo sandbox, or local preview (no Supabase configured). */
export const MODE = IN_DEMO ? 'demo' : IS_LIVE ? 'live' : 'preview';

export function enterDemo(to = '/') {
  try {
    window.localStorage.setItem(DEMO_FLAG, '1');
    window.localStorage.removeItem('kitside:demo:v1'); // every visit starts from fresh sample data
  } catch { /* storage blocked: the demo can't switch on */ }
  window.location.hash = to;
  window.location.reload();
}

export function exitDemo(to = '/') {
  try { window.localStorage.removeItem(DEMO_FLAG); } catch { /* nothing to clear */ }
  window.location.hash = to;
  window.location.reload();
}

/** OAuth providers switched on in Supabase. Anything else is shown as "Not set up yet". */
export const ENABLED_PROVIDERS = MODE === 'live'
  ? String(env.VITE_AUTH_PROVIDERS || '').split(',').map((s) => s.trim()).filter(Boolean)
  : [];

export const OAUTH_PROVIDERS = [
  { id: 'google', label: 'Continue with Google' },
  { id: 'apple', label: 'Continue with Apple' },
  { id: 'linkedin_oidc', label: 'Continue with LinkedIn' },
];
