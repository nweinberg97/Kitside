import { useState } from 'react';
import { Avatar, DemoTag, EmptyState, ErrorState, Field, Modal, PersonLink, SkeletonGrid } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { ago } from '../lib/format.js';
import { useLoad } from '../lib/useLoad.js';
import { useMemberGate } from '../state/useMemberGate.js';
import { useSession } from '../state/session.jsx';
import { useToast } from '../state/toast.jsx';

/** Insights worth keeping. Saved when something useful comes up, never as a routine. */
export default function Takeaways() {
  const { profile, blocked } = useSession();
  const gate = useMemberGate();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const { data, error, loading, reload, setData } = useLoad(() => api.listTakeaways(), []);
  const list = (data || []).filter((t) => !blocked.has(t.authorId));

  async function remove(t) {
    if (!window.confirm('Delete this takeaway?')) return;
    try { await api.deleteTakeaway(t.id); setData((d) => d.filter((x) => x.id !== t.id)); toast('Deleted.'); } catch (e) { toast(e.message, 'error'); }
  }

  return (
    <div className="page page-narrow">
      <header className="page-head page-head-row">
        <div>
          <h1>Takeaways</h1>
          <p>Lessons members actually learned, with the story behind them. Saved when something useful comes up at the table. Most weeks there won’t be one, and that’s fine.</p>
        </div>
        <button className="btn btn-primary" onClick={() => gate('save a takeaway') && setAdding(true)}>Save a takeaway</button>
      </header>

      {loading ? <SkeletonGrid count={3} className="stack" /> : error ? <ErrorState error={error} onRetry={reload} /> : list.length === 0 ? (
        <EmptyState title="Nothing saved yet." body="When someone says something you want to remember, put it here." />
      ) : (
        <ol className="takeaways">
          {list.map((t) => (
            <li key={t.id} className="takeaway">
              {t.context && <p className="takeaway-context">Came up at {t.context}</p>}
              <h2>{t.title}</h2>
              {t.body && <p>{t.body}</p>}
              <footer>
                <Avatar profile={t.author} size={24} />
                <PersonLink profile={t.author} />
                <span className="muted">· {ago(t.createdAt)}</span>
                {t.isDemo && <DemoTag />}
                {profile && !t.isDemo && (t.authorId === profile.id || profile.isAdmin) && (
                  <button type="button" className="text-btn small push-right" onClick={() => remove(t)}>Delete</button>
                )}
              </footer>
            </li>
          ))}
        </ol>
      )}

      {adding && <AddTakeaway onClose={() => setAdding(false)} onAdded={(t) => setData((d) => [t, ...(d || [])])} />}
    </div>
  );
}

function AddTakeaway({ onClose, onAdded }) {
  const toast = useToast();
  const [f, setF] = useState({ title: '', body: '', context: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!f.title.trim()) return setError('Sum it up in a few words.');
    setBusy(true);
    try {
      onAdded(await api.createTakeaway(f));
      toast('Saved.');
      onClose();
    } catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <Modal title="Save a takeaway" onClose={onClose}>
      <form className="stack" onSubmit={submit} noValidate>
        <Field label="The takeaway" htmlFor="t-title" hint="One line someone could act on. For example: “Ask what they did instead”.">
          <input id="t-title" maxLength={80} value={f.title} onChange={(e) => { setF({ ...f, title: e.target.value }); setError(''); }} />
        </Field>
        <Field label="What happened" htmlFor="t-body" hint={`The real example behind it: numbers, what you tried, what changed. ${280 - f.body.length} characters left.`}>
          <textarea id="t-body" rows={4} maxLength={280} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
        </Field>
        <Field label="Where it came up" htmlFor="t-context" hint="Optional. For example: Build & Break Bread, or Founder breakfast.">
          <input id="t-context" maxLength={60} value={f.context} onChange={(e) => setF({ ...f, context: e.target.value })} />
        </Field>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}
