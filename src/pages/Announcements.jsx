import { useMemo, useState } from 'react';
import AnnouncementCard from '../components/AnnouncementCard.jsx';
import { DemoButton } from '../components/Layout.jsx';
import { Avatar, ChipGroup, EmptyState, ErrorState, SkeletonGrid } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { CATEGORIES } from '../lib/constants.js';
import { toYmd } from '../lib/format.js';
import { useLoad } from '../lib/useLoad.js';
import { useMemberGate } from '../state/useMemberGate.js';
import { useSession } from '../state/session.jsx';
import { useToast } from '../state/toast.jsx';

export default function Announcements() {
  const { user, blocked } = useSession();
  const { data, error, loading, reload, setData } = useLoad(() => api.listAnnouncements(), [user?.id]);
  const [freshId, setFreshId] = useState(null);

  const posts = useMemo(() => (data || []).filter((p) => !blocked.has(p.authorId)), [data, blocked]);

  return (
    <div className="page page-narrow">
      <header className="page-head">
        <h1>Announcements</h1>
        <p>The neighbourhood board. Ask for a running buddy, a designer, a dinner crowd, or a second opinion.</p>
      </header>

      <Composer onPosted={(p) => { setData((d) => [p, ...(d || [])]); setFreshId(p.id); }} />

      {loading ? <SkeletonGrid count={3} className="stack" /> : error ? <ErrorState error={error} onRetry={reload} /> : posts.length === 0 ? (
        <EmptyState title="It’s quiet around here." body="Start the conversation." action={<DemoButton className="btn btn-demo">See the demo</DemoButton>} />
      ) : (
        <div className="stack board">
          {posts.map((p) => (
            <AnnouncementCard key={p.id} post={p} fresh={p.id === freshId} onDeleted={(id) => setData((d) => d.filter((x) => x.id !== id))} />
          ))}
        </div>
      )}
    </div>
  );
}

const EMPTY = { title: '', details: '', happensOn: '', happensAt: '', location: '', category: '' };

function Composer({ onPosted }) {
  const { profile } = useSession();
  const gate = useMemberGate();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!gate('post to Kitside')) return;
    if (!form.title.trim()) return setError('Say what you want to do.');
    setBusy(true); setError('');
    try {
      const post = await api.createAnnouncement({
        title: form.title.trim(), details: form.details.trim(), location: form.location.trim(),
        happensOn: form.happensOn || null, happensAt: form.happensAt || null, category: form.category || null,
      });
      onPosted(post);
      setForm(EMPTY); setMore(false);
      toast('Posted to Kitside.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="composer" onSubmit={submit} noValidate>
      <div className="composer-main">
        {profile && <Avatar profile={profile} size={40} />}
        <label className="sr-only" htmlFor="post-title">What do you want to do?</label>
        <input
          id="post-title"
          className="composer-input"
          maxLength={140}
          placeholder="What do you want to do?"
          value={form.title}
          onChange={(e) => { set('title')(e); setError(''); }}
          onFocus={() => form.title || setMore(true)}
        />
      </div>
      {more && (
        <div className="composer-more">
          <label className="field">
            <span>Details <em className="optional">Optional</em></span>
            <textarea rows={2} maxLength={500} placeholder="Easy pace. Coffee after." value={form.details} onChange={set('details')} />
          </label>
          <div className="field-row field-row-3">
            <label className="field"><span>Date</span><input type="date" min={toYmd()} value={form.happensOn} onChange={set('happensOn')} /></label>
            <label className="field"><span>Time</span><input type="time" value={form.happensAt} onChange={set('happensAt')} /></label>
            <label className="field"><span>Roughly where</span><input maxLength={80} placeholder="Point Grey Road" value={form.location} onChange={set('location')} /></label>
          </div>
          <div className="field">
            <span className="field-label">Category</span>
            <ChipGroup label="Category" options={CATEGORIES.map((c) => c.id)} value={form.category}
              onChange={(c) => setForm((f) => ({ ...f, category: f.category === c ? '' : c }))} />
          </div>
        </div>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="composer-actions">
        <button type="button" className="text-btn" onClick={() => setMore((m) => !m)} aria-expanded={more}>
          {more ? 'Fewer details' : 'Add a date, time or place'}
        </button>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Posting…' : 'Post to Kitside'}</button>
      </div>
    </form>
  );
}
