const env = import.meta.env || {};

export const SUPABASE_URL = (env.VITE_SUPABASE_URL || '').trim();
export const SUPABASE_ANON_KEY = (env.VITE_SUPABASE_ANON_KEY || '').trim();

/** True when a Supabase project is configured. Otherwise Kitside runs in browser-only preview mode. */
export const IS_LIVE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const SHOW_DEMO = String(env.VITE_SHOW_DEMO ?? 'true').toLowerCase() !== 'false';

/** OAuth providers switched on in Supabase. Anything else is shown as "Not set up yet". */
export const ENABLED_PROVIDERS = IS_LIVE
  ? String(env.VITE_AUTH_PROVIDERS || '').split(',').map((s) => s.trim()).filter(Boolean)
  : [];

export const OAUTH_PROVIDERS = [
  { id: 'google', label: 'Continue with Google' },
  { id: 'apple', label: 'Continue with Apple' },
  { id: 'linkedin_oidc', label: 'Continue with LinkedIn' },
];
