import { useMemo } from 'react';
import ActivityCard from '../components/ActivityCard.jsx';
import KitsScene, { PIN_SPOTS } from '../components/KitsScene.jsx';
import PersonCard from '../components/PersonCard.jsx';
import { SkeletonGrid } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { dayLabel, firstName, timeLabel } from '../lib/format.js';
import { href, Link } from '../lib/router.jsx';
import { useLoad } from '../lib/useLoad.js';
import { useSession } from '../state/session.jsx';

const WHY = [
  ['Meet people nearby', 'See who lives and works around Kits, a few blocks from you.'],
  ['Find collaborators', 'Spot people with the skills, ideas and interests that complement yours.'],
  ['Get out of the house', 'Runs, work sessions, classes, coffee and dinners, most of them a short walk away.'],
  ['Share what you’re building', 'Post a quick note and see who wants to help, join or just chat.'],
  ['Make Kits feel smaller', 'Turn a neighbourhood of strangers into people you wave at on West 4th.'],
];

export default function Home() {
  const { profile, blocked } = useSession();
  const people = useLoad(() => api.listProfiles(), []);
  const things = useLoad(() => api.listActivities(), []);

  const visiblePeople = useMemo(
    () => (people.data || []).filter((p) => !blocked.has(p.id) && p.id !== profile?.id),
    [people.data, blocked, profile],
  );
  const upcoming = useMemo(
    () => (things.data || []).filter((a) => !blocked.has(a.hostId)).slice(0, 4),
    [things.data, blocked],
  );

  const pins = useMemo(() => {
    const ps = visiblePeople.slice(0, 3).map((p) => ({
      key: p.id, kind: 'person', hue: p.avatarHue, initial: firstName(p.name)[0],
      line1: `${firstName(p.name)}, ${(p.title || p.role).toLowerCase()}`,
      line2: p.workingOn ? truncate(p.workingOn, 34) : `Into ${p.interests.slice(0, 2).join(' and ').toLowerCase()}`,
      href: href(`/people/${p.id}`),
    }));
    const a = upcoming[0];
    const act = a && {
      key: a.id, kind: 'activity',
      line1: truncate(a.title, 28),
      line2: `${dayLabel(a.startsAt)}, ${timeLabel(a.startsAt)}. ${a.interestedIds.length} in`,
      href: href('/things'),
    };
    // Spot order: [log, path, pool, tree]. Keep a person and the activity in the two always-visible spots.
    const ordered = [ps[0], act, ps[1], ps[2]].filter(Boolean);
    return ordered.map((p, i) => ({ ...p, ...PIN_SPOTS[i] }));
  }, [visiblePeople, upcoming]);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>Good people, right&nbsp;nearby.</h1>
          <div className="hero-sub">
          <p className="hero-lede">
            Kitside is a local community for people in Kits who build, work, create, explore, and want to meet more
            interesting people nearby.
          </p>
          <div className="hero-actions">
            {profile ? (
              <>
                <Link to="/people" className="btn btn-primary btn-lg">See who’s around</Link>
                <Link to="/announcements" className="btn btn-ghost btn-lg">Post something</Link>
              </>
            ) : (
              <>
                <Link to="/join" className="btn btn-primary btn-lg">Join Kitside</Link>
                <Link to="/people" className="btn btn-ghost btn-lg">Explore Kitside</Link>
              </>
            )}
          </div>
          </div>
        </div>
        <div className="hero-scene">
          <KitsScene pins={pins} />
        </div>
      </section>

      <section className="band">
        <div className="section-head">
          <h2>People around here</h2>
          <p>Designers, engineers, founders, a physio, a composer. Some building companies, some just new in town.</p>
        </div>
        {people.loading ? <SkeletonGrid count={4} className="grid-4" /> : (
          <div className="grid-4">
            {visiblePeople.slice(0, 4).map((p) => <PersonCard key={p.id} person={p} compact />)}
          </div>
        )}
        <Link to="/people" className="text-link">Browse everyone{visiblePeople.length ? ` (${visiblePeople.length})` : ''}</Link>
      </section>

      <section className="band band-water">
        <div className="section-head">
          <h2>Things happening around Kits</h2>
          <p>Small plans, not big events. Say you’re in and show up.</p>
        </div>
        {things.loading ? <SkeletonGrid count={4} className="grid-2" /> : (
          <div className="grid-2">
            {upcoming.map((a) => <ActivityCard key={a.id} activity={a} compact />)}
          </div>
        )}
        <Link to="/things" className="text-link">See everything this week</Link>
      </section>

      <section className="band why">
        <h2 className="why-title">Why Kitside?</h2>
        <dl className="why-list">
          {WHY.map(([t, d]) => (
            <div key={t}>
              <dt>{t}</dt>
              <dd>{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      {!profile && (
        <section className="closing">
          <div className="closing-inner">
            <h2>Your people are probably a few blocks away.</h2>
            <p>Make a profile in about a minute. Only your neighbourhood is ever shown, never your address.</p>
            <Link to="/join" className="btn btn-sun btn-lg">Join Kitside</Link>
          </div>
          <svg className="closing-ridge" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 120 V70 L120 52 L210 66 L300 30 L370 46 L425 12 L450 26 L480 10 L520 40 L640 54 L760 34 L880 60 L1000 28 L1110 50 L1220 36 L1340 58 L1440 44 V120 Z" fill="#2B4A41" />
          </svg>
        </section>
      )}
    </>
  );
}

function truncate(s, n) {
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
}
