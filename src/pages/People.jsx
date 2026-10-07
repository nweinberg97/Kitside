import { useMemo, useState } from 'react';
import { DemoButton } from '../components/Layout.jsx';
import PersonCard from '../components/PersonCard.jsx';
import { ChipGroup, EmptyState, ErrorState, SkeletonGrid } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { PEOPLE_FILTERS } from '../lib/constants.js';
import { Link } from '../lib/router.jsx';
import { useLoad } from '../lib/useLoad.js';
import { useSession } from '../state/session.jsx';

export default function People() {
  const { user, profile, blocked } = useSession();
  const [filter, setFilter] = useState('all');
  const { data, error, loading, reload } = useLoad(() => api.listProfiles(), [user?.id]);

  const people = useMemo(() => {
    const test = PEOPLE_FILTERS.find((f) => f.id === filter)?.test || (() => true);
    return (data || []).filter((p) => !blocked.has(p.id) && p.id !== profile?.id && test(p));
  }, [data, filter, blocked, profile]);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Who’s around</h1>
        <p>People who live and work around Kits. Tap someone to see what they’re up to.</p>
      </header>

      <ChipGroup label="Filter people" options={PEOPLE_FILTERS} value={filter} onChange={setFilter} />

      {!user && api.mode === 'live' && (
        <p className="notice">Members’ profiles are visible to other members. <Link to="/join">Join Kitside</Link> to see who’s signed up.</p>
      )}

      {loading ? <SkeletonGrid /> : error ? <ErrorState error={error} onRetry={reload} /> : people.length === 0 ? (
        <EmptyState
          title={filter === 'all' ? 'The first neighbours are joining now.' : 'Nobody matches that filter yet.'}
          body={filter === 'all' ? 'Make a profile and be one of the first faces here.' : 'Try widening the circle.'}
          action={filter === 'all'
            ? <DemoButton className="btn btn-demo">See the demo</DemoButton>
            : <button className="btn btn-quiet" onClick={() => setFilter('all')}>Show everyone</button>}
        />
      ) : (
        <div className="grid-people">
          {people.map((p) => <PersonCard key={p.id} person={p} />)}
        </div>
      )}
    </div>
  );
}
