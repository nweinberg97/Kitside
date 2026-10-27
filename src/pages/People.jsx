import { useMemo } from 'react';
import PersonCard from '../components/PersonCard.jsx';
import { EmptyState, ErrorState, SkeletonGrid } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { useLoad } from '../lib/useLoad.js';
import { useSession } from '../state/session.jsx';

/** Everyone in Kitside. Small enough that filters would just get in the way. */
export default function People() {
  const { user, profile, blocked } = useSession();
  const { data, error, loading, reload } = useLoad(() => api.listProfiles(), [user?.id]);

  const people = useMemo(() => {
    const byId = new Map((data || []).map((p) => [p.id, p]));
    return (data || [])
      .filter((p) => !blocked.has(p.id) && p.id !== profile?.id)
      .sort((a, b) => (b.isAdmin - a.isAdmin) || (b.isHost - a.isHost) || a.name.localeCompare(b.name))
      .map((p) => ({ ...p, inviter: p.invitedBy ? byId.get(p.invitedBy) : null }));
  }, [data, blocked, profile]);

  return (
    <div className="page">
      <header className="page-head">
        <h1>People</h1>
        <p>Everyone here was invited by someone already in. Tap a person to see what they’re working on and how to reach them.</p>
      </header>

      {loading ? <SkeletonGrid /> : error ? <ErrorState error={error} onRetry={reload} /> : people.length === 0 ? (
        <EmptyState title="It’s just you so far." body="Invite a couple of people you’d want at the table. Your invites are on your profile." />
      ) : (
        <div className="grid-people">
          {people.map((p) => <PersonCard key={p.id} person={p} />)}
        </div>
      )}
    </div>
  );
}
