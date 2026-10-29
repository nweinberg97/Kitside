import { useMemo, useState } from 'react';
import ActivityCard from '../components/ActivityCard.jsx';
import { AskList, HostEventDialog, MoreLink, SessionCard, UpdateComposer, WorkingOnList } from '../components/weekly.jsx';
import { EmptyState, ErrorState, SkeletonGrid } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { firstName } from '../lib/format.js';
import { Link } from '../lib/router.jsx';
import { useLoad } from '../lib/useLoad.js';
import { inNextWeek, latestWorkingOn, openAsks, weekLabel } from '../lib/week.js';
import { useSession } from '../state/session.jsx';

/** Members' home: this week's session, other events, what people are on, and who needs help. */
export default function Week() {
  const { profile, blocked } = useSession();
  const [hosting, setHosting] = useState(null);
  const { data, error, loading, reload, setData } = useLoad(async () => {
    const [activities, updates, people, takeaways, spots] = await Promise.all([
      api.listActivities(), api.listUpdates({ days: 7 }), api.listProfiles(), api.listTakeaways(), api.listSpots(),
    ]);
    return { activities, updates, people, takeaways, spots };
  }, [profile?.id]);

  const view = useMemo(() => {
    if (!data) return null;
    const ok = (id) => !blocked.has(id);
    const week = data.activities.filter((a) => ok(a.hostId) && inNextWeek(a.startsAt));
    const session = week.find((a) => a.isSession) || null;
    return {
      session,
      others: week.filter((a) => a !== session),
      working: latestWorkingOn(data.updates.filter((u) => ok(u.authorId))),
      asks: openAsks(data.updates.filter((u) => ok(u.authorId))),
      peopleById: new Map(data.people.map((p) => [p.id, p])),
      takeaway: data.takeaways[0] || null,
      spot: [...data.spots].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null,
    };
  }, [data, blocked]);

  const canHost = profile?.isHost || profile?.isAdmin;
  const addUpdate = (u) => setData((d) => ({ ...d, updates: [u, ...d.updates] }));

  return (
    <div className="page week">
      <header className="page-head page-head-row">
        <div>
          <p className="eyebrow">{weekLabel()}</p>
          <h1>This week{profile ? `, ${firstName(profile.name)}` : ''}</h1>
        </div>
        <div className="head-actions">
          <Link to="/note" className="btn btn-quiet">Sunday note</Link>
          {canHost && <button className="btn btn-primary" onClick={() => setHosting({ asSession: false })}>Host something</button>}
        </div>
      </header>

      {loading ? <SkeletonGrid count={3} className="stack" /> : error ? <ErrorState error={error} onRetry={reload} /> : (
        <>
          {view.session ? (
            <SessionCard key={view.session.id} session={view.session} peopleById={view.peopleById} />
          ) : (
            <div className="session session-empty">
              <div className="session-photo" aria-hidden="true" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}img/covers/point.jpg)` }} />
              <div className="session-body">
                <p className="session-kicker">The weekly session</p>
                <h2>Nothing planned yet this week.</h2>
                <p className="session-desc">
                  {canHost ? 'Pick a time and a spot. People say they’re in, and dinner happens if enough stay.' : 'A host will post it here. You’ll see it in Sunday’s note too.'}
                </p>
                {canHost && <div className="session-actions"><button className="btn btn-sun" onClick={() => setHosting({ asSession: true })}>Plan this week’s session</button></div>}
              </div>
            </div>
          )}

          <div className="week-grid">
            <section className="week-col" aria-labelledby="h-working">
              <div className="col-head">
                <h2 id="h-working">Working on</h2>
                <MoreLink to="/updates">All updates</MoreLink>
              </div>
              <UpdateComposer kind="working_on" onPosted={addUpdate} compact />
              <WorkingOnList items={view.working.slice(0, 8)} />
            </section>

            <section className="week-col" aria-labelledby="h-asks">
              <div className="col-head">
                <h2 id="h-asks">Needs help</h2>
                <MoreLink to="/updates?tab=ask">All asks</MoreLink>
              </div>
              <UpdateComposer kind="ask" onPosted={addUpdate} compact />
              <AskList items={view.asks.slice(0, 8)} onChanged={reload} />
            </section>
          </div>

          <section className="week-section" aria-labelledby="h-also">
            <div className="col-head">
              <h2 id="h-also">Also this week</h2>
              {!canHost && <span className="muted small">Have an idea? Post it as an ask and a host can pick it up.</span>}
            </div>
            {view.others.length === 0 ? (
              <EmptyState title="Nothing else on the calendar." body={canHost ? 'Runs, swims, breakfasts. Small plans work best.' : 'Hosts post runs, swims and the odd breakfast here.'}
                action={canHost && <button className="btn btn-primary" onClick={() => setHosting({ asSession: false })}>Host something</button>} />
            ) : (
              <div className="grid-2">
                {view.others.map((a) => <ActivityCard key={a.id} activity={a} onDeleted={reload} />)}
              </div>
            )}
          </section>

          {(view.takeaway || view.spot) && (
            <section className="week-section week-extras">
              {view.takeaway && (
                <Link to="/takeaways" className="extra-card">
                  <span className="eyebrow">Latest takeaway</span>
                  <strong>{view.takeaway.title}</strong>
                  <span className="muted">{firstName(view.takeaway.author?.name)}{view.takeaway.context ? ` · ${view.takeaway.context}` : ''}</span>
                </Link>
              )}
              {view.spot && (
                <Link to="/spots" className="extra-card extra-spot">
                  <span className="eyebrow">Newest spot</span>
                  <strong>{view.spot.name}</strong>
                  <span className="muted">{view.spot.note || view.spot.area}</span>
                </Link>
              )}
            </section>
          )}
        </>
      )}

      {hosting && <HostEventDialog asSession={hosting.asSession} onClose={() => setHosting(null)} onCreated={reload} />}
    </div>
  );
}
