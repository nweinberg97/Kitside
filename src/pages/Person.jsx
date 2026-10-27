import { useState } from 'react';
import ActivityCard from '../components/ActivityCard.jsx';
import MoreMenu from '../components/MoreMenu.jsx';
import { PinIcon } from '../components/PersonCard.jsx';
import ReportDialog from '../components/ReportDialog.jsx';
import { ContactRow } from '../components/weekly.jsx';
import { Avatar, DemoTag, EmptyState, ErrorState, HostBadge, PersonLink, Tags } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { ago, firstName } from '../lib/format.js';
import { Link, navigate, Redirect } from '../lib/router.jsx';
import { useLoad } from '../lib/useLoad.js';
import { useSession } from '../state/session.jsx';
import { useToast } from '../state/toast.jsx';

export default function Person({ id }) {
  const { user, profile: me, blocked, setBlocked } = useSession();
  const toast = useToast();
  const [reporting, setReporting] = useState(false);
  const { data, error, loading, reload, setData } = useLoad(async () => {
    const [person, activities, updates] = await Promise.all([api.getProfile(id), api.listActivities(), api.listUpdatesBy(id)]);
    const inviter = person?.invitedBy ? await api.getProfile(person.invitedBy) : null;
    return { person, inviter, hosting: activities.filter((a) => a.hostId === id), updates };
  }, [id, user?.id]);

  if (loading) return <div className="page"><div className="skeleton skeleton-profile" /></div>;
  if (error) return <div className="page"><ErrorState error={error} onRetry={reload} /></div>;

  const person = data.person;
  if (!person) {
    return (
      <div className="page">
        <EmptyState
          title="We can’t show this profile."
          body={user ? 'They may have left Kitside.' : 'Profiles are for members.'}
          action={<Link className="btn btn-primary" to={user ? '/people' : '/join'}>{user ? 'Back to people' : 'I have an invite'}</Link>}
        />
      </div>
    );
  }
  if (me && person.id === me.id) return <Redirect to="/me" />;

  const isBlocked = blocked.has(person.id);
  const name = firstName(person.name);
  const working = data.updates.filter((u) => u.kind === 'working_on').slice(0, 6);
  const asks = data.updates.filter((u) => u.kind === 'ask' && !u.resolved && Date.now() - new Date(u.createdAt) < 14 * 864e5);

  async function toggleBlock() {
    if (!isBlocked && !window.confirm(`Block ${name}? You won’t see their profile, updates or events. They aren’t told.`)) return;
    try {
      await setBlocked(person.id, !isBlocked);
      toast(isBlocked ? `${name} is unblocked.` : `${name} is blocked.`);
      if (!isBlocked) navigate('/people');
    } catch (e) { toast(e.message, 'error'); }
  }

  async function toggleHost() {
    const on = !person.isHost;
    try {
      await api.setHost(person.id, on);
      setData((d) => ({ ...d, person: { ...d.person, isHost: on } }));
      toast(on ? `${name} can now host events.` : `${name} is no longer a host.`);
    } catch (e) { toast(e.message, 'error'); }
  }

  return (
    <div className="page page-narrow">
      <Link to="/people" className="back-link">People</Link>
      <article className="profile">
        <header className="profile-head">
          <Avatar profile={person} size={88} />
          <div className="profile-id">
            <h1>{person.name} <HostBadge profile={person} /> {person.isDemo && <DemoTag />}</h1>
            <p className="profile-role">{person.title || person.role}</p>
            <p className="place"><PinIcon />{person.neighbourhood}{person.isRemote ? ', works remotely' : ''}</p>
            {data.inviter && <p className="muted small invited">Invited by <PersonLink profile={data.inviter} /></p>}
          </div>
          {user && (
            <MoreMenu label={`Options for ${name}`} items={[
              me?.isAdmin && !person.isDemo && !person.isAdmin && { label: person.isHost ? 'Remove as host' : 'Make a host', onSelect: toggleHost },
              { label: `Report ${name}`, onSelect: () => setReporting(true) },
              { label: isBlocked ? `Unblock ${name}` : `Block ${name}`, danger: !isBlocked, onSelect: toggleBlock },
            ]} />
          )}
        </header>

        {person.bio && <p className="profile-bio">{person.bio}</p>}

        <section className="profile-block">
          <h2 className="mini-head">Get in touch</h2>
          <ContactRow person={person} />
        </section>

        {(person.interests.length > 0 || person.lookingFor.length > 0) && (
          <dl className="profile-facts">
            {person.interests.length > 0 && (<div><dt>Into</dt><dd><Tags items={person.interests} /></dd></div>)}
            {person.lookingFor.length > 0 && (<div><dt>Open to</dt><dd><Tags items={person.lookingFor} tone="sun" /></dd></div>)}
          </dl>
        )}
      </article>

      {asks.length > 0 && (
        <section className="profile-section">
          <h2>{name} could use help with</h2>
          <ul className="log">{asks.map((u) => <li key={u.id}><span>{u.body}</span><small>{ago(u.createdAt)}</small></li>)}</ul>
        </section>
      )}

      {(working.length > 0 || person.workingOn) && (
        <section className="profile-section">
          <h2>Working on</h2>
          {working.length > 0 ? (
            <ul className="log">{working.map((u, i) => <li key={u.id} className={i === 0 ? 'is-current' : ''}><span>{u.body}</span><small>{ago(u.createdAt)}</small></li>)}</ul>
          ) : <ul className="log"><li className="is-current"><span>{person.workingOn}</span></li></ul>}
        </section>
      )}

      {data.hosting.length > 0 && (
        <section className="profile-section">
          <h2>{name} is hosting</h2>
          <div className="stack">{data.hosting.map((a) => <ActivityCard key={a.id} activity={a} />)}</div>
        </section>
      )}

      {reporting && <ReportDialog targetType="profile" targetId={person.id} subject={name} onClose={() => setReporting(false)} />}
    </div>
  );
}
