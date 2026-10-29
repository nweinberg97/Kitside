import { useMemo, useState } from 'react';
import { PinIcon } from '../components/PersonCard.jsx';
import { ChipGroup, DemoTag, EmptyState, ErrorState, Field, Modal, PersonLink, SkeletonGrid } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { SPOT_TAGS, spotPhoto } from '../lib/constants.js';
import { firstName } from '../lib/format.js';
import { useLoad } from '../lib/useLoad.js';
import { useMemberGate } from '../state/useMemberGate.js';
import { useSession } from '../state/session.jsx';
import { useToast } from '../state/toast.jsx';

/** Places in and around Kits that members actually go to. */
export default function Spots() {
  const { blocked } = useSession();
  const gate = useMemberGate();
  const [tag, setTag] = useState('all');
  const [adding, setAdding] = useState(false);
  const { data, error, loading, reload, setData } = useLoad(() => api.listSpots(), []);

  const list = useMemo(
    () => (data || []).filter((s) => !blocked.has(s.addedBy) && (tag === 'all' || s.tags.includes(tag))),
    [data, tag, blocked],
  );

  return (
    <div className="page">
      <header className="page-head page-head-row">
        <div>
          <h1>Our Spots</h1>
          <p>Where members actually go in Kits: coffee, long dinners, places to work, places to sit by the water.</p>
        </div>
        <button className="btn btn-primary" onClick={() => gate('add a spot') && setAdding(true)}>Add a spot</button>
      </header>

      <ChipGroup label="Filter" options={[{ id: 'all', label: 'Everything' }, ...SPOT_TAGS.map((t) => ({ id: t, label: t }))]} value={tag} onChange={setTag} />

      {loading ? <SkeletonGrid count={4} className="grid-spots" /> : error ? <ErrorState error={error} onRetry={reload} /> : list.length === 0 ? (
        <EmptyState title={tag === 'all' ? 'No spots yet.' : `No ${tag.toLowerCase()} spots yet.`} body="Add the place you’d take a friend who just moved here." />
      ) : (
        <div className="grid-spots">
          {list.map((s) => <SpotCard key={s.id} spot={s} onRemoved={() => setData((d) => d.filter((x) => x.id !== s.id))} />)}
        </div>
      )}

      {adding && <AddSpot onClose={() => setAdding(false)} onAdded={(s) => setData((d) => [s, ...(d || [])])} />}
    </div>
  );
}

function SpotCard({ spot, onRemoved }) {
  const { profile } = useSession();
  const gate = useMemberGate();
  const toast = useToast();
  const [ids, setIds] = useState(spot.regularIds);
  const mine = profile && ids.includes(profile.id);
  const canRemove = profile && !spot.isDemo && (spot.addedBy === profile.id || profile.isAdmin);

  async function toggle() {
    if (!gate('say you go here')) return;
    const prev = ids;
    setIds(mine ? ids.filter((x) => x !== profile.id) : [...ids, profile.id]);
    try { await api.setRegular(spot.id, !mine); } catch (e) { setIds(prev); toast(e.message, 'error'); }
  }

  async function remove() {
    if (!window.confirm(`Remove ${spot.name} from Our Spots?`)) return;
    try { await api.deleteSpot(spot.id); onRemoved(); toast('Spot removed.'); } catch (e) { toast(e.message, 'error'); }
  }

  return (
    <article className="spot-card">
      <div className="spot-photo">
        <img src={spotPhoto(spot)} alt="" loading="lazy" referrerPolicy="no-referrer"
          onError={(e) => { if (!e.currentTarget.dataset.fallback) { e.currentTarget.dataset.fallback = '1'; e.currentTarget.src = spotPhoto({ tags: spot.tags }); } }} />
        {spot.isDemo && <DemoTag />}
        {ids.length > 0 && <span className="spot-count">{ids.length} go here</span>}
      </div>
      <div className="spot-top">
        <h3>{spot.name}</h3>
      </div>
      {spot.area && <p className="place"><PinIcon />{spot.area}</p>}
      {spot.note && <p className="spot-note">{spot.note}</p>}
      {spot.tags.length > 0 && <ul className="tags">{spot.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
      <div className="spot-foot">
        <span className="muted small">
          {spot.addedByProfile ? <>Added by <PersonLink profile={spot.addedByProfile} /></> : 'Added by a member'}
        </span>
        <span className="spot-actions">
          {canRemove && <button type="button" className="text-btn small" onClick={remove}>Remove</button>}
          <button type="button" className={`btn btn-xs ${mine ? 'btn-sun' : 'btn-quiet'}`} aria-pressed={!!mine} onClick={toggle}>{mine ? 'You go here' : 'I go here'}</button>
        </span>
      </div>
    </article>
  );
}

function AddSpot({ onClose, onAdded }) {
  const toast = useToast();
  const { profile } = useSession();
  const [f, setF] = useState({ name: '', area: '', note: '', tags: [], photo: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setF((x) => ({ ...x, [k]: e.target.value })); setError(''); };

  async function submit(e) {
    e.preventDefault();
    if (!f.name.trim()) return setError('What’s it called?');
    if (f.photo.trim() && !/^https:\/\/\S+$/.test(f.photo.trim())) return setError('The photo link should start with https://');
    setBusy(true);
    try {
      const s = await api.createSpot({ name: f.name.trim(), area: f.area.trim(), note: f.note.trim(), tags: f.tags, photo: f.photo.trim() });
      onAdded(s);
      toast(`Added. Thanks, ${firstName(profile?.name)}.`);
      onClose();
    } catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <Modal title="Add a spot" onClose={onClose}>
      <form className="stack" onSubmit={submit} noValidate>
        <Field label="Name" htmlFor="s-name"><input id="s-name" maxLength={60} value={f.name} onChange={set('name')} /></Field>
        <Field label="Area" htmlFor="s-area" hint="Optional. For example: West 4th, Kits Beach, Point Grey Road.">
          <input id="s-area" maxLength={40} value={f.area} onChange={set('area')} />
        </Field>
        <Field label="Why it’s good" htmlFor="s-note" hint={`One line. ${140 - f.note.length} characters left.`}>
          <input id="s-note" maxLength={140} value={f.note} onChange={set('note')} placeholder="Takes groups of six, quiet enough to talk" />
        </Field>
        <Field label="Photo link" htmlFor="s-photo" hint="Optional. Paste a link to a photo of the place. Without one, it uses a photo from around Kits.">
          <input id="s-photo" type="url" maxLength={400} value={f.photo} onChange={set('photo')} placeholder="https://…" />
        </Field>
        <div className="field">
          <span className="field-label">Good for</span>
          <ChipGroup multiple label="Good for" options={SPOT_TAGS} value={f.tags} onChange={(tags) => setF((x) => ({ ...x, tags }))} />
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Adding…' : 'Add spot'}</button>
        </div>
      </form>
    </Modal>
  );
}
