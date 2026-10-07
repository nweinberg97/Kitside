import { useMemo, useState } from 'react';
import ActivityCard from '../components/ActivityCard.jsx';
import { DemoButton } from '../components/Layout.jsx';
import { ChipGroup, EmptyState, ErrorState, Field, Modal, SkeletonGrid } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { CATEGORIES, DISCLAIMER } from '../lib/constants.js';
import { dayLabel, toYmd } from '../lib/format.js';
import { useLoad } from '../lib/useLoad.js';
import { useMemberGate } from '../state/useMemberGate.js';
import { useSession } from '../state/session.jsx';
import { useToast } from '../state/toast.jsx';

const FILTERS = [{ id: 'all', label: 'Everything' }, ...CATEGORIES.map((c) => ({ id: c.id, label: c.id }))];

export default function Things() {
  const { user, blocked } = useSession();
  const gate = useMemberGate();
  const [filter, setFilter] = useState('all');
  const [creating, setCreating] = useState(false);
  const { data, error, loading, reload, setData } = useLoad(() => api.listActivities(), [user?.id]);

  const groups = useMemo(() => {
    const list = (data || []).filter((a) => !blocked.has(a.hostId) && (filter === 'all' || a.category === filter));
    const byDay = new Map();
    for (const a of list) {
      const key = toYmd(new Date(a.startsAt));
      if (!byDay.has(key)) byDay.set(key, { label: dayLabel(a.startsAt), items: [] });
      byDay.get(key).items.push(a);
    }
    return [...byDay.values()];
  }, [data, filter, blocked]);

  const start = () => gate('start something') && setCreating(true);

  return (
    <div className="page">
      <header className="page-head page-head-row">
        <div>
          <h1>Things to do</h1>
          <p>Runs, work sessions, dinners and walks around Kits. Small plans you can actually make.</p>
        </div>
        <button className="btn btn-primary" onClick={start}>Start something</button>
      </header>

      <ChipGroup label="Filter by category" options={FILTERS} value={filter} onChange={setFilter} />

      {loading ? <SkeletonGrid count={4} className="stack" /> : error ? <ErrorState error={error} onRetry={reload} /> : groups.length === 0 ? (
        <EmptyState
          title="Nothing planned yet."
          body="Be the person who starts something."
          action={<div className="empty-actions"><button className="btn btn-primary" onClick={start}>Create an activity</button><DemoButton className="btn btn-demo">See the demo</DemoButton></div>}
        />
      ) : (
        <div className="day-groups">
          {groups.map((g) => (
            <section key={g.label} className="day-group">
              <h2 className="day-label">{g.label}</h2>
              <div className="stack">
                {g.items.map((a) => (
                  <ActivityCard key={a.id} activity={a} onDeleted={(aid) => setData((d) => d.filter((x) => x.id !== aid))} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="fine-print">{DISCLAIMER}</p>

      {creating && (
        <NewActivity
          onClose={() => setCreating(false)}
          onCreated={(a) => {
            setData((d) => [...(d || []), a].sort((x, y) => new Date(x.startsAt) - new Date(y.startsAt)));
            setFilter('all');
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function NewActivity({ onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({ title: '', category: 'Move', date: toYmd(), time: '18:00', location: '', description: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Give it a short name.';
    if (!form.location.trim()) errs.location = 'Add an approximate spot, like “Kits Beach” or “West 4th”.';
    const startsAt = new Date(`${form.date}T${form.time}`);
    if (Number.isNaN(startsAt.getTime())) errs.date = 'Pick a date and time.';
    else if (startsAt < new Date(Date.now() - 5 * 60e3)) errs.date = 'Pick a time that hasn’t happened yet.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const a = await api.createActivity({
        title: form.title.trim(), category: form.category, location: form.location.trim(),
        description: form.description.trim(), startsAt: startsAt.toISOString(),
      });
      toast('It’s on. You’re in by default.');
      onCreated(a);
    } catch (err) {
      setErrors({ form: err.message });
      setBusy(false);
    }
  }

  return (
    <Modal title="Start something" onClose={onClose}>
      <form className="stack" onSubmit={submit} noValidate>
        <Field label="What’s the plan?" htmlFor="a-title" error={errors.title}>
          <input id="a-title" maxLength={80} placeholder="Sunset walk to Jericho" value={form.title} onChange={set('title')} />
        </Field>
        <div className="field">
          <span className="field-label">Category</span>
          <ChipGroup label="Category" options={CATEGORIES.map((c) => c.id)} value={form.category} onChange={(category) => setForm((f) => ({ ...f, category }))} />
        </div>
        <div className="field-row">
          <Field label="Date" htmlFor="a-date" error={errors.date}>
            <input id="a-date" type="date" min={toYmd()} value={form.date} onChange={set('date')} />
          </Field>
          <Field label="Time" htmlFor="a-time">
            <input id="a-time" type="time" value={form.time} onChange={set('time')} />
          </Field>
        </div>
        <Field label="Roughly where?" htmlFor="a-loc" error={errors.location} hint="Keep it approximate. Never share a home address.">
          <input id="a-loc" maxLength={80} placeholder="Kits Beach" value={form.location} onChange={set('location')} />
        </Field>
        <Field label="A line or two about it" htmlFor="a-desc">
          <textarea id="a-desc" rows={3} maxLength={400} placeholder="Easy pace. Bring a jacket." value={form.description} onChange={set('description')} />
        </Field>
        {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Posting…' : 'Post activity'}</button>
        </div>
      </form>
    </Modal>
  );
}
