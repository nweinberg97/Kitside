import { useMemo } from 'react';
import { ErrorState, SkeletonGrid } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { firstName } from '../lib/format.js';
import { Link } from '../lib/router.jsx';
import { useLoad } from '../lib/useLoad.js';
import { buildNote } from '../lib/week.js';
import { useSession } from '../state/session.jsx';
import { useToast } from '../state/toast.jsx';

/** The Sunday note, exactly as it goes out: updates only, one line each. */
export default function Note() {
  const { profile } = useSession();
  const toast = useToast();
  const { data, error, loading, reload } = useLoad(async () => {
    const [activities, updates, spots, takeaways] = await Promise.all([
      api.listActivities(), api.listUpdates({ days: 7 }), api.listSpots(), api.listTakeaways(),
    ]);
    return { activities, updates, spots, takeaways };
  }, [profile?.id]);
  const note = useMemo(() => (data ? buildNote(data) : null), [data]);

  async function copy() {
    try { await navigator.clipboard.writeText(note.text); toast('Copied. Paste it into an email.'); }
    catch { toast('Couldn’t copy. Select the text instead.', 'error'); }
  }

  return (
    <div className="page page-narrow">
      <header className="page-head page-head-row">
        <div>
          <h1>Sunday note</h1>
          <p>What goes out each Sunday. Updates only, one line each. Empty sections are left out.</p>
        </div>
        {profile?.isAdmin && note && <button className="btn btn-primary" onClick={copy}>Copy as email</button>}
      </header>

      {loading ? <SkeletonGrid count={1} className="stack" /> : error ? <ErrorState error={error} onRetry={reload} /> : (
        <article className="note" aria-label="This week’s note">
          <header className="note-head">
            <span className="note-from">Kitside</span>
            <h2>{note.subject}</h2>
          </header>
          {note.sections.length === 0 ? <p className="muted">Quiet week. Nothing to send yet.</p> : note.sections.map((s) => (
            <section key={s.key} className="note-section">
              <h3>{s.title}</h3>
              <ul>
                {s.items.map((it) => (
                  <li key={it.id}>
                    {it.who && !it.by && <><Link to={`/people/${it.who.id}`}>{firstName(it.who.name)}</Link>: </>}
                    {it.text}
                    {it.who && it.by && <> <span className="muted">({firstName(it.who.name)})</span></>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <footer className="note-foot">You get this because you’re in Kitside. Turn it off on your profile.</footer>
        </article>
      )}

      {profile?.isAdmin && (
        <p className="fine-print">
          To send it automatically every Sunday, deploy the <code>weekly-note</code> function in Supabase (see the README). Until then, copy it and send it yourself.
        </p>
      )}
    </div>
  );
}
