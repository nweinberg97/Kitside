import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const SessionContext = createContext(null);

/**
 * Who is signed in, their Kitside profile (null until onboarding is done),
 * and the people they've blocked.
 */
export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [blocked, setBlockedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);

  const loadFor = useCallback(async (u) => {
    setUser(u);
    if (!u) { setProfile(null); setBlockedIds(new Set()); setLoading(false); return; }
    try {
      const [p, b] = await Promise.all([api.getMyProfile(), api.listBlocks()]);
      setProfile(p);
      setBlockedIds(new Set(b));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    api.getUser().then((u) => alive && loadFor(u)).catch(() => alive && setLoading(false));
    const off = api.onAuthChange((u) => loadFor(u));
    return () => { alive = false; off(); };
  }, [loadFor]);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    blocked,
    isMember: Boolean(user && profile),
    setProfile,
    async setBlocked(profileId, on) {
      await api.setBlocked(profileId, on);
      setBlockedIds((prev) => {
        const next = new Set(prev);
        on ? next.add(profileId) : next.delete(profileId);
        return next;
      });
    },
    async signOut() {
      await api.signOut();
      setUser(null); setProfile(null); setBlockedIds(new Set());
    },
  }), [user, profile, loading, blocked]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
