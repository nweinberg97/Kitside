import { useState } from 'react';
import ActivityCard from '../components/ActivityCard.jsx';
import AnnouncementCard from '../components/AnnouncementCard.jsx';
import MoreMenu from '../components/MoreMenu.jsx';
import { PinIcon } from '../components/PersonCard.jsx';
import ReportDialog from '../components/ReportDialog.jsx';
import { Avatar, DemoTag, EmptyState, ErrorState, Tags } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { firstName } from '../lib/format.js';
import { Link, navigate, Redirect } from '../lib/router.jsx';
import { useLoad } from '../lib/useLoad.js';
import { useSession } from '../state/session.jsx';
import { useToast } from '../state/toast.jsx';

export default function Person({ id }) {
  const { user, profile: me, blocked, setBlocked } = useSession();
  const toast = useToast();
  const [reporting, setReporting] = useState(false);
  const { data, error, loading, reload } = useLoad(async () => {
    const [person, activities, posts] = await Promise.all([api.getProfile(id), api.listActivities(), api.listAnnouncements()]);
    return {
      person,
      hosting: activities.filter((a) => a.hostId === id),
      posts: posts.filter((p) => p.authorId === id).slice(0, 3),
    };
  }, [id, user?.id]);

  if (loading) return <div className="page"><div className="skeleton skeleton-profile" /></div>;
  if (error) return <div className="page"><ErrorState error={error} onRetry={reload} /></div>;

  const person = data.person;
  if (!person) {
    return (
      <div className="page">
        <EmptyState
          title="We can’t show this profile."
          body={user ? 'They may have left Kitside.' : 'Join Kitside to see members’ profiles.'}
          action={<Link className="btn btn-primary" to={user ? '/people' : '/join'}>{user ? 'Back to people' : 'Join Kitside'}</Link>}
        />
      </div>
    );
  }
  if (me && person.id === me.id) return <Redirect to="/me" />;

  const isBlocked = blocked.has(person.id);
  const name = firstName(person.name);

  async function toggleBlock() {
    if (!isBlocked && !window.confirm(`Block ${name}? You won’t see their profile, posts or activities. They aren’t told.`)) return;
    try {
      await setBlocked(person.id, !isBlocked);
      toast(isBlocked ? `${name} is unblocked.` : `${name} is blocked.`);
      if (!isBlocked) navigate('/people');
    } catch (e) { toast(e.message, 'error'); }
  }

  return (
    <div className="page page-narrow">
      <Link to="/people" className="back-link">All people</Link>
      <article className="profile">
        <header className="profile-head">
          <Avatar profile={person} size={96} />
          <div className="profile-id">
            <h1>{person.name} {person.isDemo && <DemoTag />}</h1>
            <p className="profile-role">{person.title || person.role}</p>
            <p className="place"><PinIcon />{person.neighbourhood}{person.isRemote ? ', works remotely' : ''}</p>
          </div>
          {user && (
            <MoreMenu label={`Options for ${name}`} items={[
              { label: `Report ${name}`, onSelect: () => setReporting(true) },
              { label: isBlocked ? `Unblock ${name}` : `Block ${name}`, danger: !isBlocked, onSelect: toggleBlock },
            ]} />
          )}
        </header>

        {person.bio && <p className="profile-bio">{person.bio}</p>}

        <dl className="profile-facts">
          {person.workingOn && (<div><dt>Working on</dt><dd>{person.workingOn}</dd></div>)}
          {person.interests.length > 0 && (<div><dt>Into</dt><dd><Tags items={person.interests} /></dd></div>)}
          {person.lookingFor.length > 0 && (<div><dt>Open to</dt><dd><Tags items={person.lookingFor} tone="sun" /></dd></div>)}
          {person.linkedinUrl && (
            <div><dt>Elsewhere</dt><dd><a href={person.linkedinUrl} target="_blank" rel="noreferrer noopener">LinkedIn profile</a></dd></div>
          )}
        </dl>

        <p className="profile-say-hi">
          The easiest way to meet {name}: say you’re in on something they’re doing, or post something you’d both enjoy.
        </p>
      </article>

      {data.hosting.length > 0 && (
        <section className="profile-section">
          <h2>{name} is hosting</h2>
          <div className="stack">{data.hosting.map((a) => <ActivityCard key={a.id} activity={a} />)}</div>
        </section>
      )}
      {data.posts.length > 0 && (
        <section className="profile-section">
          <h2>Recent posts</h2>
          <div className="stack">{data.posts.map((p) => <AnnouncementCard key={p.id} post={p} />)}</div>
        </section>
      )}

      {reporting && <ReportDialog targetType="profile" targetId={person.id} subject={name} onClose={() => setReporting(false)} />}
    </div>
  );
}
